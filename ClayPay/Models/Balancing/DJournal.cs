using System;
using System.Collections.Generic;
using System.Data.SqlClient;
using System.Data;

using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Balancing
{ 
  public class DJournal
  {
    public List<CashierTotal> ProcessedPaymentTotals { get; set; } = new List<CashierTotal>();
    public List<CashierTotal> GUTotals { get; set; } = new List<CashierTotal>();
    public List<Account> GLAccountTotals { get; set; } = new List<Account>();
    public DJournalLog Log { get; set; } = new DJournalLog();
    public List<string> Error { get; set; } = new List<string>();
    public DateTime DJournalDate { get; set; } = DateTime.MinValue;

    public DJournal(DateTime dateToProcess, bool finalize = false, string NTUser = "")
    {
      DJournalDate = dateToProcess;
      //check for dates not finalized after initial finalize date
      this.ProcessedPaymentTotals = CashierTotal.ProcessPaymentTypeTotals(dateToProcess);
      this.GUTotals = CashierTotal.GetGUTotals(dateToProcess);
      this.GLAccountTotals = Account.GetGLAccountTotals(dateToProcess);
      var balancedText = CashierTotal.IsDjournalBalanced(dateToProcess);
      if (balancedText.Length > 0)
      {
        Error.Add("Djournal is " + balancedText);
        var keys = String.Join(", \n", CashierTotal.GetOutOfBalanceCashierIds(dateToProcess));
        Error.Add("The following keys have issues:\n" + keys);
      }

      Log = DJournalLog.Get(dateToProcess);
      if (finalize && Error.Count() == 0)
      {
        if (this.Log != null && !Log.IsCreated)
        {
          if (DJournalLog.Create(dateToProcess, NTUser) != -1)
          {
            this.Log = DJournalLog.Get(dateToProcess);
          }
          else
          {
            this.Error.Add($"There was an issue saving the DJournal log for {dateToProcess.ToShortDateString()}.");
          }
        }
        else
        {
          Error.Add($"{dateToProcess.ToShortDateString()} has already been finalized.");
        }
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

    //public static DateTime NextDateToFinalize()
    //{
    //  var sql = @"
    //    SELECT CAST(ISNULL(DATEADD(dd,1,MAX(djournal_date)), '2018-07-19') AS DATE)
    //    FROM ccDjournalTransactionLog
    //    WHERE CAST(djournal_date AS DATE) < CAST(GETDATE() AS DATE)
    //  ";
    //  return Constants.Exec_Scalar<DateTime>(sql).Date;
    //  //var date = Constants.Get_Data<DateTime>(sql).First();
    //  //return date.Date;
    //}
    public static bool IsDateFinalized(DateTime DateToCheck)
    {
      return DateToCheck <= LastDateFinalized();
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
  }
}