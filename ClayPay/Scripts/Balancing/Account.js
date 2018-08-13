var Balancing;
(function (Balancing) {
    class Account {
        constructor() {
            this.Fund = "";
            this.AccountNumber = "";
            this.Project = "";
            this.ProjectAccount = "";
            this.Total = "";
            this.CashAccount = "";
        }
        static BuildGLAccountTotals(accounts) {
            let df = document.createDocumentFragment();
            let table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(Account.BuildGLAccountHeader());
            let tbody = document.createElement("tbody");
            for (let account of accounts) {
                tbody.appendChild(Account.BuildGLAccountRow(account));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        }
        static BuildGLAccountHeader() {
            let thead = document.createElement("thead");
            let tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("th", "FUND", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Account", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Total", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Cash Account", "25%", "has-text-centered"));
            thead.appendChild(tr);
            return thead;
        }
        static BuildGLAccountRow(account) {
            let tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("td", account.Fund, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.AccountNumber, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.Total, "25%", "has-text-right"));
            tr.appendChild(Account.CreateTableCell("td", account.CashAccount, "25%", "has-text-centered"));
            return tr;
        }
        static CreateTableCell(type, value, width, className = "") {
            let cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        }
    }
    Balancing.Account = Account;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Account.js.map