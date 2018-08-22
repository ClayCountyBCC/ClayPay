var Balancing;
(function (Balancing) {
    var CashierDetailData = /** @class */ (function () {
        function CashierDetailData() {
        }
        CashierDetailData.BuildCashierDataTable = function (cdd) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("pagebreak");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(CashierDetailData.BuildTableHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, cdd_1 = cdd; _i < cdd_1.length; _i++) {
                var cd = cdd_1[_i];
                tbody.appendChild(CashierDetailData.BuildTableRow(cd));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        CashierDetailData.BuildTableHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
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
        };
        CashierDetailData.BuildTableRow = function (data) {
            var tr = document.createElement("tr");
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.CashierId));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Date(data.TransactionDate), "10%", "has-text-centered"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.Name, "", "has-text-left"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.AmountApplied), "", "has-text-right"));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.PaymentType));
            var trans = data.CheckNumber.length > 0 ? data.CheckNumber : data.TransactionNumber;
            tr.appendChild(CashierDetailData.CreateTableCell("td", trans));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.Info));
            tr.appendChild(CashierDetailData.CreateTableCell("td", data.AssocKey));
            tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Amount(data.ChargeTotal), "", "has-text-right"));
            return tr;
        };
        CashierDetailData.CreateTableCell = function (type, value, width, className) {
            if (width === void 0) { width = ""; }
            if (className === void 0) { className = "has-text-centered"; }
            var cell = document.createElement(type);
            if (width.length > 0)
                cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        return CashierDetailData;
    }());
    Balancing.CashierDetailData = CashierDetailData;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=CashierDetailData.js.map