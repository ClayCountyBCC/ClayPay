namespace Balancing
{
  interface IAccount
  {
    Fund: string;
    AccountNumber: string;
    Total: string;
    CashAccount: string;
  }

  export class Account implements IAccount
  {
    public Fund: string = "";
    public AccountNumber: string = "";
    public Project: string = "";
    public ProjectAccount: string = "";
    public Total: string = "";
    public CashAccount: string = "";

    constructor()
    {

    }

    public static  BuildGLAccountTotals(accounts: Array<Account>): DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = document.createElement("table");//<HTMLTableElement>
      table.classList.add("table");
      table.classList.add("is-bordered");
      table.classList.add("is-fullwidth");
      table.style.marginTop = "1em";
      table.style.marginBottom = "1em";
      table.appendChild(Account.BuildGLAccountHeader());
      let tbody = document.createElement("tbody");
      for (let account of accounts)
      {
        tbody.appendChild(Account.BuildGLAccountRow(account));
      }
      table.appendChild(tbody);
      df.appendChild(table);
      return df;
    }

    private static BuildGLAccountHeader(): HTMLTableSectionElement
    {
      let thead = document.createElement("thead");
      let tr = document.createElement("tr");
      tr.appendChild(Account.CreateTableCell("th", "FUND", "25%", "has-text-centered"));
      tr.appendChild(Account.CreateTableCell("th", "Account", "25%", "has-text-centered"));
      tr.appendChild(Account.CreateTableCell("th", "Total", "25%", "has-text-centered"));
      tr.appendChild(Account.CreateTableCell("th", "Cash Account", "25%", "has-text-centered"));
      thead.appendChild(tr);
      return thead;
    }

    private static BuildGLAccountRow(account: Account): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(Account.CreateTableCell("td", account.Fund, "25%", "has-text-centered"));
      tr.appendChild(Account.CreateTableCell("td", account.AccountNumber, "25%", "has-text-centered"));
      tr.appendChild(Account.CreateTableCell("td", account.Total, "25%", "has-text-right"));
      tr.appendChild(Account.CreateTableCell("td", account.CashAccount, "25%", "has-text-centered"));
      return tr;
    }

    private static CreateTableCell(type: string, value: string, width: string, className: string = ""): HTMLTableCellElement
    {
      let cell = <HTMLTableCellElement>document.createElement(type);
      cell.width = width;
      if (className.length > 0) cell.classList.add(className);
      cell.appendChild(document.createTextNode(value));
      return cell;
    }
  }

}