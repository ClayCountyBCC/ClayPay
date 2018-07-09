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
        UpdateTotal() {
            let input = this.PaymentType === payment_type.cash ? Payment.cashAmountInput : Payment.checkAmountInput;
            Utilities.Set_Value(input, this.Amount.toFixed(2));
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
            this.Validated = false;
            let cashAmount = document.getElementById(Payment.cashAmountInput);
            let cashError = document.getElementById(Payment.cashErrorElement);
            cashAmount.classList.remove("is-danger");
            // check that an amount was entered.
            let testAmount = Utilities.Get_Value(cashAmount).trim();
            if (testAmount.length === 0) {
                cashAmount.classList.add("is-danger");
                Utilities.Error_Show(cashError, "You must enter an amount in order to continue.");
                return false;
            }
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.
            // We are also going to make sure that the amount is >= 0.
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                this.Amount = 0;
                Utilities.Error_Show(cashError, "An invalid amount was entered.");
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.cashPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide('cashPaymentType');
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        }
        ValidateCheck() {
            this.Validated = false;
            let checkAmount = document.getElementById(Payment.checkAmountInput);
            let checkNumber = document.getElementById(Payment.checkNumberInput);
            let checkError = document.getElementById(Payment.checkErrorElement);
            checkAmount.classList.remove("is-danger");
            checkNumber.classList.remove("is-danger");
            // check that an amount was entered.
            let testAmount = Utilities.Get_Value(checkAmount).trim();
            if (testAmount.length === 0) {
                checkAmount.classList.add("is-danger");
                Utilities.Error_Show(checkError, "You must enter an amount in order to continue.");
                return false;
            }
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.
            // We are also going to make sure that the amount is >= 0.
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                this.Amount = 0;
                Utilities.Error_Show(checkError, "An invalid amount was entered.");
                return false;
            }
            // get the check number
            this.CheckNumber = Utilities.Get_Value(checkNumber).trim();
            if (this.CheckNumber.length === 0) {
                checkNumber.classList.add("is-danger");
                Utilities.Error_Show(checkError, "The Check number is required.");
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.checkPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide('checkPaymentType');
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        }
        static ResetAll() {
            Payment.ResetCash();
            Payment.ResetCheck();
        }
        static ResetCash() {
            clayPay.CurrentTransaction.CashPayment = new Payment(payment_type.cash);
            let e = document.getElementById(Payment.cashAmountInput);
            Utilities.Set_Value(e, "");
            e.classList.remove("is-danger");
            let menu = document.getElementById(Payment.cashPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide('cashPaymentType');
            clayPay.CurrentTransaction.Validate();
        }
        static ResetCheck() {
            clayPay.CurrentTransaction.CheckPayment = new Payment(payment_type.check);
            let amount = document.getElementById(Payment.checkAmountInput);
            Utilities.Set_Value(amount, "");
            amount.classList.remove("is-danger");
            let number = document.getElementById(Payment.checkNumberInput);
            Utilities.Set_Value(number, "");
            number.classList.remove("is-danger");
            let menu = document.getElementById(Payment.checkPaymentTotalMenu);
            Utilities.Set_Text(menu, "Add");
            Utilities.Hide('checkPaymentType');
            clayPay.CurrentTransaction.Validate();
        }
    }
    Payment.checkErrorElement = "checkPaymentError";
    Payment.checkAmountInput = "checkPaymentAmount";
    Payment.checkNumberInput = "checkNumber";
    Payment.checkPaymentTotalMenu = "checkPaymentTotal";
    Payment.cashErrorElement = "cashPaymentError";
    Payment.cashAmountInput = "cashPaymentAmount";
    Payment.cashPaymentTotalMenu = "cashPaymentTotal";
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=payment.js.map