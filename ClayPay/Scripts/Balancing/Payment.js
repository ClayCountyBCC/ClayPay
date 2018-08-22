var Balancing;
(function (Balancing) {
    var Payment = /** @class */ (function () {
        function Payment() {
        }
        Payment.ShowPayments = function (payments, paymentType, paymentDate) {
            var paymentContainer = document.getElementById(Balancing.Payment.PaymentsContainer);
            Utilities.Clear_Element(paymentContainer);
            var df = document.createDocumentFragment();
            df.appendChild(Balancing.Payment.CreatePaymentTable(payments, paymentType, paymentDate));
            paymentContainer.appendChild(df);
        };
        Payment.CreatePaymentTable = function (payments, paymentType, paymentDate) {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            // Add Level showing Payment Type / Payment Date / Close button
            table.appendChild(Balancing.Payment.createPaymentTableHeader(paymentType, paymentDate));
            var tbody = document.createElement("tbody");
            // Table with payment info
            for (var _i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
                var p = payments_1[_i];
                var tr = document.createElement("tr");
                tr.appendChild(Balancing.Payment.createTableCellLink("td", p.CashierId, "20%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", p.Name, "40%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", Utilities.Format_Date(p.TransactionDate), "25%"));
                var amount = Balancing.Payment.createTableCell("td", Utilities.Format_Amount(p.Total), "15%");
                amount.classList.add("has-text-right");
                tr.appendChild(amount);
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            // Show close button
            table.appendChild(Balancing.Payment.createPaymentTableFooter());
            return table;
        };
        Payment.CreateCloseButton = function () {
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("is-primary");
            button.classList.add("button");
            button.onclick = function () {
                Utilities.Hide(Balancing.Payment.PaymentsContainer);
                Utilities.Show(Balancing.Payment.DJournalTotalsContainer);
            };
            button.appendChild(document.createTextNode("Close"));
            return button;
        };
        Payment.createPaymentTableHeader = function (paymentType, paymentDate) {
            var thead = document.createElement("THEAD");
            var trTitle = document.createElement("tr");
            var paymentTypeHeader = document.createElement("th");
            paymentTypeHeader.colSpan = 2;
            paymentTypeHeader.appendChild(document.createTextNode(paymentType + " Payments"));
            paymentTypeHeader.classList.add("has-text-centered");
            paymentTypeHeader.style.verticalAlign = "middle";
            var paymentDateHeader = document.createElement("th");
            paymentDateHeader.classList.add("has-text-centered");
            paymentDateHeader.appendChild(document.createTextNode(paymentDate));
            paymentDateHeader.style.verticalAlign = "middle";
            var closeButtonHeader = document.createElement("th");
            closeButtonHeader.classList.add("has-text-centered");
            closeButtonHeader.appendChild(Balancing.Payment.CreateCloseButton());
            trTitle.appendChild(paymentTypeHeader);
            trTitle.appendChild(paymentDateHeader);
            trTitle.appendChild(closeButtonHeader);
            thead.appendChild(trTitle);
            var tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCell("th", "Cashier Id", "20%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Name", "40%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Transaction Date", "25%"));
            var total = Balancing.Payment.createTableCell("th", "Total", "15%", "has-text-right");
            tr.appendChild(total);
            thead.appendChild(tr);
            return thead;
        };
        Payment.createPaymentTableFooter = function () {
            var tfoot = document.createElement("TFOOT");
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = 3;
            var closeButton = document.createElement("td");
            closeButton.classList.add("has-text-centered");
            closeButton.appendChild(Balancing.Payment.CreateCloseButton());
            tr.appendChild(td);
            tr.appendChild(closeButton);
            tfoot.appendChild(tr);
            return tfoot;
        };
        Payment.createTableCell = function (type, value, width, className) {
            if (className === void 0) { className = ""; }
            var cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        Payment.createTableCellLink = function (type, value, width) {
            var cell = document.createElement(type);
            cell.width = width;
            var link = document.createElement("a");
            link.onclick = function () {
                Utilities.Set_Text(link, "loading...");
                Utilities.Set_Value("receiptSearch", value);
                clayPay.ClientResponse.BalancingSearch(link);
            };
            link.appendChild(document.createTextNode(value));
            cell.appendChild(link);
            return cell;
        };
        Payment.PaymentsContainer = "djournalPaymentsByType";
        Payment.DJournalTotalsContainer = "djournalTotals";
        Payment.DJournalReceiptContainer = "receiptView";
        return Payment;
    }());
    Balancing.Payment = Payment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Payment.js.map