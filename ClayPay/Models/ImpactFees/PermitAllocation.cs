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
    public string Permit_Number { get; set; }
    public decimal Amount_Allocated { get; set; }
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
    public string Audit_Log { get; set; }

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
          Agreement_Number,
          Builder_Id,
          Permit_Number,
          Amount_Allocated,
          Audit_Log
        FROM ImpactFees_Permit_Allocations
        WHERE
          Permit_Number=@Permit_Number;";
      var tmp = Constants.Get_Data<PermitAllocation>(query, dp);
      if (tmp.Count() == 1)
      {
        return tmp.First();
      }
      else
      {
        return null;
      }
    }

    public List<string> Validate()
    {
      Permit_Number = Permit_Number.Trim();

      List<string> errors = new List<string>();
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

  }
}