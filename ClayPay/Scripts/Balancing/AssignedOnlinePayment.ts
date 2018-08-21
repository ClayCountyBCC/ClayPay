namespace Balancing
{
  interface IAssignedOnlinePayment
  {
    CashierId: string;
    TransactionDate: Date;
    AmountApplied: number;
    AssignedTo: string;
    DateAssigned: Date;
  }
  export class AssignedOnlinePayment implements IAssignedOnlinePayment
  {
    public CashierId: string = "";
    public TransactionDate: Date;
    public AmountApplied: number = 0;
    public AssignedTo: string = "";
    public DateAssigned: Date;
    public static OnlinePaymentsContainer: string = "onlinePayments";

    constructor()
    {
    }

    public static GetAndDisplay(): void
    {
      let container = document.getElementById(AssignedOnlinePayment.OnlinePaymentsContainer);
      Utilities.Clear_Element(container);
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      Utilities.Get<Array<AssignedOnlinePayment>>(path + "API/Balancing/UnassignedPayments").then(
        function (payments)
        {
          console.log('assigned online payments', payments);
          if (payments.length === 0)
          {
            container.appendChild(document.createTextNode("No payments found, please check again later."));
            return;
          }
          container.appendChild(AssignedOnlinePayment.BuildTable(payments));
        }, function (error)
        {
          console.log('error', error);
          Utilities.Error_Show(container, error, false);
        });
    }

    public static AssignAndDisplay(cashierId: string): void
    {
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      let query = "?CashierId=" + cashierId;
      Utilities.Post<string>(path + "API/Balancing/AssignPayment" + query, null).then(
        function (response)
        {
          console.log('assigned online payments', response);
          if (response.length !== 0)
          {
            alert(response);          
          }
          AssignedOnlinePayment.GetAndDisplay();
        }, function (error)
        {
          console.log('error', error);
        });
    }

    public static BuildTable(payments: Array<AssignedOnlinePayment>): DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("is-fullwidth");
      table.classList.add("pagebreak");

      table.classList.add("is-bordered");
      table.appendChild(AssignedOnlinePayment.BuildTableHeader());
      let tbody = document.createElement("tbody");
      for (let p of payments)
      {
        tbody.appendChild(AssignedOnlinePayment.BuildTableRow(p));
      }
      table.appendChild(tbody);
      df.appendChild(table);
      return df;
    }

    private static BuildTableHeader(): HTMLTableSectionElement
    {
      let thead = document.createElement("thead");
      let tr = document.createElement("tr");
      tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "CashierId", "25%"));
      tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Date", "25%"));
      tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Amount", "25%"));
      let th = AssignedOnlinePayment.CreateTableCell("th", "", "25%");
      let refresh = document.createElement("button");
      refresh.type = "button";
      refresh.classList.add("is-primary");
      refresh.classList.add("button");
      refresh.appendChild(document.createTextNode("Refresh"));
      refresh.onclick = () =>
      {
        refresh.classList.add("is-loading");
        AssignedOnlinePayment.GetAndDisplay();
      }
      th.appendChild(refresh);
      tr.appendChild(th);
      thead.appendChild(tr);
      return thead;
    }

    private static BuildTableRow(payment: AssignedOnlinePayment): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(Balancing.Payment.createTableCellLink("td", payment.CashierId, "25%"));
      tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Date(payment.TransactionDate)));
      tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Amount(payment.AmountApplied), "", "has-text-right"));
      let td = AssignedOnlinePayment.CreateTableCell("td", "");
      let assign = document.createElement("button");
      assign.type = "button";
      assign.classList.add("is-primary");
      assign.classList.add("button");
      assign.appendChild(document.createTextNode("Assign to me"));
      assign.onclick = () =>
      {
        assign.classList.add("is-loading");
        AssignedOnlinePayment.AssignAndDisplay(payment.CashierId);
      }
      td.appendChild(assign);
      tr.appendChild(td);

      return tr;
    }

    private static CreateTableCell(type: string, value: string, width: string = "", className: string = "has-text-centered"): HTMLTableCellElement
    {
      let cell = <HTMLTableCellElement>document.createElement(type);
      if (width.length > 0) cell.width = width;
      if (className.length > 0) cell.classList.add(className);
      cell.appendChild(document.createTextNode(value));
      return cell;
    } 

  }

}