/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
var clayPay;
(function (clayPay) {
    var NewTransaction = /** @class */ (function () {
        function NewTransaction() {
            // CurrentCharges are the search results (charges) returned and displayed
            // in the results container.
            this.CurrentCharges = [];
            // Cart are the charges that the user chose from the CurrentCharges to
            // pay for in this session.
            this.Cart = [];
            this.OTid = 0; // used after the transaction is saved
            this.CashierId = ""; // used after the transaction is saved
            this.ItemIds = [];
            this.CCData = new clayPay.CCPayment();
            this.Payments = [];
            this.TransactionCashierData = new clayPay.CashierData();
            this.IsCashier = false;
            this.CheckPayment = new clayPay.Payment(clayPay.payment_type.check);
            this.CashPayment = new clayPay.Payment(clayPay.payment_type.cash);
            this.TotalAmountDue = 0;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
        }
        NewTransaction.prototype.UpdateIsCashier = function () {
            var e = document.getElementById(clayPay.Payment.checkPaymentContainer);
            this.IsCashier = e !== undefined && e !== null;
        };
        NewTransaction.prototype.Validate = function () {
            var payer = this.TransactionCashierData.ValidatePayer();
            if (!payer) {
                Utilities.Show("validatePayer");
                Utilities.Hide("paymentData");
                return false;
            }
            else {
                Utilities.Hide("validatePayer");
                Utilities.Show("paymentData");
            }
            if (this.IsCashier) {
                this.UpdateTotals();
                var payments = this.ValidatePayments();
                var button = document.getElementById(NewTransaction.PayNowCashierButton);
                button.disabled = !(payer && payments);
                return (payer && payments);
            }
            return true;
        };
        NewTransaction.prototype.UpdateTotals = function () {
            if (!this.IsCashier)
                return;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
            var TotalPaid = 0;
            if (this.CheckPayment.Validated)
                TotalPaid += this.CheckPayment.Amount;
            if (this.CashPayment.Validated)
                TotalPaid += this.CashPayment.Amount;
            if (this.CCData.Validated)
                TotalPaid += this.CCData.Amount;
            this.TotalAmountPaid = TotalPaid;
            this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
            if (this.TotalAmountDue - this.TotalAmountPaid < 0) {
                this.TotalChangeDue = this.TotalAmountPaid - this.TotalAmountDue;
            }
            this.UpdateForm();
        };
        NewTransaction.prototype.UpdateForm = function () {
            Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(this.TotalAmountDue));
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(this.TotalAmountPaid));
            Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(this.TotalChangeDue));
            Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(this.TotalAmountRemaining));
            var amount = this.TotalAmountRemaining.toFixed(2);
            if (!this.CCData.Validated)
                Utilities.Set_Value(clayPay.CCPayment.AmountPaidInput, amount);
            if (!this.CheckPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.checkAmountInput, amount);
            if (!this.CashPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.cashAmountInput, amount);
        };
        NewTransaction.prototype.ValidatePayments = function () {
            if (this.IsCashier) {
                if (this.CashPayment.Validated && this.CashPayment.Amount > 0) {
                    if (this.TotalChangeDue >= this.CashPayment.Amount) {
                        Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
                        return false;
                    }
                }
                if (this.TotalChangeDue > 0 && (!this.CashPayment.Validated || this.CashPayment.Amount === 0)) {
                    Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.");
                    return false;
                }
                if (this.TotalAmountRemaining > 0)
                    return false;
            }
            return true;
        };
        NewTransaction.prototype.CopyPayerData = function () {
            // this function is used when the user clicks the "This is the same as Payer Information"
            // checkbox in the credit card data.  It takes the information in that form and
            // updates the CCData with it and then the CCData object will update the CCData form.
            this.CCData.FirstName = this.TransactionCashierData.PayerFirstName;
            this.CCData.LastName = this.TransactionCashierData.PayerLastName;
            this.CCData.ZipCode = this.TransactionCashierData.PayerZip;
            // this.CCData.EmailAddress = this.TransactionCashierData.PayerEmailAddress;
            this.CCData.UpdatePayerData();
        };
        NewTransaction.prototype.Save = function () {
            // Disable the button that was just used so that it can't be clicked multiple times.
            var loadingButton = this.IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            Utilities.Toggle_Loading_Button(loadingButton, true);
            if (!this.Validate()) {
                Utilities.Toggle_Loading_Button(loadingButton, false);
                return;
            }
            this.ItemIds = clayPay.CurrentTransaction.Cart.map(function (c) {
                return c.ItemId;
            });
            this.Payments = [];
            var IsCashier = this.IsCashier;
            var toggleButton = IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
            var errorTarget = IsCashier ? clayPay.ClientResponse.CashierErrorTarget : clayPay.ClientResponse.PublicErrorTarget;
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/Payments/Pay/", this)
                .then(function (cr) {
                console.log('client response', cr);
                if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
                 {
                    Utilities.Error_Show(errorTarget, cr.Errors);
                }
                else {
                    if (clayPay.CurrentTransaction.IsCashier)
                        clayPay.Payment.ResetAll();
                    clayPay.CurrentTransaction.TransactionCashierData.ResetPayerForm();
                    clayPay.CurrentTransaction.CCData.ResetForm();
                    clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
                    clayPay.UI.updateCart();
                    clayPay.ClientResponse.ShowPaymentReceipt(cr, clayPay.ClientResponse.PaymentReceiptContainer);
                }
                Utilities.Toggle_Loading_Button(toggleButton, false);
                // need to reset the form and transaction / payment objects
            }, function (e) {
                // We should show an error in the same spot we'd show a client response error.
                Utilities.Error_Show(errorTarget, e);
                Utilities.Toggle_Loading_Button(toggleButton, false);
            });
        };
        // Menu Ids
        NewTransaction.TotalAmountPaidMenu = "cartTotalAmountPaid";
        NewTransaction.TotalAmountDueMenu = "cartTotalAmountDue";
        NewTransaction.TotalAmountRemainingMenu = "cartTotalAmountRemaining";
        NewTransaction.TotalChangeDueMenu = "cartTotalChangeDue";
        NewTransaction.PayNowCashierButton = "processPayments";
        NewTransaction.PayNowPublicButton = "processCCPayment";
        // Transaction Error container
        NewTransaction.paymentError = "paymentError";
        return NewTransaction;
    }());
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=newtransaction.js.map