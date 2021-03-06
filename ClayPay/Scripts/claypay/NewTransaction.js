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
            this.TotalAmountDueInt = 0;
            this.TotalAmountPaid = 0;
            this.TotalAmountPaidInt = 0;
            this.TotalAmountRemaining = 0;
            this.TotalAmountRemainingInt = 0;
            this.TotalChangeDue = 0;
            this.TotalChangeDueInt = 0;
            this.Save = Utilities.Debounce(function () {
                clayPay.CurrentTransaction.DebouncedSave();
            }, 1000, true);
            this.UpdateIsCashier();
        }
        NewTransaction.prototype.UpdateIsCashier = function () {
            var e = document.getElementById(clayPay.Payment.checkPaymentContainer);
            this.IsCashier = e !== undefined && e !== null;
        };
        NewTransaction.prototype.Validate = function () {
            var payments = false;
            if (clayPay.CurrentTransaction.IsCashier) {
                clayPay.CurrentTransaction.UpdateTotals();
                payments = clayPay.CurrentTransaction.ValidatePayments();
            }
            var payer = clayPay.CurrentTransaction.TransactionCashierData.ValidatePayer();
            if (!payer) {
                Utilities.Show("validatePayer");
                Utilities.Hide("paymentData");
                return false;
            }
            else {
                Utilities.Hide("validatePayer");
                Utilities.Show("paymentData");
            }
            //console.log('values', this.TotalAmountDue, this.TotalAmountPaid, this.TotalAmountRemaining);
            if (this.IsCashier) {
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
            this.TotalAmountPaidInt = 0;
            this.TotalAmountRemaining = 0;
            this.TotalAmountRemainingInt = 0;
            this.TotalChangeDue = 0;
            this.TotalChangeDueInt = 0;
            var TotalPaid = 0;
            var TotalPaidInt = 0;
            if (this.CheckPayment.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CheckPayment.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CheckPayment.AmountInt;
            }
            if (this.CashPayment.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CashPayment.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CashPayment.AmountInt;
            }
            if (this.CCData.Validated) {
                TotalPaid += clayPay.CurrentTransaction.CCData.Amount;
                TotalPaidInt += clayPay.CurrentTransaction.CCData.AmountInt;
            }
            this.TotalAmountPaid = TotalPaid;
            this.TotalAmountPaidInt = TotalPaidInt;
            this.TotalAmountDueInt = parseInt((this.TotalAmountDue * 100).toString());
            this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
            this.TotalAmountRemainingInt = Math.max(this.TotalAmountDueInt - this.TotalAmountPaidInt, 0);
            if (this.TotalAmountDueInt - this.TotalAmountPaidInt < 0) {
                clayPay.CurrentTransaction.TotalChangeDue = clayPay.CurrentTransaction.TotalAmountPaid - clayPay.CurrentTransaction.TotalAmountDue;
                clayPay.CurrentTransaction.TotalChangeDueInt = parseInt((clayPay.CurrentTransaction.TotalChangeDue * 100).toString());
            }
            clayPay.CurrentTransaction.UpdateForm();
        };
        NewTransaction.prototype.UpdateForm = function () {
            Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountDue));
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountPaid));
            Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalChangeDue));
            Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(clayPay.CurrentTransaction.TotalAmountRemaining));
            var amount = clayPay.CurrentTransaction.TotalAmountRemaining.toFixed(2);
            if (!clayPay.CurrentTransaction.CCData.Validated)
                Utilities.Set_Value(clayPay.CCPayment.AmountPaidInput, amount);
            if (!clayPay.CurrentTransaction.CheckPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.checkAmountInput, amount);
            if (!clayPay.CurrentTransaction.CashPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.cashAmountInput, amount);
        };
        NewTransaction.prototype.ValidatePayments = function () {
            if (this.IsCashier) {
                if (this.CashPayment.Validated && this.CashPayment.Amount > 0) {
                    if (this.TotalChangeDueInt >= this.CashPayment.AmountInt) {
                        Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
                        return false;
                    }
                }
                if (this.TotalChangeDueInt > 0 && (!this.CashPayment.Validated || this.CashPayment.AmountInt === 0)) {
                    Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.");
                    return false;
                }
                if (this.TotalAmountRemainingInt > 0) {
                    return false;
                }
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
        NewTransaction.prototype.DebouncedSave = function () {
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
                if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
                 {
                    Utilities.Error_Show(errorTarget, cr.Errors);
                }
                else {
                    if (clayPay.CurrentTransaction.IsCashier) {
                        clayPay.Payment.ResetAll();
                    }
                    clayPay.CurrentTransaction.TransactionCashierData.ResetPayerForm();
                    clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
                    clayPay.CurrentTransaction.UpdateTotals();
                    clayPay.CurrentTransaction.CCData.ResetForm();
                    Utilities.Show("validatePayer");
                    Utilities.Hide("paymentData");
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
//# sourceMappingURL=NewTransaction.js.map