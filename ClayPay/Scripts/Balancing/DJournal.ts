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
  }

}