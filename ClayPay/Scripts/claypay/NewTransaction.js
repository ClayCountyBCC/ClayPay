/// <reference path="payment.ts" />
var clayPay;
/// <reference path="payment.ts" />
(function (clayPay) {
    class NewTransaction {
        constructor() {
            this.OTid = 0; // used after the transaction is saved
            this.CashierId = ""; // used after the transaction is saved
            this.ItemIds = [];
            this.CCPayment = null;
            this.Payments = [];
            this.errors = [];
            this.CheckPayment = new clayPay.Payment(clayPay.payment_type.check);
            this.CashPayment = new clayPay.Payment(clayPay.payment_type.cash);
        }
        Validate() {
            return false;
        }
    }
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=NewTransaction.js.map