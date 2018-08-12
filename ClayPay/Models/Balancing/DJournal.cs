﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
using ClayPay.Controllers;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;
using ClayPay.Models.Claypay;

namespace ClayPay.Models.Balancing
{
  public class DJournal
  {
    public List<CashierTotal> ProcessedPaymentTotals { get; set; } = new List<CashierTotal>();
    public List<CashierTotal> GUTotals { get; set; } = new List<CashierTotal>();
    public List<Account> GLAccountTotals { get; set; } = new List<Account>();
    public List<CashierDetailData> CashierData { get; set; } = new List<CashierDetailData>();
    public DJournalLog Log { get; set; } = new DJournalLog();
    public List<string> Error { get; set; } = new List<string>();
    public DateTime DJournalDate { get; set; } = DateTime.MinValue;
    public string DJournalDateFormatted
    { get
      {
        return DJournalDate.ToString("yyyy-MM-dd");
      }
    }
    public bool CanDJournalBeFinalized { get; set; } = false;

    public DJournal(DateTime dateToProcess, UserAccess ua, bool finalize = false)
    {
      DJournalDate = dateToProcess;
      //check for dates not finalized after initial finalize date
      this.ProcessedPaymentTotals = CashierTotal.ProcessPaymentTypeTotals(dateToProcess);
      this.GUTotals = CashierTotal.GetGUTotals(dateToProcess);
      this.GLAccountTotals = Account.GetGLAccountTotals(dateToProcess);
      this.CashierData = CashierDetailData.Get(dateToProcess);
      CheckCatCodesAgainstGL();
      CheckIfDJournalIsBalanced();
      
      //
      Log = DJournalLog.Get(dateToProcess);
      var NextDateToFinalize = LastDateFinalized().AddDays(1);
      if (finalize)
      {
        if (Log.IsCreated) Error.Add($"{dateToProcess.ToShortDateString()} has already been finalized.");
        if (!ua.djournal_access) Error.Add("DJournal was not finalized. User does not have the correct level of access.");
        if (DJournalDate.Date != NextDateToFinalize.Date) Error.Add("The dates must be finalized in order.  You must finalize " + NextDateToFinalize.ToShortDateString() + "next.");
        if (NextDateToFinalize.Date == DateTime.Now.Date) Error.Add("You must wait until tomorrow to finalize today.");
      }
      

      // in order for the Djournal to be able to be finalized, the following must be true
      // 1) it can't already be finalized
      // 2) The date be be prior to today
      // 3) The date must be one day later than the most recent date finalized
      // 4) The user must have DJournal access.
      // 5) No errors can be present
      CanDJournalBeFinalized =
        !Log.IsCreated && // 1
        DJournalDate.Date < DateTime.Now.Date && // 2
        NextDateToFinalize.Date == DJournalDate.Date && // 3
        ua.djournal_access && // 4
        Error.Count == 0; // 5

      if (finalize && CanDJournalBeFinalized)
      {
        if (DJournalLog.Create(dateToProcess, ua.user_name) != -1)
        {
          Log = DJournalLog.Get(dateToProcess);
        }
        else
        {
          Error.Add($"There was an issue saving the DJournal log for {dateToProcess.ToShortDateString()}.");
        }
      }
    }

    private void CheckIfDJournalIsBalanced()
    {
      var balancedText = CashierTotal.IsDjournalBalanced(DJournalDate);
      if (balancedText.Length > 0)
      {
        Error.Add("Djournal is " + balancedText);
        var keys = String.Join(", \n", CashierTotal.GetOutOfBalanceCashierIds(DJournalDate));
        Error.Add("The following keys have issues:\n" + keys);
      }
    }


    private void CheckCatCodesAgainstGL()
    {

      var catcodedetails = GetCAtCodesWithInvalidGLInformation();
      if (catcodedetails == null) return;
        foreach(string c in catcodedetails)
      {
        Error.Add(c);
      }
    }

    public void GetLog(DateTime dateToProcess)
    {
      this.Log = DJournalLog.Get(dateToProcess);

      if (this.Log == null)
      {
        this.Error.Add($"There was an error validating the DJournalLog for {dateToProcess.ToShortDateString()}.");
      }
    }

    public static bool IsDateFinalized(DateTime DateToCheck)
    {
      return DateToCheck.Date < LastDateFinalized().Date;
    }

    public static DateTime LastDateFinalized()
    {
      var sql = @"
        SELECT MAX(djournal_date)
        FROM ccDjournalTransactionLog
      "; // --WHERE CAST(djournal_date AS DATE) = CAST(@DateToCheck AS DATE)

      return Constants.Exec_Scalar<DateTime>(sql);
      //return djournalDate.Date < DateToCheck.Date;
      //return i > 0;
    }


    public static List<string> GetCAtCodesWithInvalidGLInformation()
    {
      var sql = @"
        SELECT DISTINCT
          'Error in CatCode: ' +   
          ISNULL(CONCAT(LTRIM(RTRIM(CC.CatCode)), ' - ' + CC.Description), '') + 
          '.  GL - Credit Entry' +
          ' - Fund: ' + ISNULL(GL.Fund, 'None') + 
          ' - Account: ' + ISNULL(GL.Account, 'None') +
          ' - Percent: ' + ISNULL(CAST(GL.[Percent] AS VARCHAR(4)), 'None') Detail
        FROM ccCatCd CC
        LEFT OUTER JOIN ccGL GL ON CC.CatCode = GL.CatCode AND GL.Type='c'
        WHERE 
          CC.CatCode != '1TRN'
          AND (GL.Account IS NULL
          OR GL.Account = ''
          OR GL.[Percent] IS NULL
          OR GL.Fund IS NULL)
        UNION
        SELECT DISTINCT
          'Error in CatCode: ' +   
          ISNULL(CONCAT(LTRIM(RTRIM(CC.CatCode)), ' - ' + CC.Description), '') + 
          '.  GL - Debit Entry' +
          ' - Fund: ' + ISNULL(GL.Fund, 'None') + 
          ' - Account: ' + ISNULL(GL.Account, 'None') +
          ' - Percent: ' + ISNULL(CAST(GL.[Percent] AS VARCHAR(4)), 'None') Detail
        FROM ccCatCd CC
        LEFT OUTER JOIN ccGL GL ON CC.CatCode = GL.CatCode AND GL.Type='d'
        WHERE 
          CC.CatCode != '1TRN'
          AND (GL.Account IS NULL
          OR GL.Account = ''
          OR GL.[Percent] IS NULL
          OR GL.Fund IS NULL)";
      var c = Constants.Get_Data<string>(sql);
      return c;
    }

  }
}