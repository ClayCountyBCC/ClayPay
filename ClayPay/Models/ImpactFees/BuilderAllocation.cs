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
    public int Id { get; set; }
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

    public BuilderAllocation()
    {

    }

    private bool Data_Changed(BuilderAllocation current)
    {
      if (Amount_Allocated_Formatted != current.Amount_Allocated_Formatted) return true;

      if (Builder_Name != current.Builder_Name) return true;

      return false;
    }

    public static BuilderAllocation Get(int Builder_Id)
    {
      var dp = new DynamicParameters();
      dp.Add("@Builder_Id", Builder_Id);
      string query = @"
        SELECT
          Agreement_Number,
          Builder_Name,
          Id,
          Amount_Allocated,
          Audit_Log
        FROM ImpactFees_Builder_Allocations
        WHERE Id=@Builder_Id;";
      var data = Constants.Get_Data<BuilderAllocation>(query, dp);
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
      Builder_Name = Builder_Name.Trim();
      List<string> errors = new List<string>();
      if (Agreement_Number.Length == 0)
      {
        errors.Add("No Agreement Number was specified.");
      }
      if(Builder_Name.Length == 0)
      {
        errors.Add("No Builder Name was specified.");
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
        INSERT INTO ImpactFees_Builder_Allocations
          (Agreement_Number, Builder_Name, Amount_Allocated, Audit_Log)
        VALUES 
          (@Agreement_Number, @Builder_Name, @Amount_Allocated, @Audit_Log)";
      return Constants.Save_Data<BuilderAllocation>(query, this);
    }

    public bool Update(string Username)
    {
      var current = BuilderAllocation.Get(Id);
      if (current == null) return false;
      if (Data_Changed(current))
      {
        string s = "";
        if (Amount_Allocated_Formatted != current.Amount_Allocated_Formatted)
        {
          s = Constants.Create_Audit_Log(Username, "Amount Allocated", current.Amount_Allocated_Formatted, Amount_Allocated_Formatted);
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
            Amount_Allocated=@Amount_Allocated,
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

  }
}