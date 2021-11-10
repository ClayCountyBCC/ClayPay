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
    public decimal TotalAmount { get; set; }
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

      EXEC claypay_GetGLAccountTotals @DateToBalance

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