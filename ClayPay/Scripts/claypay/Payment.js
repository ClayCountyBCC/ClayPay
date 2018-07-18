Number.isNaN = Number.isNaN || function (value) {
    return value !== value;
};
var clayPay;
(function (clayPay) {
    let payment_type;
    (function (payment_type) {
        payment_type[payment_type["cash"] = 0] = "cash";
        payment_type[payment_type["check"] = 1] = "check";
        payment_type[payment_type["credit_card_public"] = 2] = "credit_card_public";
        payment_type[payment_type["impact_fee_credit"] = 3] = "impact_fee_credit";
        payment_type[payment_type["impact_fee_exemption"] = 4] = "impact_fee_exemption";
        payment_type[payment_type["impact_fee_waiver_school"] = 5] = "impact_fee_waiver_school";
        payment_type[payment_type["impact_fee_waiver_road"] = 6] = "impact_fee_waiver_road";
        payment_type[payment_type["credit_card_cashier"] = 7] = "credit_card_cashier";
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
            // check that an amount was entered.
            // It must be 0 or greater.
            let testAmount = Utilities.Validate_Text(Payment.cashAmountInput, Payment.cashErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.      
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                cashAmount.classList.add("is-danger");
                cashAmount.focus();
                cashAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");
                return false;
            }
            if (this.Amount === 0) {
                Payment.ResetCash();
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.cashPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide(Payment.cashPaymentContainer);
            clayPay.CurrentTransaction.Validate();
            return this.Validated;
        }
        ValidateCheck() {
            this.Validated = false;
            let checkAmount = document.getElementById(Payment.checkAmountInput);
            //let checkNumber = <HTMLInputElement>document.getElementById(Payment.checkNumberInput);
            //let checkError = document.getElementById(Payment.checkErrorElement);
            //checkAmount.classList.remove("is-danger");
            //checkNumber.classList.remove("is-danger");
            // check that an amount was entered.
            let testAmount = Utilities.Validate_Text(Payment.checkAmountInput, Payment.checkErrorElement, "You must enter an amount of 0 or greater in order to continue.");
            if (testAmount.length === 0)
                return;
            // check that it's a valid amount.
            // 0 is valid because they could've set it to greater than 0
            // and are now wanting to revert it back to 0.
            // We are also going to make sure that the amount is >= 0.
            this.Amount = parseFloat(testAmount);
            if (Number.isNaN(this.Amount) || this.Amount < 0) {
                checkAmount.classList.add("is-danger");
                checkAmount.focus();
                checkAmount.scrollTo();
                this.Amount = 0;
                Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
                return false;
            }
            if (this.Amount > clayPay.CurrentTransaction.TotalAmountDue) {
                checkAmount.classList.add("is-danger");
                checkAmount.focus();
                checkAmount.scrollTo();
                Utilities.Error_Show(Payment.checkErrorElement, "You cannot enter an amount for more than the total amount due.");
                return false;
            }
            // get the check number
            this.CheckNumber = Utilities.Validate_Text(Payment.checkNumberInput, Payment.checkErrorElement, "You must enter the check number to continue.");
            if (this.CheckNumber.length === 0)
                return;
            if (this.Amount === 0) {
                Payment.ResetCheck();
                return false;
            }
            this.Validated = true;
            Utilities.Set_Text(Payment.checkPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
            Utilities.Hide(Payment.checkPaymentContainer);
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
            Utilities.Hide(Payment.cashPaymentContainer);
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
            Utilities.Hide(Payment.checkPaymentContainer);
            clayPay.CurrentTransaction.Validate();
        }
    }
    Payment.checkErrorElement = "checkPaymentError";
    Payment.checkAmountInput = "checkPaymentAmount";
    Payment.checkNumberInput = "checkNumber";
    Payment.checkPaymentTotalMenu = "checkPaymentTotal";
    Payment.checkPaymentContainer = "checkPaymentType";
    Payment.cashErrorElement = "cashPaymentError";
    Payment.cashAmountInput = "cashPaymentAmount";
    Payment.cashPaymentTotalMenu = "cashPaymentTotal";
    Payment.cashPaymentContainer = "cashPaymentType";
    clayPay.Payment = Payment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=payment.js.map