using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace ClayPay.Models.ImpactFees
{
  public class PermitAllocation
  {
    public int Builder_Id { get; set; } = -1;
    public string Permit_Number { get; set; } = "";
    public decimal Amount_Allocated { get; set; } = -1;
    public string Amount_Allocated_Formatted
    {
      get
      {
        try
        {
          return Amount_Allocated.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }

      }
    }
    public string Audit_Log { get; set; } = "";

    public PermitAllocation()
    {
    }

    private bool Data_Changed(PermitAllocation current)
    {
      if (Builder_Id != current.Builder_Id) return true;

      if (Amount_Allocated_Formatted != current.Amount_Allocated_Formatted) return true;

      return false;
    }

    public static PermitAllocation Get(string Permit_Number)
    {
      var dp = new DynamicParameters();
      dp.Add("@Permit_Number", Permit_Number);
      string query = @"
        SELECT
          Builder_Id,
          Permit_Number,
          Amount_Allocated,
          Audit_Log
        FROM ImpactFees_Permit_Allocations
        WHERE
          Permit_Number=@Permit_Number;";
      var tmp = Constants.Get_Data<PermitAllocation>(query, dp);
      if (tmp == null) return null; // an error occurred
      if (tmp.Count() == 0) return new PermitAllocation();
      return tmp.First();
    }

    public List<string> Validate()
    {
      List<string> errors = new List<string>();
      Permit_Number = Permit_Number.Trim();
      var current = PermitAllocation.Get(Permit_Number);
      var pif = PermitImpactFee.Get(Permit_Number);
      if(pif.Error_Text.Length > 0)
      {
        errors.Add(pif.Error_Text);        
      }
      if(current.Permit_Number.Length == 0)
      {
        // the checks we perform in this block are for
        // new credits only
        if (pif.Cashier_Id.Length > 0)
        {
          errors.Add("This fee has already been paid, so it is not eligible for the impact fee credit process.");
        }
      }      
      if(Builder_Id < 0)
      {
        errors.Add("The Builder Id provided was invalid.");
      }
      if (Permit_Number.Length == 0)
      {
        errors.Add("No Permit Number was specified.");
      }
      if(Permit_Number.Length != 8)
      {
        errors.Add("Permit Number was not 8 digits.");
      }
      if (Amount_Allocated < 0)
      {
        errors.Add("The Amount Allocated cannot be a negative number.");
      }
      return errors;
    }

    public bool Update(string Username)
    {
      var current = PermitAllocation.Get(Permit_Number);
      if (current == null) return false; // some kind of error occurred while getting the current permit data.
      if (current.Audit_Log.Length > 0) // this record already exists
      {
        if (!Data_Changed(current)) return true; // if the data doesn't change, we don't need to do anything.

        string s = "";
        if (Amount_Allocated_Formatted != current.Amount_Allocated_Formatted)
        {
          // If the amount changes, we will also need to reapply the credit 
          // to the ccCashierItem table.
          s = Constants.Create_Audit_Log(Username, "Amount Allocated", current.Amount_Allocated_Formatted, Amount_Allocated_Formatted);
          Audit_Log = s + '\n' + current.Audit_Log;
        }

        if (Builder_Id != current.Builder_Id)
        {
          // we're going to get all of the combined allocation data now
          // in order to create a proper audit log
          var data = CombinedAllocation.Get();
          var currentBuilder = (from d in data
                                where d.Builder_Id == current.Builder_Id
                                select d).First();

          var newBuilder = (from d in data
                         where d.Builder_Id == Builder_Id
                         select d).First();
          // check to see if the builder name changed here
          var currentBuilderName = currentBuilder.Builder_Name + " (" + currentBuilder.Builder_Id + ")";
          var newBuilderName = newBuilder.Builder_Name + " (" + newBuilder.Builder_Id + ")";
          s = Constants.Create_Audit_Log(Username, "Builder", currentBuilderName, newBuilderName);
          Audit_Log = s + '\n' + current.Audit_Log;

          // check to see if the agreement changed
          if(currentBuilder.Agreement_Number != newBuilder.Agreement_Number)
          {
            s = Constants.Create_Audit_Log(Username, "Agreement Number", currentBuilder.Agreement_Number, newBuilder.Agreement_Number);
            Audit_Log = s + '\n' + current.Audit_Log;
          }

        }
      }
      else // this is a new permit number
      {
        
        Audit_Log = Constants.Create_Audit_Log(Username, "Record Created");
        // will also need to apply the credit.
      }
      string query = @"
        MERGE ImpactFees_Permit_Allocations WITH (HOLDLOCK) PA
        USING (SELECT @Permit_Number, @Builder_Id, @Amount_Allocated, @Audit_Log) AS P 
          (Permit_Number, Builder_Id, Amount_Allocated, Audit_Log) ON PA.Permit_Number = P.Permit_Number
        WHEN MATCHED THEN
          UPDATE 
            SET 
              Amount_Allocated=@Amount_Allocated,
              Builder_Id=@Builder_Id,
              Audit_Log=@Audit_Log
        WHEN NOT MATCHED THEN
          INSERT 
            (Permit_Number, Builder_Id, Amount_Allocated, Audit_Log)
          VALUES 
            (@Permit_Number, @Builder_Id, @Amount_Allocated, @Audit_Log);";
      return Constants.Save_Data<PermitAllocation>(query, this);
    }

    public bool ApplyCredit()
    {
      var dbArgs = new Dapper.DynamicParameters();
      //dbArgs.Add("@cId", dbType: DbType.String, size: 9, direction: ParameterDirection.Output);
      //dbArgs.Add("@otId", dbType: DbType.Int64, direction: ParameterDirection.Output);
      //dbArgs.Add("@PayerName", ccd.FirstName + " " + ccd.LastName);
      //dbArgs.Add("@Total", ccd.Total);
      //dbArgs.Add("@TransId", this.UniqueId);
      //dbArgs.Add("@ItemIds", ccd.ItemIds);
      //DECLARE @cId VARCHAR(9) = NULL;
      //DECLARE @otId int = NULL;
      string query = @"
        DECLARE @now DATETIME = GETDATE();
        
        BEGIN TRANSACTION;

        BEGIN TRY
          EXEC dbo.prc_upd_ccNextCashierId @cId OUTPUT;
          
          EXEC dbo.prc_ins_ccCashier 
            @OTId = @otId OUTPUT, 
            @CashierId = @cId, 
            @LstUpdt = NULL, 
            @Name = @PayerName,
            @TransDt = @now;

          EXEC dbo.prc_upd_ccCashierX
            @OTId = @otId,
            @Name = @PayerName,
            @CoName = '',
            @Phone = '',
            @Addr1 = '',
            @Addr2 = '',
            @NTUser='claypay';

          EXEC dbo.prc_upd_ccCashierPmt 
            @PayId = 0,
            @OTId = @otId, 
            @PmtType ='IFCR',
            @AmtApplied = @Total,
            @AmtTendered = @Total, 
            @PmtInfo = @PayerName,
            @CkNo = @TransId;

          UPDATE ccCashierItem 
            SET OTId = @otId, CashierId = @cId
            WHERE itemId IN @ItemIds
      
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        END CATCH;
        
        IF @@TRANCOUNT > 0
          COMMIT TRANSACTION;";
      try
      {
        var i = Constants.Exec_Query(query, dbArgs);
        //CashierId = dbArgs.Get<string>("@cId");
        //OTId = dbArgs.Get<Int64>("@otId");
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }




  }
}