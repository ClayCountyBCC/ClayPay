var clayPay;
(function (clayPay) {
    let payment_type;
    (function (payment_type) {
        payment_type[payment_type["credit_card"] = 0] = "credit_card";
        payment_type[payment_type["check"] = 1] = "check";
        payment_type[payment_type["cash"] = 2] = "cash";
    })(payment_type = clayPay.payment_type || (clayPay.payment_type = {}));
    class Payment {
        constructor() {
            this.Amount = 0;
        }
    }
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Payment.js.map