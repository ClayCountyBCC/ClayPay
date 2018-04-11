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
      if (Amount_Allocated < 0)
      {
        errors.Add("The Amount Allocated cannot be a negative number.");
      }
      return errors;
    }

    public bool Save(string Username)
    {
      Audit_Log = DateTime.Now.ToString("g1") + " by " + Username + ": Record Created.";
      string query = @"
        INSERT INTO ImpactFees_Permit_Allocations
          (Permit_Number, Agreement_Number, Builder_Id, Amount_Allocated, Audit_Log)
        VALUES 
          (@Permit_Number, @Agreement_Number, @Builder_Id, @Amount_Allocated, @Audit_Log)";
      return Constants.Save_Data<PermitAllocation>(query, this);
    }

    public bool Update(string Username)
    {
      var current = PermitAllocation.Get(Permit_Number);
      if (current == null) return false;
      if (Data_Changed(current))
      {
        string s = "";
        if (Amount_Allocated_Formatted != current.Amount_Allocated_Formatted)
        {
          s = Constants.Create_Audit_Log(Username, "Amount Allocated", current.Amount_Allocated_Formatted, Amount_Allocated_Formatted);
          Audit_Log = s + '\n' + current.Audit_Log;
        }

        if (Builder_Id != current.Builder_Id)
        {
          s = Constants.Create_Audit_Log(Username, "Builder Id", current.Builder_Id.ToString(), Builder_Id.ToString());
          Audit_Log = s + '\n' + current.Audit_Log;
        }

        string query = @"
        UPDATE ImpactFees_Permit_Allocations 
          SET 
            Amount_Allocated=@Amount_Allocated,
            Builder_Id=@Builder_Id,
            Audit_Log=@Audit_Log
          WHERE 
            Id=@Id";
        return Constants.Save_Data<PermitAllocation>(query, this);
      }
      else
      {
        return true;
      }
    }

  }
}