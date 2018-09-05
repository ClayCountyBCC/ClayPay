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
    public CashierId: string = "";
    public TransactionDate: Date;
    public Name: string;
    public AmountApplied: number = 0;
    public PaymentType: string = "";
    public CheckNumber: string;
    public TransactionNumber: string;
    public Info: string;
    public AssocKey: string;
    public ChargeTotal: number = 0;

    constructor()
    {
    }

    public static BuildCashierDataTable(cdd: Array<CashierDetailData>, title: string): DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = document.createElement("table");
      table.classList.add("pagebreak");
      table.classList.add("table");
      table.classList.add("is-bordered");
      table.classList.add("is-fullwidth");
      table.style.marginTop = "1em";
      table.style.marginBottom = "1em";
      table.appendChild(CashierDetailData.BuildTableHeader(title));
      let tbody = document.createElement("tbody");
      let previous = new CashierDetailData();
      let totalAmounts = 0;
      let totalCharges = 0;
      for (let cd of cdd)
      {
        let AmountApplied = "";
        let ChargeAmount = "";
        if (cd.CashierId === previous.CashierId)
        {
          if (cd.AssocKey === previous.AssocKey &&
            cd.ChargeTotal === previous.ChargeTotal)
          {
            AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
            totalAmounts += cd.AmountApplied;
          }
          else
          {
            if (cd.AmountApplied === previous.AmountApplied) 
            {
              ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
              totalCharges += cd.ChargeTotal;
            }
            else
            {
              AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
              ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
              totalAmounts += cd.AmountApplied;
              totalCharges += cd.ChargeTotal;
            }
          }
        }
        else
        {
          AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
          ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
          totalAmounts += cd.AmountApplied;
          totalCharges += cd.ChargeTotal;
        }
        let tr = document.createElement("tr");
        tr.appendChild(CashierDetailData.CreateTableCell("td", cd.CashierId));
        tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Date(cd.TransactionDate), "10%", "has-text-centered"));
        tr.appendChild(CashierDetailData.CreateTableCell("td", cd.Name, "", "has-text-left"));

        tr.appendChild(CashierDetailData.CreateTableCell("td", AmountApplied, "", "has-text-right"));
        tr.appendChild(CashierDetailData.CreateTableCell("td", cd.PaymentType));
        let trans = cd.CheckNumber.length > 0 ? cd.CheckNumber : cd.TransactionNumber;
        tr.appendChild(CashierDetailData.CreateTableCell("td", trans));
        tr.appendChild(CashierDetailData.CreateTableCell("td", cd.Info));
        tr.appendChild(CashierDetailData.CreateTableCell("td", cd.AssocKey));
        tr.appendChild(CashierDetailData.CreateTableCell("td", ChargeAmount, "", "has-text-right"));
        tbody.appendChild(tr);
        //tbody.appendChild(CashierDetailData.BuildTableRow(cd, previous, totalAmounts, totalCharges));
        previous = cd;
      }
      tbody.appendChild(CashierDetailData.BuildTotalRow(totalAmounts, totalCharges));
      table.appendChild(tbody);
      df.appendChild(table);
      return df;
    }

    private static BuildTableHeader(title: string): HTMLTableSectionElement
    {
      let thead = document.createElement("thead");
      let titleTr = document.createElement("tr");
      let titleTh = CashierDetailData.CreateTableCell("th", title, "", "has-text-centered");      
      titleTh.colSpan = 9;
      titleTr.appendChild(titleTh);
      thead.appendChild(titleTr);
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

    private static BuildTotalRow(TotalAmount: number, TotalCharges: number): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(CashierDetailData.CreateTableCell("td", ""));
      tr.appendChild(CashierDetailData.CreateTableCell("td", ""));
      tr.appendChild(CashierDetailData.CreateTableCell("td", "Amount Totals"));
      tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(TotalAmount)));
      tr.appendChild(CashierDetailData.CreateTableCell("td", ""));
      tr.appendChild(CashierDetailData.CreateTableCell("td", ""));
      tr.appendChild(CashierDetailData.CreateTableCell("td", ""));
      tr.appendChild(CashierDetailData.CreateTableCell("td", "Total Charges"));
      tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(TotalCharges)));
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