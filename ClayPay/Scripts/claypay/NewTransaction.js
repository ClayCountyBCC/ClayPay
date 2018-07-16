/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
var clayPay;
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
(function (clayPay) {
    class NewTransaction {
        constructor() {
            this.OTid = 0; // used after the transaction is saved
            this.CashierId = ""; // used after the transaction is saved
            this.ItemIds = [];
            this.CCData = new clayPay.CCPayment();
            this.Payments = [];
            this.IsCashier = false;
            this.CheckPayment = new clayPay.Payment(clayPay.payment_type.check);
            this.CashPayment = new clayPay.Payment(clayPay.payment_type.cash);
            this.TotalAmountDue = 0;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
        }
        UpdateIsCashier() {
            let e = document.getElementById(clayPay.Payment.checkPaymentContainer);
            this.IsCashier = e !== undefined && e !== null;
        }
        Validate() {
            let payer = this.ValidatePayer();
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
                let payments = this.ValidatePayments();
                let button = document.getElementById(NewTransaction.PayNowCashierButton);
                button.disabled = !(payer && payments);
                return (payer && payments);
            }
            return true;
        }
        UpdateTotals() {
            if (!this.IsCashier)
                return;
            this.TotalAmountPaid = 0;
            this.TotalAmountRemaining = 0;
            this.TotalChangeDue = 0;
            let TotalPaid = 0;
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
        }
        UpdateForm() {
            Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(this.TotalAmountDue));
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(this.TotalAmountPaid));
            Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(this.TotalChangeDue));
            Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(this.TotalAmountRemaining));
            let amount = this.TotalAmountRemaining.toFixed(2);
            if (!this.CCData.Validated)
                Utilities.Set_Value(clayPay.CCPayment.AmountPaidInput, amount);
            if (!this.CheckPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.checkAmountInput, amount);
            if (!this.CashPayment.Validated)
                Utilities.Set_Value(clayPay.Payment.cashAmountInput, amount);
        }
        ValidatePayments() {
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
        }
        ValidatePayer() {
            this.ResetPayerData();
            this.PayerFirstName = Utilities.Validate_Text(NewTransaction.payerFirstName, NewTransaction.payerNameError, "The Firstname field is required.");
            if (this.PayerFirstName.length === 0)
                return false;
            this.PayerLastName = Utilities.Validate_Text(NewTransaction.payerLastName, NewTransaction.payerNameError, "The Lastname field is required.");
            if (this.PayerLastName.length === 0)
                return false;
            this.PayerPhoneNumber = Utilities.Validate_Text(NewTransaction.payerPhone, NewTransaction.payerPhoneError, "The Phone number field is required.");
            if (this.PayerPhoneNumber.length === 0)
                return false;
            if (this.PayerPhoneNumber.length < 10) {
                Utilities.Error_Show(NewTransaction.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
                let element = document.getElementById(NewTransaction.payerPhone);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            this.PayerEmailAddress = Utilities.Get_Value(NewTransaction.payerEmail).trim();
            this.PayerCompanyName = Utilities.Get_Value(NewTransaction.payerCompany).trim();
            this.PayerStreetAddress = Utilities.Validate_Text(NewTransaction.payerStreet, NewTransaction.payerStreetError, "The street address field is required.");
            if (this.PayerStreetAddress.length === 0)
                return false;
            this.PayerCity = Utilities.Validate_Text(NewTransaction.payerCity, NewTransaction.payerCityError, "The City field is required.");
            if (this.PayerCity.length === 0)
                return false;
            this.PayerState = Utilities.Validate_Text(NewTransaction.payerState, NewTransaction.payerCityError, "The State field is required.");
            if (this.PayerState.length === 0)
                return false;
            this.PayerZip = Utilities.Validate_Text(NewTransaction.payerZip, NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
            if (this.PayerZip.length === 0)
                return false;
            if (this.PayerZip.length < 5) {
                Utilities.Error_Show(NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
                let element = document.getElementById(NewTransaction.payerZip);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            return true;
        }
        ResetPayerForm() {
            Utilities.Set_Value(NewTransaction.payerCity, "");
            Utilities.Set_Value(NewTransaction.payerCompany, "");
            Utilities.Set_Value(NewTransaction.payerFirstName, "");
            Utilities.Set_Value(NewTransaction.payerLastName, "");
            Utilities.Set_Value(NewTransaction.payerPhone, "");
            Utilities.Set_Value(NewTransaction.payerEmail, "");
            Utilities.Set_Value(NewTransaction.payerStreet, "");
            document.getElementById(NewTransaction.payerState).selectedIndex = 0;
        }
        CopyPayerData() {
            // this function is used when the user clicks the "This is the same as Payer Information"
            // checkbox in the credit card data.  It takes the information in that form and
            // updates the CCData with it and then the CCData object will update the CCData form.
            this.CCData.FirstName = this.PayerFirstName;
            this.CCData.LastName = this.PayerLastName;
            this.CCData.ZipCode = this.PayerZip;
            this.CCData.EmailAddress = this.PayerEmailAddress;
            this.CCData.UpdatePayerData();
        }
        ResetPayerData() {
            this.PayerFirstName = "";
            this.PayerLastName = "";
            this.PayerPhoneNumber = "";
            this.PayerEmailAddress = "";
            this.PayerCompanyName = "";
            this.PayerState = "";
            this.PayerCity = "";
            this.PayerStreetAddress = "";
            this.PayerZip = "";
        }
        Save() {
            if (!this.Validate)
                return;
            if (this.IsCashier) {
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowCashierButton, true);
            }
            else {
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowPublicButton, true);
            }
            this.ItemIds = clayPay.UI.Cart.map((c) => {
                return c.ItemId;
            });
            this.Payments = [];
            if (this.IsCashier) {
                this.SaveAll();
            }
            else {
                this.SaveCC();
            }
        }
        SaveAll() {
            // we're going to be doing this on the backend now.
            //if (this.CashPayment.Validated) this.Payments.push(this.CashPayment);
            //if (this.CheckPayment.Validated) this.Payments.push(this.CheckPayment);      
            Utilities.Put("../API/Payments/Pay/", this)
                .then(function (cr) {
                clayPay.ClientResponse.HandleResponse(cr, this.IsCashier);
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowCashierButton, false);
                // need to reset the form and transaction / payment objects
            }, function (e) {
                // We should show an error in the same spot we'd show a client response error.
                Utilities.Error_Show(clayPay.ClientResponse.CashierErrorTarget, e);
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowCashierButton, false);
            });
        }
        SaveCC() {
            Utilities.Put("../API/Payments/Pay/", this)
                .then(function (cr) {
                clayPay.ClientResponse.HandleResponse(cr, this.IsCashier);
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowPublicButton, false);
                // need to reset the form and transaction / payment objects
            }, function (e) {
                // We should show an error in the same spot we'd show a client response error.
                Utilities.Error_Show(clayPay.ClientResponse.PublicErrorTarget, e);
                Utilities.Toggle_Loading_Button(NewTransaction.PayNowPublicButton, false);
            });
        }
    }
    // Menu Ids
    NewTransaction.TotalAmountPaidMenu = "cartTotalAmountPaid";
    NewTransaction.TotalAmountDueMenu = "cartTotalAmountDue";
    NewTransaction.TotalAmountRemainingMenu = "cartTotalAmountRemaining";
    NewTransaction.TotalChangeDueMenu = "cartTotalChangeDue";
    // Payer Inputs
    NewTransaction.payerFirstName = "payerFirstName";
    NewTransaction.payerLastName = "payerLastName";
    NewTransaction.payerPhone = "payerPhone";
    NewTransaction.payerEmail = "payerEmailAddress";
    NewTransaction.payerCompany = "payerCompany";
    NewTransaction.payerStreet = "payerStreetAddress";
    NewTransaction.payerCity = "payerCity";
    NewTransaction.payerState = "payerState";
    NewTransaction.payerZip = "payerZip";
    NewTransaction.PayNowCashierButton = "processPayments";
    NewTransaction.PayNowPublicButton = "processCCPayment";
    // Payer error text elemnets
    NewTransaction.payerNameError = "payerNameError";
    NewTransaction.payerPhoneError = "payerPhoneError";
    NewTransaction.payerStreetError = "payerStreetError";
    NewTransaction.payerCityError = "payerCityError";
    // Transaction Error container
    NewTransaction.paymentError = "paymentError";
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=NewTransaction.js.map