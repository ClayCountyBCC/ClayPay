var Balancing;
(function (Balancing) {
    var Account = /** @class */ (function () {
        function Account() {
            this.Fund = "";
            this.AccountNumber = "";
            this.Project = "";
            this.ProjectAccount = "";
            this.Total = "";
            this.CashAccount = "";
        }
        Account.BuildGLAccountTotals = function (accounts) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.classList.add("print-with-no-border");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(Account.BuildGLAccountHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, accounts_1 = accounts; _i < accounts_1.length; _i++) {
                var account = accounts_1[_i];
                tbody.appendChild(Account.BuildGLAccountRow(account));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        Account.BuildGLAccountHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("th", "FUND", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Account", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Total", "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("th", "Cash Account", "25%", "has-text-centered"));
            thead.appendChild(tr);
            return thead;
        };
        Account.BuildGLAccountRow = function (account) {
            var tr = document.createElement("tr");
            tr.appendChild(Account.CreateTableCell("td", account.Fund, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.AccountNumber, "25%", "has-text-centered"));
            tr.appendChild(Account.CreateTableCell("td", account.Total, "25%", "has-text-right"));
            tr.appendChild(Account.CreateTableCell("td", account.CashAccount, "25%", "has-text-centered"));
            return tr;
        };
        Account.CreateTableCell = function (type, value, width, className) {
            if (className === void 0) { className = ""; }
            var cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        return Account;
    }());
    Balancing.Account = Account;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Account.js.map