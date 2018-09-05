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
    CanDJournalBeFinalized: boolean;
    CashierData: Array<CashierDetailData>;
    ImpactFeeData: Array<CashierDetailData>;
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
    public CanDJournalBeFinalized: boolean = false;
    public CashierData: Array<CashierDetailData> = [];
    public ImpactFeeData: Array<CashierDetailData> = [];

    public static DJournalTotalsContainer: string = "djournalTotals";
    public static DJournalDateInput: string = "djournalDate";
    public static BalancingContainer: string = "balancingDJournal";
    public static PrintingContainer: string = "printingDJournal";
    public static PaymentsContainer: string = "djournalPaymentsByType";
    public static DJournalSearchErrorContainer: string = "djournalSearchError";
    public static DJournalErrorContainer: string = "djournalErrors";
    public static DJournalSearchDateButton: string = "BalanceByDate";
    public static DJournalSearchNextDateButton: string = "NextFinalizeDate";
    public static DJournalFinalizeContainer: string = "djournalFinalizeContainer";

    constructor()
    {

    }


    private static ToggleButtons(toggle: boolean):void
    {
      Utilities.Toggle_Loading_Button(DJournal.DJournalSearchDateButton, toggle);
      //Utilities.Toggle_Loading_Button(DJournal.DJournalSearchNextDateButton, toggle);
    }

    public static GetAndShow(DJournalDate: string = ""): void
    {
      DJournal.ToggleButtons(true);
      Utilities.Hide(DJournal.PrintingContainer);
      Utilities.Show(DJournal.BalancingContainer);
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
          if (dj.Error.length === 0)
          {
            Utilities.Clear_Element(document.getElementById(DJournal.DJournalErrorContainer));
          }
          else
          {
            Utilities.Error_Show(DJournal.DJournalErrorContainer, dj.Error, false);
          }
          DJournal.BuildDJournalDisplay(dj);
          
          DJournal.ToggleButtons(false);
        }, function (error)
        {
          console.log('error', error);
          Utilities.Error_Show(DJournal.DJournalErrorContainer, error, false);
          DJournal.ToggleButtons(false);
        });
    }

    public static BuildDJournalFinalizeDisplay(dj: DJournal):void
    {
      // Rules:
      // df.CanBeFinalized is true, we show the finalize button
      // Otherwise:
      // If the date is already finalized, we show who did it and when
      // along with a "View Printable DJournal" button
      // If it's not, we don't show anything.
      let finalizeContainer = document.getElementById(DJournal.DJournalFinalizeContainer);
      Utilities.Clear_Element(finalizeContainer);
      let df = document.createDocumentFragment();
      if (dj.CanDJournalBeFinalized)
      {
        console.log('showing finalize button');
        df.appendChild(DJournal.BuildDJournalFinalizeButton(dj));
      }
      else
      {
        if (dj.Log.IsCreated)
        {
          console.log('showing finalize info');
          df.appendChild(DJournal.BuildDJournalFinalizeInfo(dj));
        }
        else
        {
          console.log('no finalize to show');
        }
      }
      finalizeContainer.appendChild(df);
    }

    public static BuildDJournalFinalizeButton(dj: DJournal):HTMLElement
    {
      let level = document.createElement("div");
      level.classList.add("level");
      level.style.marginTop = ".75em";
      let button = document.createElement("button");
      button.type = "button";
      button.classList.add("button");
      button.classList.add("is-success");
      button.classList.add("level-item");
      button.classList.add("is-large");
      button.appendChild(document.createTextNode("Finalize Date"));
      button.onclick = () =>
      {
        button.disabled = true;
        button.classList.add("is-loading");
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0)
        {
          path = "/claypay/";
        }
        let query = "?DateToFinalize=" + dj.DJournalDate;        
        Utilities.Post<DJournal>(path + "API/Balancing/Finalize" + query, null)
          .then(function (dj: DJournal)
          {
            console.log('dj returned from finalize', dj);
            DJournal.BuildDJournalDisplay(dj);
            Utilities.Hide(DJournal.BalancingContainer);
            Utilities.Show(DJournal.PrintingContainer);
            button.disabled = false;
            button.classList.remove("is-loading");
          }, function (error)
          {
            console.log("error in finalize", error);
            button.disabled = false;
            button.classList.remove("is-loading");
            });
      }

      level.appendChild(button);
      return level;
    }

    public static BuildDJournalFinalizeInfo(dj: DJournal): HTMLElement
    {
      let container = document.createElement("div");
      container.appendChild(DJournal.CreateDisplayField("Finalized On", Utilities.Format_Date(dj.Log.FinalizedOn)));
      container.appendChild(DJournal.CreateDisplayField("Finalized By", dj.Log.CreatedBy));
      let level = document.createElement("div");
      level.classList.add("level");
      level.style.marginTop = ".75em";
      let button = document.createElement("button");
      button.type = "button";
      button.classList.add("button");
      button.classList.add("is-success");
      button.classList.add("level-item");
      button.classList.add("is-large");
      button.appendChild(document.createTextNode("View Printable DJournal"));
      button.onclick = () =>
      {
        Utilities.Hide(DJournal.BalancingContainer);
        Utilities.Show(DJournal.PrintingContainer);
      }
      level.appendChild(button);
      container.appendChild(level);
      return container;
    }


    private static CreateDisplayField(label: string, value: string): HTMLDivElement
    {
      let field = document.createElement("div");
      field.classList.add("field");
      field.classList.add("column");
      let dataLabel = document.createElement("label");
      dataLabel.classList.add("label");
      dataLabel.appendChild(document.createTextNode(label));

      let control = document.createElement("div");
      control.classList.add("control");

      let input = document.createElement("input");
      input.classList.add("input");
      input.classList.add("is-static");
      input.readOnly = true;
      input.type = "text";
      input.value = value;
      control.appendChild(input);
      field.appendChild(dataLabel);
      field.appendChild(control);
      return field;
    }

    public static BuildDJournalDisplay(dj: DJournal):void
    {
      let target = document.getElementById(DJournal.DJournalTotalsContainer);
      let df = document.createDocumentFragment();
      df.appendChild(DJournal.CreateDJournalTable(dj));
      Utilities.Clear_Element(target);
      target.appendChild(df);
      DJournal.BuildDJournalFinalizeDisplay(dj);
      DJournal.BuildPrintableDJournal(dj);
    }

    private static CreateDJournalTable(dj: DJournal, ShowClose: boolean = false): HTMLTableElement
    {
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("is-bordered");
      table.classList.add("is-fullwidth");
      table.classList.add("print-with-no-border");

      table.appendChild(DJournal.BuildDJournalHeader(dj, ShowClose));
      let tbody = document.createElement("tbody");
      let tfoot = document.createElement("tfoot");
      let totalCharges: CashierTotal = new CashierTotal();

      let totalDeposits: CashierTotal = new CashierTotal();
      let totalPayments: CashierTotal = new CashierTotal();
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

    private static BuildDJournalHeader(dj: DJournal, ShowClose: boolean): HTMLTableSectionElement
    {
      let head = <HTMLTableSectionElement>document.createElement("THEAD");
      let bccTitle = document.createElement("div");
      bccTitle.textContent = "Clay County, BCC";
      bccTitle.classList.add("hide");
      bccTitle.classList.add("show-for-print");
      bccTitle.classList.add("print-title-size");
      let closeRow = document.createElement("tr");
      let title = document.createElement("th");
      title.colSpan = ShowClose ? 3 : 4;
      title.classList.add("has-text-left");
      title.classList.add("print-title-size");
      title.appendChild(document.createTextNode("DJournal " + dj.DJournalDateFormatted));
      title.appendChild(document.createElement("br"));
      title.appendChild(bccTitle);
      closeRow.appendChild(title);

      if (ShowClose)
      {
        let close = document.createElement("th");
        close.classList.add("has-text-centered");
        let button = document.createElement("button");
        button.type = "button";
        button.classList.add("button");
        button.classList.add("is-primary");
        button.classList.add("hide-for-print");
        button.appendChild(document.createTextNode("Close"));
        button.onclick = () =>
        {
          Utilities.Hide(DJournal.PrintingContainer);
          Utilities.Show(DJournal.BalancingContainer);
        }
        close.appendChild(button);
        closeRow.appendChild(close);
      }
      head.appendChild(closeRow);
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
      if (paymentType.length > 0)
      {
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
      }
      else
      {
        td.appendChild(document.createTextNode(value));
      }
        
      return td;
    }

    private static BuildPrintableDJournal(dj: DJournal): void
    {
      let container = document.getElementById(DJournal.PrintingContainer);
      Utilities.Clear_Element(container);
      if (!dj.Log.IsCreated) return; // Let's not do anything if this thing isn't finalized
      let df = document.createDocumentFragment();
      df.appendChild(DJournal.CreateDJournalTable(dj, true));
      df.appendChild(Account.BuildGLAccountTotals(dj.GLAccountTotals));
      df.appendChild(CashierDetailData.BuildCashierDataTable(dj.CashierData, "GL Data"));
      df.appendChild(CashierDetailData.BuildCashierDataTable(dj.ImpactFeeData, "Impact Fee Data"));
      container.appendChild(df);
    }




  }

}