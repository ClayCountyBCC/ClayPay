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
    // Project / Project Account are not going to be included
    // because we do not use them here in Clay County
    //public string Project { get; set; } = "";
    //public string ProjectAccount { get; set; } = "";
    public string Total { get; set; }
    public string CashAccount { get; set; }

    /*
     * This model only serves as a way to get the lower half of the DJournal output
     * The data is pre-formatted and is ready for display on the client
     * 
     * The upper half is done using Payments.Process(dateToBalance)
     * 
     */
    public Account()
    {

    }


    public static List<Account> GetGLAccountTotals(DateTime dateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", dateToBalance.Date);
      // Removed these columns per above.
      //GL.Project,
      //GL.ProjectAccount,
      var sql = @"
      USE WATSC;

      WITH GUItemData AS (

        SELECT
          GUID,
          Account,
          Amount,
          Type,
          CHARINDEX('*', Account, 0) FundLength
        FROM ccGUItem
        WHERE 
          Type='c'

      ), FormattedGUItemData AS (
  
        SELECT
          GUID
          ,Amount
          ,CAST(LEFT(Account, FundLength - 1) AS INT) Fund
          ,SUBSTRING(Account, FundLength + 1,CHARINDEX('*', Account, FundLength + 1) - 1) AccountNumber
          ,CAST(CAST(LEFT(Account, FundLength - 1) AS INT) AS VARCHAR(4)) + ' -104000' CashAccount
        FROM GUItemData

      )
      
      SELECT 

        --left(GUI.Account, 3) Fund, 
        --SUBSTRING(GUI.Account, 5,6) AccountNumber, 
        --FORMAT(SUM(GUI.Amount),'$000000000.00') Total
        --,FORMAT(CAST(LEFT(GUI.Account,3) AS INT), '000') + ' -104000' CashAccount

        GUI.Fund
        ,GUI.AccountNumber
        ,FORMAT(SUM(GUI.Amount),'$000000000.00') Total
        ,GUI.CashAccount
      FROM ccGU GU
      INNER JOIN FormattedGUItemData GUI ON GU.GUId = GUI.GUID
      LEFT OUTER JOIN ccGL GL ON GL.Account = GUI.Account
      WHERE 
        CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE)        
      GROUP BY FUND, GUI.Account, GL.Project, GL.ProjectAccount
      ORDER BY GUI.Account
       ";
      try
      {
        var a = Constants.Get_Data<Account>(sql, dbArgs);
        return a;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Account>();
      }
    }

  }

}