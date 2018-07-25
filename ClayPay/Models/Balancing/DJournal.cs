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
    public List<CashierTotal> ProcessedPaymentTotals { get; set; }
    public List<CashierTotal> GUTotals { get; set; }
    public List<Account> GLAccountTotals { get; set; }
    public DJournalLog Log { get; set; }
    public List<string> Error { get; set; }

    public DJournal(DateTime dateToProcess, bool finalize = false, string NTUser = "")
    {
      //check for dates not finalized after initial finalize date
      this.ProcessedPaymentTotals = CashierTotal.ProcessPaymentTypeTotals(dateToProcess);
      this.GUTotals = CashierTotal.GetGUTotals(dateToProcess);
      this.GLAccountTotals = Account.GetGLAccountTotals(dateToProcess);
      this.GetLog(dateToProcess);
      if (finalize)
      {
        if (this.Log != null)
        {
          if (DJournalLog.Create(dateToProcess, NTUser) == 1)
          {
            this.Log = DJournalLog.Get(dateToProcess);
          }
          else
          {
            this.Error.Add($"There was an issue saving the DJournal log for {dateToProcess.ToShortDateString()}.");
          }
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


    public static DateTime NextDateToFinalize()
    {
      var sql = @"
        SELECT CAST(DATEADD(dd,1,MAX(djournal_date)) AS DATE)
        FROM ccDjournalTransactionLog
        WHERE CAST(djournal_date AS DATE) < CAST(GETDATE() AS DATE)
      ";
      return Constants.Get_Data<DateTime>(sql).DefaultIfEmpty( DateTime.MaxValue).First();
    }
  }
}