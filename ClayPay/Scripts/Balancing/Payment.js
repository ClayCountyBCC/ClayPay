var Balancing;
(function (Balancing) {
    class Payment {
        constructor() {
        }
        static ShowPayments(payments, paymentType, paymentDate) {
            let paymentContainer = document.getElementById(Balancing.Payment.PaymentsContainer);
            Utilities.Clear_Element(paymentContainer);
            let df = document.createDocumentFragment();
            df.appendChild(Balancing.Payment.CreatePaymentTable(payments, paymentType, paymentDate));
            paymentContainer.appendChild(df);
        }
        static CreatePaymentTable(payments, paymentType, paymentDate) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            // Add Level showing Payment Type / Payment Date / Close button
            table.appendChild(Balancing.Payment.createPaymentTableHeader(paymentType, paymentDate));
            let tbody = document.createElement("tbody");
            // Table with payment info
            for (let p of payments) {
                let tr = document.createElement("tr");
                tr.appendChild(Balancing.Payment.createTableCellLink("td", p.CashierId, "20%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", p.Name, "40%"));
                tr.appendChild(Balancing.Payment.createTableCell("td", Utilities.Format_Date(p.TransactionDate), "25%"));
                let amount = Balancing.Payment.createTableCell("td", Utilities.Format_Amount(p.Total), "15%");
                amount.classList.add("has-text-right");
                tr.appendChild(amount);
                tbody.appendChild(tr);
            }
            table.appendChild(tbody);
            // Show close button
            table.appendChild(Balancing.Payment.createPaymentTableFooter());
            return table;
        }
        static CreateCloseButton() {
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("is-primary");
            button.classList.add("button");
            button.onclick = () => {
                Utilities.Hide(Balancing.Payment.PaymentsContainer);
                Utilities.Show(Balancing.Payment.DJournalTotalsContainer);
            };
            button.appendChild(document.createTextNode("Close"));
            return button;
        }
        static createPaymentTableHeader(paymentType, paymentDate) {
            let thead = document.createElement("THEAD");
            let trTitle = document.createElement("tr");
            let paymentTypeHeader = document.createElement("th");
            paymentTypeHeader.colSpan = 2;
            paymentTypeHeader.appendChild(document.createTextNode(paymentType + " Payments"));
            paymentTypeHeader.classList.add("has-text-centered");
            paymentTypeHeader.style.verticalAlign = "middle";
            let paymentDateHeader = document.createElement("th");
            paymentDateHeader.classList.add("has-text-centered");
            paymentDateHeader.appendChild(document.createTextNode(paymentDate));
            paymentDateHeader.style.verticalAlign = "middle";
            let closeButtonHeader = document.createElement("th");
            closeButtonHeader.classList.add("has-text-centered");
            closeButtonHeader.appendChild(Balancing.Payment.CreateCloseButton());
            trTitle.appendChild(paymentTypeHeader);
            trTitle.appendChild(paymentDateHeader);
            trTitle.appendChild(closeButtonHeader);
            thead.appendChild(trTitle);
            let tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCell("th", "Cashier Id", "20%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Name", "40%"));
            tr.appendChild(Balancing.Payment.createTableCell("th", "Transaction Date", "25%"));
            let total = Balancing.Payment.createTableCell("th", "Total", "15%", "has-text-right");
            tr.appendChild(total);
            thead.appendChild(tr);
            return thead;
        }
        static createPaymentTableFooter() {
            let tfoot = document.createElement("TFOOT");
            let tr = document.createElement("tr");
            let td = document.createElement("td");
            td.colSpan = 3;
            let closeButton = document.createElement("td");
            closeButton.classList.add("has-text-centered");
            closeButton.appendChild(Balancing.Payment.CreateCloseButton());
            tr.appendChild(td);
            tr.appendChild(closeButton);
            tfoot.appendChild(tr);
            return tfoot;
        }
        static createTableCell(type, value, width, className = "") {
            let cell = document.createElement(type);
            cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        }
        static createTableCellLink(type, value, width) {
            let cell = document.createElement(type);
            cell.width = width;
            let link = document.createElement("a");
            link.onclick = () => {
                Utilities.Set_Text(link, "loading...");
                Utilities.Set_Value("receiptSearch", value);
                clayPay.ClientResponse.BalancingSearch(link);
            };
            link.appendChild(document.createTextNode(value));
            cell.appendChild(link);
            return cell;
        }
    }
    Payment.PaymentsContainer = "djournalPaymentsByType";
    Payment.DJournalTotalsContainer = "djournalTotals";
    Payment.DJournalReceiptContainer = "receiptView";
    Balancing.Payment = Payment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Payment.js.map