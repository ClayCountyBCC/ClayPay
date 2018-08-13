namespace Balancing
{
  interface ICashierDetailData
  {
    CashierId: string;
    TransactionDate: Date;
    Name: string;
    AmountApplied: number;
    PaymentType: string;
    CheckNumber: string;
    TransactionNumber: string;
    Info: string;
    AssocKey: string;
    ChargeTotal: number;
  }
  export class CashierDetailData implements ICashierDetailData
  {
    public CashierId: string;
    public TransactionDate: Date;
    public Name: string;
    public AmountApplied: number;
    public PaymentType: string;
    public CheckNumber: string;
    public TransactionNumber: string;
    public Info: string;
    public AssocKey: string;
    public ChargeTotal: number;

    constructor()
    {
    }

    public static BuildCashierDataTable(cdd: Array<CashierDetailData>): DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = document.createElement("table");//<HTMLTableElement>
      table.classList.add("table");
      table.classList.add("is-bordered");
      table.classList.add("is-fullwidth");
      table.style.marginTop = "1em";
      table.style.marginBottom = "1em";
      table.appendChild(CashierDetailData.BuildTableHeader());
      let tbody = document.createElement("tbody");
      for (let cd of cdd)
      {
        tbody.appendChild(CashierDetailData.BuildTableRow(cd));
      }
      table.appendChild(tbody);
      df.appendChild(table);
      return df;
    }

    private static BuildTableHeader(): HTMLTableSectionElement
    {
      let thead = document.createElement("thead");
      let tr = document.createElement("tr");
      tr.appendChild(CashierDetailData.CreateTableCell("th", "CashierId", "10%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Date", "15%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Name", "15%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Amount", "5%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Type", "5%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Ck/Trans#", "10%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Info", "25%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Key", "10%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("th", "Charge", "5%", "has-text-centered"));
      thead.appendChild(tr);
      return thead;
    }

    private static BuildTableRow(data: CashierDetailData): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(CashierDetailData.CreateTableCell("td", data.CashierId));
      tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Date(data.TransactionDate), "10%", "has-text-centered"));
      tr.appendChild(CashierDetailData.CreateTableCell("td", data.Name, "", "has-text-left"));
      tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.AmountApplied), "", "has-text-right"));
      tr.appendChild(CashierDetailData.CreateTableCell("td", data.PaymentType));
      let trans = data.CheckNumber.length > 0 ? data.CheckNumber : data.TransactionNumber;
      tr.appendChild(CashierDetailData.CreateTableCell("td", trans));
      tr.appendChild(CashierDetailData.CreateTableCell("td", data.Info));
      tr.appendChild(CashierDetailData.CreateTableCell("td", data.AssocKey));
      tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.ChargeTotal), "", "has-text-right"));
      return tr;
    }

    private static CreateTableCell(type: string, value: string, width: string = "", className: string = "has-text-centered"): HTMLTableCellElement
    {
      let cell = <HTMLTableCellElement>document.createElement(type);
      if(width.length > 0) cell.width = width;
      if (className.length > 0) cell.classList.add(className);
      cell.appendChild(document.createTextNode(value));
      return cell;
    }



  }

}