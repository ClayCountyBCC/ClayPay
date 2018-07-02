/// <reference path="payment.ts" />
var clayPay;
/// <reference path="payment.ts" />
(function (clayPay) {
    class NewTransaction {
        constructor() {
            this.OTid = 0;
            this.CashierId = "";
            this.ItemIds = [];
            this.CCPayment = null;
            this.Payments = [];
            this.errors = [];
        }
    }
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=NewTransaction.js.map