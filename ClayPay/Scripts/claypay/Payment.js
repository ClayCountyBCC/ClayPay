Number.isNaN = Number.isNaN || function (value) {
    return value !== value;
};
var clayPay;
(function (clayPay) {
    let payment_type;
    (function (payment_type) {
        payment_type[payment_type["credit_card"] = 0] = "credit_card";
        payment_type[payment_type["check"] = 1] = "check";
        payment_type[payment_type["cash"] = 2] = "cash";
    })(payment_type = clayPay.payment_type || (clayPay.payment_type = {}));
    class Payment {
        constructor(paymentType) {
            this.Amount = 0;
            this.CheckNumber = "";
            this.TransactionId = "";
            this.Validated = false;
            this.PaymentType = paymentType;
        }
        Validate() {
            this.Validated == false;
            this.Amount = 0;
            this.CheckNumber = "";
            this.TransactionId = "";
            // We don't need to validate Credit card payments here
            // because they are validated in CCData.
            if (this.PaymentType === payment_type.cash) {
                return this.ValidateCash();
            }
            else {
                return this.ValidateCheck();
            }
        }
        ValidateCash() {
            this.PopulateCash();
            if (Number.isNaN(this.Amount)) {
                Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");
            }
            else {
                this.Validated == true;
            }
            return this.Validated;
        }
        PopulateCash() {
            let value = Utilities.Get_Value(Payment.cashAmountInput).trim();
            if (value.length === 0)
                return;
            this.Amount = parseFloat(value);
        }
        ValidateCheck() {
            this.PopulateCheck();
            if (Number.isNaN(this.Amount)) {
                this.Amount = 0;
                Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
            }
            else {
                if (this.CheckNumber.length === 0 && this.Amount > 0) {
                    Utilities.Error_Show(Payment.checkErrorElement, "A Check number must be entered if a Check amount is entered.");
                }
                this.Validated == true;
            }
            return this.Validated;
        }
        PopulateCheck() {
            this.CheckNumber = Utilities.Get_Value(Payment.checkNumberInput).trim();
            let value = Utilities.Get_Value(Payment.checkAmountInput).trim();
            if (value.length === 0)
                return;
            this.Amount = parseFloat(value);
        }
    }
    Payment.checkErrorElement = "checkPaymentError";
    Payment.cashErrorElement = "cashPaymentError";
    Payment.checkAmountInput = "checkPaymentAmount";
    Payment.cashAmountInput = "checkPaymentAmount";
    Payment.checkNumberInput = "checkNumber";
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Payment.js.map