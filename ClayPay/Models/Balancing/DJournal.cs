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


    public DJournal(DateTime dateToProcess, bool finalize, string NTUser)
    {
      this.ProcessedPaymentTotals = CashierTotal.ProcessPaymentTypeTotals(dateToProcess);
      this.GUTotals = CashierTotal.GetGUTotals(dateToProcess);
      this.GLAccountTotals = Account.GetGLAccountTotals(dateToProcess);
      if (finalize)
      {
        var insertLog = DJournalLog.CreateDJournalLogEntry(dateToProcess, NTUser);
        if (insertLog.CreatedBy.Length == 0)
        {
          this.Log = new DJournalLog();
        }
        else
        {
          this.Log = insertLog;
        }
      }
      else
      {
        this.Log = DJournalLog.GetDJournalLog(dateToProcess);
      }
    }
   
  }
}