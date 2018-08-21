var Balancing;
(function (Balancing) {
    class CashierDetailData {
        constructor() {
        }
        static BuildCashierDataTable(cdd) {
            let df = document.createDocumentFragment();
            let table = document.createElement("table"); //<HTMLTableElement>
            table.classList.add("pagebreak");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(CashierDetailData.BuildTableHeader());
            let tbody = document.createElement("tbody");
            for (let cd of cdd) {
                tbody.appendChild(CashierDetailData.BuildTableRow(cd));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        }
        static BuildTableHeader() {
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
        static BuildTableRow(data) {
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
        static CreateTableCell(type, value, width = "", className = "has-text-centered") {
            let cell = document.createElement(type);
            if (width.length > 0)
                cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        }
    }
    Balancing.CashierDetailData = CashierDetailData;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=CashierDetailData.js.map