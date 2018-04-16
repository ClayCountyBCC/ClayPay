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
    public string Developer_Name { get; set; } // Display only, not to be saved.
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

    public DeveloperAgreement()
    {
      
    }

    private bool Data_Changed(DeveloperAgreement current)
    {
      return (Agreement_Amount_Formatted != current.Agreement_Amount_Formatted);
    }

    public static DeveloperAgreement Get(string Agreement_Number)
    {
      var data = GetList(Agreement_Number);
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
      if (Agreement_Amount < Amount_Currently_Allocated)
      {
        errors.Add("The Amount Allocated cannot be set to less than the amount currently allocated to Builders.");
      }
      return errors;
    }

    public bool Update(string Username)
    {
      bool SaveData = false;
      var current = DeveloperAgreement.Get(Agreement_Number);
      if (current == null) return false;
      if(current.Audit_Log.Length > 0) // this record already exists
      {
        if (Data_Changed(current))
        {
          SaveData = true;
          string s = Constants.Create_Audit_Log(Username, "Agreement Amount", current.Agreement_Amount_Formatted, Agreement_Amount_Formatted);
          Audit_Log = s + Environment.NewLine + current.Audit_Log;
        }
      }
      else
      {
        SaveData = true;
      }
      if (SaveData)
      {
        string query = @"
          MERGE ImpactFees_Developer_Agreements WITH (HOLDLOCK) DA
          USING (SELECT @Agreement_Number, @Agreement_Amount, @Audit_Log) AS D 
            (Agreement_Number, Agreement_Amount, Audit_Log) ON DA.Agreement_Number = D.Agreement_Number
          WHEN MATCHED THEN
            UPDATE 
              SET 
                Agreement_Amount=@Agreement_Amount, 
                Audit_Log=@Audit_Log
          WHEN NOT MATCHED THEN
            INSERT 
              (Agreement_Number, Agreement_Amount, Audit_Log)
            VALUES 
              (@Agreement_Number, @Agreement_Amount, @Audit_Log);";
        return Constants.Save_Data<DeveloperAgreement>(query, this);
      }
      else
      {
        return true;
      }
    }

    public static List<DeveloperAgreement> GetList(string Agreement_Number = "")
    {
      var dp = new DynamicParameters();
      string query = @"
        WITH CurrentAllotment AS (
          SELECT
            Agreement_Number,
            SUM(Amount_Allocated) Amount_Currently_Allocated    
          FROM ImpactFees_Builder_Allocations
          GROUP BY Agreement_Number
        )

        SELECT
          A.ProjName Developer_Name,
          LTRIM(RTRIM(A.ApplNum)) Agreement_Number,
          ISNULL(Agreement_Amount, 0) Agreement_Amount,
          ISNULL(C.Amount_Currently_Allocated, 0) Amount_Currently_Allocated,
          ISNULL(Audit_Log, '') Audit_Log
        FROM apApplication A
        LEFT OUTER JOIN ImpactFees_Developer_Agreements D ON LTRIM(RTRIM(A.ApplNum)) = D.Agreement_Number
        LEFT OUTER JOIN CurrentAllotment C ON D.Agreement_Number = C.Agreement_Number
        WHERE 
          A.ApplType = 'TIMPACT'
";
      if (Agreement_Number.Length > 0)
      {
        query += "AND D.Agreement_Number = @Agreement_Number";
        dp.Add("@Agreement_Number", Agreement_Number);
      }
      return Constants.Get_Data<DeveloperAgreement>(query, dp);
    }

  }
}