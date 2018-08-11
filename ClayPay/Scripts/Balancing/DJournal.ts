namespace Balancing
{
  interface IDJournal
  {
    ProcessedPaymentTotals: Array<CashierTotal>;
    GUTotals: Array<CashierTotal>;
    GLAccountTotals: Array<Account>;
    Log: DJournalLog;
    Error: Array<string>;
    DJournalDate: Date;
    DJournalDateFormatted: string;
  }

  export class DJournal implements IDJournal
  {
    public ProcessedPaymentTotals: Array<CashierTotal> = [];
    public GUTotals: Array<CashierTotal> = [];
    public GLAccountTotals: Array<Account> = [];
    public Log: DJournalLog = new DJournalLog();
    public Error: Array<string> = [];
    public DJournalDate: Date = new Date();
    public DJournalDateFormatted: string = "";

    public static DJournalTotalsContainer: string = "djournalTotals";
    public static DJournalDateInput: string = "djournalDate";
    public static DjournalContainer: string = "balancingDJournal";
    public static PaymentsContainer: string = "djournalPaymentsByType";

    constructor()
    {

    }



    public static GetAndShow(DJournalDate: string = ""): void
    {
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      let query = "";
      if (DJournalDate.length > 0)
      {
        query = "?DateToBalance=" + DJournalDate;
      }
      Utilities.Get<DJournal>(path + "API/Balancing/GetDJournal" + query).then(
        function (dj)
        {
          console.log('djournal', dj);
          let dateInput = <HTMLInputElement>document.getElementById(DJournal.DJournalDateInput);          
          Utilities.Set_Value(dateInput, dj.DJournalDateFormatted);
          DJournal.BuildDJournalDisplay(dj);
        }, function (error)
        {
          console.log('error', error);
        });
    }

    public static BuildDJournalDisplay(dj: DJournal):void
    {
      let target = document.getElementById(DJournal.DJournalTotalsContainer);
      let df = document.createDocumentFragment();
      df.appendChild(DJournal.CreateDJournalTable(dj));
      Utilities.Clear_Element(target);
      target.appendChild(df);
    }

    private static CreateDJournalTable(dj: DJournal): HTMLTableElement
    {
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("is-fullwidth");
      table.classList.add("is-bordered");
      table.appendChild(DJournal.BuildDJournalHeader());
      let tbody = document.createElement("tbody");
      let tfoot = document.createElement("tfoot");
      let totalCharges: CashierTotal;

      let totalDeposits: CashierTotal;
      let totalPayments: CashierTotal;
      for (let payment of dj.ProcessedPaymentTotals)
      {
        switch (payment.Type)
        {
          case "Total Charges":
            totalCharges = payment;
            break;
          case "Total Deposit":
            totalDeposits = payment;
            break;
          case "Total Payments":
            totalPayments = payment;
            break;

          case "Check":
          case "Cash":
            tbody.appendChild(DJournal.BuildShortDJournalRow(payment, dj.DJournalDateFormatted));
            break;

          default:
            tbody.appendChild(DJournal.BuildPaymentRow(payment, dj.DJournalDateFormatted));
        }
      }
      let tr = DJournal.BuildDJournalRow(totalPayments.Type, totalPayments.TotalAmount, totalDeposits.Type, totalDeposits.TotalAmount);
      tr.style.backgroundColor = "#fafafa";
      tfoot.appendChild(tr);
      tfoot.appendChild(DJournal.BuildDJournalRow(totalCharges.Type, totalCharges.TotalAmount, "", -1));
      for (let gutotal of dj.GUTotals)
      {
        tfoot.appendChild(DJournal.BuildDJournalRow(gutotal.Type, gutotal.TotalAmount, "", -1));
      }



      table.appendChild(tbody);
      table.appendChild(tfoot);
      return table;
    }

    private static BuildDJournalHeader(): HTMLTableSectionElement
    {
      let head = <HTMLTableSectionElement>document.createElement("THEAD");
      let tr = document.createElement("tr");
      let payments = document.createElement("th");
      payments.colSpan = 2;
      payments.width = "60%";
      payments.classList.add("has-text-right");
      payments.appendChild(document.createTextNode("Payments"));
      tr.appendChild(payments);
      let deposits = document.createElement("th");
      deposits.colSpan = 2;
      deposits.width = "40%";
      deposits.classList.add("has-text-right");
      deposits.appendChild(document.createTextNode("Deposits"));
      tr.appendChild(deposits);
      head.appendChild(tr);
      return head;
    }

    private static BuildDJournalRow(
      paymentLabel: string,
      paymentAmount: number,
      depositLabel: string,
      depositAmount: number): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(DJournal.CreateTableCell(paymentLabel, "45%"));
      tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(paymentAmount), "15%"));
      if (depositLabel.length > 0)
      {
        tr.appendChild(DJournal.CreateTableCell(depositLabel, "25%"));
        tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(depositAmount), "15%"));
      }
      else
      {
        tr.appendChild(DJournal.CreateTableCell("", "25%"));
        tr.appendChild(DJournal.CreateTableCell("", "15%"));
      }
      return tr;
    }

    private static BuildShortDJournalRow(
      payment: CashierTotal,
      djournalDate: string): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
      tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
      tr.appendChild(DJournal.CreateTableCell(payment.Type + " Deposits", "25%"));
      tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
      return tr;
    }

    private static BuildPaymentRow(
      payment: CashierTotal,
      djournalDate: string): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
      tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
      tr.appendChild(DJournal.CreateTableCell("", "25%"));
      tr.appendChild(DJournal.CreateTableCell("", "15%"));
      return tr;
    }

    private static CreateTableCell(value: string, width: string):HTMLTableCellElement
    {
      let td = document.createElement("td");
      td.classList.add("has-text-right");
      td.width = width;
      td.appendChild(document.createTextNode(value));
      return td;
    }

    private static CreateTableCellLink(value: string, paymentType: string, width: string, djournalDate: string): HTMLTableCellElement
    {
      let td = document.createElement("td");
      td.classList.add("has-text-right");
      td.width = width;
      let link = <HTMLAnchorElement>document.createElement("A");
      link.onclick = () =>
      {
        
        Utilities.Set_Text(link, "loading...");
        // load data here
        let path = "/";
        let qs = "";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0)
        {
          path = "/claypay/";
        }
        //DateTime DateToBalance, string PaymentType
        qs = "?DateToBalance=" + djournalDate + "&PaymentType=" + paymentType
        Utilities.Get<Array<Balancing.Payment>>(path + "API/Balancing/GetPayments" + qs)
          .then(function (payments)
          {
            console.log('payments', payments);
            Balancing.Payment.ShowPayments(payments, value, djournalDate);
            Utilities.Hide(DJournal.DJournalTotalsContainer);
            Utilities.Set_Text(link, value); // change it back
            Utilities.Show(DJournal.PaymentsContainer);
          }, function (error)
          {
            console.log('error getting payments for payment type: ' + paymentType, error);
            Utilities.Set_Text(link, value); // change it back
            });

      }
      link.appendChild(document.createTextNode(value));
      td.appendChild(link);
      return td;
    }

  }

}