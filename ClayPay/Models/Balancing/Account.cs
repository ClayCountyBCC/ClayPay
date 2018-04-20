using System;
using System.Data.SqlClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Web;
using System.Data;
using System.Runtime.Caching;
using System.Security.Policy;
using Dapper;

namespace ClayPay.Models.Balancing
{
  public class Account
  {
    public string Fund { get; set; }
    public string AccountNumber { get; set; }
    public string Project { get; set; } = "";
    public string ProjectAccount { get; set; } = "";
    public string Total { get; set; }
    public string CashAccount { get; set; }
    
    /*
     * This model only serves as a way to get the lower half of the DJournal output
     * The data is pre-formatted and is ready for display on the client
     */
    public Account()
    {
      
    }


     public static List<Account> GetGLAccountTotals(DateTime dateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", dateToBalance.Date);

      var sql = @"
      USE WATSC;
      
      SELECT 
        left(GUI.Account, 3) Fund, 
        SUBSTRING(GUI.Account, 5,6) AccountNumber, 
        GL.Project,
        GL.ProjectAccount,
        FORMAT(SUM(GUI.Amount),'$000000000.00') Total
        ,FORMAT(CAST(LEFT(GUI.Account,3) AS INT), '000') + ' -104000' CashAccount
      FROM ccGU GU
      INNER JOIN ccGUItem GUI ON GU.GUId = GUI.GUID
      LEFT OUTER JOIN ccGL GL ON GL.Account = GUI.Account
      WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE)
        and GUI.Type = 'c'
      GROUP BY FUND, GUI.Account, GL.Project, GL.ProjectAccount
      ORDER BY GUI.Account
       ";
      try
      {
        var a = Constants.Get_Data<Account>(sql, dbArgs);
        
      }catch(Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Account>();
      }


      return new List<Account>();

    }

  }

}