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
    }
    clayPay.ReceiptPayment = ReceiptPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ReceiptPayment.js.map