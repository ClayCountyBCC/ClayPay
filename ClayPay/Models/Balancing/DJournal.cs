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
    public string Error { get; set; }

    public DJournal(DateTime dateToProcess, bool finalize, string NTUser)
    {
      this.ProcessedPaymentTotals = CashierTotal.ProcessPaymentTypeTotals(dateToProcess);
      this.GUTotals = CashierTotal.GetGUTotals(dateToProcess);
      this.GLAccountTotals = Account.GetGLAccountTotals(dateToProcess);
      this.CheckForLog(dateToProcess);
      if (finalize)
      {
        if (this.Error.Length > 0)
        {
          this.Log = new DJournalLog();
        }
        else
        {
          if (this.Log.IsCreated == false)
          {
            this.Log = DJournalLog.Create(dateToProcess, NTUser);
          }
        }
      }      
    }


    public void CheckForLog(DateTime dateToProcess)
    {
      var log = DJournalLog.Get(dateToProcess);

      if(log == null)
      {
        this.Error = $"There was an error validating the DJournalLog for {dateToProcess.ToShortDateString()}.";
        this.Log = null;
      }
      else
      {
        this.Log = log;
      }

    }
   
  }
}