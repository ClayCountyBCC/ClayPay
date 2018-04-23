using System;
using System.Collections.Generic;
using System.Linq;
using Dapper;
using System.Web;

namespace ClayPay.Models.ImpactFees
{
  public class BuilderAllocation
  {
    public string Agreement_Number { get; set; }
    public string Builder_Name { get; set; }
    public int? Id { get; set; } = null;
    public decimal Allocation_Amount { get; set; }
    public string Allocation_Amount_Formatted
    {
      get
      {
        try
        {
          return Allocation_Amount.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }

      }
    }
    public decimal Amount_Currently_Allocated { get; set; }
    public string Amount_Currently_Allocated_Formatted
    {
      get
      {
        try
        {
          return Amount_Currently_Allocated.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }

      }
    }
    public string Audit_Log { get; set; }

    public BuilderAllocation()
    {

    }

    private bool Data_Changed(BuilderAllocation current)
    {
      if (Allocation_Amount_Formatted != current.Allocation_Amount_Formatted) return true;

      if (Builder_Name != current.Builder_Name) return true;

      return false;
    }

    public static BuilderAllocation Get(string Agreement_Number, int Builder_Id)
    {
      var data = GetList(Agreement_Number, Builder_Id);
      if (data.Count() == 1)
      {
        return data.First();
      }
      else
      {
        return null;// We got a response we didn't expect,
      }
    }

    public List<string> Validate()
    {

      Agreement_Number = Agreement_Number.Trim();
      Builder_Name = Builder_Name.Trim().ToUpper();
      List<string> errors = new List<string>();
      if (Allocation_Amount > 0)
      {
        var currentAgreement = CombinedAllocation.Get(Agreement_Number).First();
        if (Id.HasValue)
        {
          var currentAllocation = Get(Agreement_Number, Id.Value);
          decimal p = currentAgreement.Developer_Amount_Currently_Allocated - currentAllocation.Allocation_Amount + Allocation_Amount;
          if (currentAgreement.Agreement_Amount < p)
          {
            errors.Add("This allocation is for an amount greater than the amount remaining for this Developer.  Please check your numbers and try again.");
          }
        }
        else
        {
          // this allocation has not yet been saved
          decimal p = currentAgreement.Developer_Amount_Currently_Allocated + Allocation_Amount;
          if (currentAgreement.Agreement_Amount < p )
          {
            errors.Add("This allocation is for an amount greater than the amount remaining for this Developer.  Please check your numbers and try again.");
          }
        }
      }
      if (Agreement_Number.Length == 0)
      {
        errors.Add("No Agreement Number was specified.");
      }
      if(Builder_Name.Length == 0)
      {
        errors.Add("No Builder Name was specified.");
      }
      if (Allocation_Amount < 0)
      {
        errors.Add("The Amount Allocated cannot be a negative number.");
      }
      if(Allocation_Amount < Amount_Currently_Allocated)
      {
        errors.Add("The Amount Allocated cannot be set to less than the amount currently allocated to Permits.");
      }
      return errors;
    }

    public bool Save(string Username)
    {
      Audit_Log = Constants.Create_Audit_Log(Username, "Record Created");
      string query = @"
        INSERT INTO ImpactFees_Builder_Allocations
          (Agreement_Number, Builder_Name, Amount_Allocated, Audit_Log)
        VALUES 
          (@Agreement_Number, @Builder_Name, @Allocation_Amount, @Audit_Log)";
      return Constants.Save_Data<BuilderAllocation>(query, this);
    }

    public bool Update(string Username)
    {
      if (!Id.HasValue)
      {
        return Save(Username);
      }
      var current = BuilderAllocation.Get(Agreement_Number, Id.Value);
      if (current == null) return false;
      if (Data_Changed(current))
      {
        string s = "";
        if (Allocation_Amount_Formatted != current.Allocation_Amount_Formatted)
        {
          s = Constants.Create_Audit_Log(Username, "Amount Allocated", current.Allocation_Amount_Formatted, Allocation_Amount_Formatted);
          Audit_Log = s + '\n' + current.Audit_Log;
        }

        if (Builder_Name != current.Builder_Name)
        {
          s = Constants.Create_Audit_Log(Username, "Builder Name", current.Builder_Name, Builder_Name);
          Audit_Log = s + '\n' + current.Audit_Log;
        }
        
        string query = @"
        UPDATE ImpactFees_Builder_Allocations 
          SET 
            Amount_Allocated=@Allocation_Amount,
            Builder_Name=@Builder_Name,
            Audit_Log=@Audit_Log
          WHERE 
            Id=@Id";
        return Constants.Save_Data<BuilderAllocation>(query, this);
      }
      else
      {
        return true;
      }
    }

    public static List<BuilderAllocation> GetList(string Agreement_Number, int Builder_Id = -1)
    {
      var dp = new DynamicParameters();
      dp.Add("@Agreement_Number", Agreement_Number);
      string query = @"
        WITH CurrentAllotment AS (
          SELECT
            Builder_Id,
            SUM(Amount_Allocated) Amount_Currently_Allocated    
          FROM ImpactFees_Permit_Allocations
          GROUP BY Builder_Id
        )
        SELECT
          Agreement_Number,
          Builder_Name,
          B.Id,
          Amount_Allocated Allocation_Amount,
          C.Amount_Currently_Allocated,
          Audit_Log
        FROM ImpactFees_Builder_Allocations B
        LEFT OUTER JOIN CurrentAllotment C ON B.Id = C.Builder_Id       
        WHERE B.Agreement_Number = @Agreement_Number
";

      if (Builder_Id > -1)
      {
        query += "AND Id=@Builder_Id;";
        dp.Add("@Builder_Id", Builder_Id);
      }
      return Constants.Get_Data<BuilderAllocation>(query, dp);
    }

  }
}