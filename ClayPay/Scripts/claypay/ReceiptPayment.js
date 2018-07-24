var clayPay;
(function (clayPay) {
    class ReceiptPayment {
        constructor() {
            this.CashierId = "";
            this.PayId = -1;
            this.OTId = -1;
            this.Info = "";
            this.TransactionDate = new Date();
            this.PaymentType = "";
            this.PaymentTypeDescription = "";
            this.AmountApplied = -1;
            this.AmountTendered = -1;
            this.ChangeDue = -1;
            this.ConvenienceFeeAmount = -1;
        }
        CreateReceiptPaymentView(receipts) {
            let df = document.createDocumentFragment();
            // Here we handle Change Due and Convenience fees.
            // We'll add a row for each of them that are > 0
            let changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0; });
            let changeDue = changeDueTmp.reduce((ChangeDue, b) => {
                return ChangeDue + b.ChangeDue;
            }, 0);
            let convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0; });
            let convenienceFee = convenienceFeeTmp.reduce((ConvenienceFeeAmount, b) => {
                return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
            }, 0);
            return df;
        }
        static CreateTable() {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Payment Type", "20%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Description", "40%"));
            //if (view !== ChargeView.receipt)
            //{
            //  tr.appendChild(UI.createTableHeaderElement("Date", "15%"));
            //  tr.appendChild(UI.createTableHeaderElement("Amount", "15%"));
            //  tr.appendChild(UI.createTableHeaderElement("", "10%"));
            //}
            //else
            //{
            //  tr.appendChild(UI.createTableHeaderElement("Date", "20%"));
            //  tr.appendChild(UI.createTableHeaderElement("Amount", "20%"));
            //}
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        }
    }
    clayPay.ReceiptPayment = ReceiptPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ReceiptPayment.js.map