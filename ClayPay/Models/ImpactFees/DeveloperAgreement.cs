using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace ClayPay.Models.ImpactFees
{
  public class DeveloperAgreement
  {
    public string Agreement_Number { get; set; }
    public decimal Agreement_Amount { get; set; } = -1;
    public string Agreement_Amount_Formatted
    {
      get
      {
        try
        {
          return Agreement_Amount.ToString("C2");
        }
        catch(Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }
         
      }
    }
    public string Audit_Log { get; set; }

    public DeveloperAgreement()
    {
      
    }

    private bool Data_Changed(DeveloperAgreement current)
    {
      return (Agreement_Amount_Formatted != current.Agreement_Amount_Formatted);
    }

    public static DeveloperAgreement Get(string Agreement_Number)
    {
      var dp = new DynamicParameters();
      dp.Add("@Agreement_Number", Agreement_Number);
      string query = @"
        SELECT
          Agreement_Number,
          Agreement_Amount,
          Audit_Log
        FROM ImpactFees_Developer_Agreements
        WHERE Agreement_Number=@Agreement_Number;";
      var data = Constants.Get_Data<DeveloperAgreement>(query, dp);
      if(data.Count() == 1)
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
      List<string> errors = new List<string>();
      if (Agreement_Number.Trim().Length == 0)
      {
        errors.Add("No Agreement Number was specified.");
      }
      if(Agreement_Amount < 0)
      {
        errors.Add("Agreement Amount cannot be a negative number.");
      }
      return errors;
    }

    public bool Save(string Username)
    {
      Audit_Log = Constants.Create_Audit_Log(Username, "Record Created.");
      string query = @"
        INSERT INTO ImpactFees_Developer_Agreements 
          (Agreement_Number, Agreement_Amount, Audit_Log)
        VALUES 
          (@Agreement_Number, @Agreement_Amount, @Audit_Log)";
      return Constants.Save_Data<DeveloperAgreement>(query, this);
    }

    public bool Update(string Username)
    {
      var current = DeveloperAgreement.Get(Agreement_Number);
      if (current == null) return false;
      if(Data_Changed(current))
      {
        string s = Constants.Create_Audit_Log(Username, "Agreement Amount", current.Agreement_Amount_Formatted, Agreement_Amount_Formatted);
        Audit_Log = s + Environment.NewLine + current.Audit_Log;
        string query = @"
        UPDATE ImpactFees_Developer_Agreements 
          SET 
            Agreement_Amount=@Agreement_Amount, 
            Audit_Log=@Audit_Log
          WHERE 
            Agreement_Number=@Agreement_Number;";
        return Constants.Save_Data<DeveloperAgreement>(query, this);
      }
      else
      {
        return true;
      }
    }

  }
}