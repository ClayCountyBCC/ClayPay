namespace Balancing
{
  interface IDJournal
  {
    ProcessedPaymentTotals: Array<CashierTotal>;
    GUTotals: Array<CashierTotal>;
    GLAccountTotals: Array<Account>;
    Log: DJournalLog;
    Error: Array<string>;
  }

  export class DJournal implements IDJournal
  {
    public ProcessedPaymentTotals: Array<CashierTotal> = [];
    public GUTotals: Array<CashierTotal> = [];
    public GLAccountTotals: Array<Account> = [];
    public Log: DJournalLog = new DJournalLog();
    public Error: Array<string> = [];

    constructor()
    {

    }

    public static GetAndShow(): void
    {
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      Utilities.Get<DJournal>(path + "API/Balancing/GetDJournal").then(
        function (dj)
        {
          console.log('djournal', dj);
        }, function (error)
        {
          console.log('error', error);
        });
    }


  }

}