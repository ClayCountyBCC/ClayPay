var Balancing;
(function (Balancing) {
    var CashierDetailData = /** @class */ (function () {
        function CashierDetailData() {
            this.CashierId = "";
            this.AmountApplied = 0;
            this.PaymentType = "";
            this.ChargeTotal = 0;
        }
        CashierDetailData.BuildCashierDataTable = function (cdd, title) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table");
            table.classList.add("pagebreak");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.style.marginTop = "1em";
            table.style.marginBottom = "1em";
            table.appendChild(CashierDetailData.BuildTableHeader(title));
            var tbody = document.createElement("tbody");
            var previous = new CashierDetailData();
            var totalAmounts = 0;
            var totalCharges = 0;
            var paymentTypes = [];
            var permits = [];
            for (var _i = 0, cdd_1 = cdd; _i < cdd_1.length; _i++) {
                var cd = cdd_1[_i];
                var AmountApplied = "";
                var ChargeAmount = "";
                var permitKey = cd.CashierId + "-" + cd.AssocKey;
                var paymentTypeKey = cd.CashierId + "-" + cd.PaymentType;
                if (permits.indexOf(permitKey) === -1) {
                    permits.push(permitKey);
                    ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
                    totalCharges += cd.ChargeTotal;
                }
                if (paymentTypes.indexOf(paymentTypeKey) === -1) {
                    paymentTypes.push(paymentTypeKey);
                    AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
                    totalAmounts += cd.AmountApplied;
                }
                //if (cd.CashierId === previous.CashierId)
                //{
                //  if (cd.AssocKey === previous.AssocKey &&
                //    cd.ChargeTotal === previous.ChargeTotal)
                //  {
                //    AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
                //    totalAmounts += cd.AmountApplied;
                //  }
                //  else
                //  {
                //    if (cd.AmountApplied === previous.AmountApplied) 
                //    {
                //      ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
                //      totalCharges += cd.ChargeTotal;
                //    }
                //    else
                //    {
                //      AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
                //      ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
                //      totalAmounts += cd.AmountApplied;
                //      totalCharges += cd.ChargeTotal;
                //    }
                //  }
                //}
                //else
                //{
                //  AmountApplied = Utilities.Format_Amount(cd.AmountApplied);
                //  ChargeAmount = Utilities.Format_Amount(cd.ChargeTotal);
                //  totalAmounts += cd.AmountApplied;
                //  totalCharges += cd.ChargeTotal;
                //}
                var tr = document.createElement("tr");
                tr.appendChild(CashierDetailData.CreateTableCell("td", cd.CashierId));
                tr.appendChild(CashierDetailData.CreateTableCell("td", Utilities.Format_Date(cd.TransactionDate), "10%", "has-text-centered"));
                tr.appendChild(CashierDetailData.CreateTableCell("td", cd.Name, "", "has-text-left"));
                tr.appendChild(CashierDetailData.CreateTableCell("td", AmountApplied, "", "has-text-right"));
                tr.appendChild(CashierDetailData.CreateTableCell("td", cd.PaymentType));
                var trans = cd.CheckNumber.length > 0 ? cd.CheckNumber : cd.TransactionNumber;
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
        };
        CashierDetailData.BuildTableHeader = function (title) {
            var thead = document.createElement("thead");
            var titleTr = document.createElement("tr");
            var titleTh = CashierDetailData.CreateTableCell("th", title, "", "has-text-centered");
            titleTh.colSpan = 9;
            titleTr.appendChild(titleTh);
            thead.appendChild(titleTr);
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
        CashierDetailData.BuildTotalRow = function (TotalAmount, TotalCharges) {
            var tr = document.createElement("tr");
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