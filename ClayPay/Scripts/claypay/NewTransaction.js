/// <reference path="payment.ts" />
var clayPay;
/// <reference path="payment.ts" />
(function (clayPay) {
    class NewTransaction {
        constructor() {
            this.OTid = 0; // used after the transaction is saved
            this.CashierId = ""; // used after the transaction is saved
            this.ItemIds = [];
            this.CCData = null;
            this.Payments = [];
            this.errors = [];
            this.TotalAmountDue = 0;
            this.CheckPayment = new clayPay.Payment(clayPay.payment_type.check);
            this.CashPayment = new clayPay.Payment(clayPay.payment_type.cash);
        }
        Validate() {
            this.UpdateTotals();
            return false;
        }
        UpdateTotals() {
            let TotalPaid = 0;
            if (this.CheckPayment.Validated)
                TotalPaid += this.CheckPayment.Amount;
            if (this.CashPayment.Validated)
                TotalPaid += this.CashPayment.Amount;
            Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(TotalPaid));
        }
        ValidatePayer() {
            this.ResetPayerData();
            this.PayerFirstName = Utilities.Validate_Text(NewTransaction.payerFirstName, NewTransaction.payerNameError, "The Firstname field is required.");
            if (this.PayerFirstName.length === 0)
                return;
            this.PayerLastName = Utilities.Validate_Text(NewTransaction.payerLastName, NewTransaction.payerNameError, "The Lastname field is required.");
            if (this.PayerLastName.length === 0)
                return;
            this.PayerPhoneNumber = Utilities.Validate_Text(NewTransaction.payerPhone, NewTransaction.payerPhoneError, "The Phone number field is required.");
            if (this.PayerPhoneNumber.length === 0)
                return;
            if (this.PayerPhoneNumber.length < 10) {
                Utilities.Error_Show(NewTransaction.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
                let element = document.getElementById(NewTransaction.payerPhone);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.PayerEmailAddress = Utilities.Get_Value(NewTransaction.payerEmail).trim();
            this.PayerCompanyName = Utilities.Get_Value(NewTransaction.payerCompany).trim();
            this.PayerStreetAddress = Utilities.Validate_Text(NewTransaction.payerStreet, NewTransaction.payerStreetError, "The street address field is required.");
            if (this.PayerStreetAddress.length === 0)
                return;
            this.PayerCity = Utilities.Validate_Text(NewTransaction.payerCity, NewTransaction.payerCityError, "The City field is required.");
            if (this.PayerCity.length === 0)
                return;
            this.PayerState = Utilities.Validate_Text(NewTransaction.payerState, NewTransaction.payerCityError, "The State field is required.");
            if (this.PayerState.length === 0)
                return;
            this.PayerZip = Utilities.Validate_Text(NewTransaction.payerZip, NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
            if (this.PayerZip.length === 0)
                return;
            if (this.PayerZip.length < 5) {
                Utilities.Error_Show(NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
                let element = document.getElementById(NewTransaction.payerZip);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            // if they make it to the end, let's hide the button and show the payment info
            Utilities.Hide("validatePayer");
            Utilities.Show("paymentData");
        }
        ResetPayerForm() {
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
    }
    // Menu Ids
    NewTransaction.TotalAmountPaidMenu = "cartTotalAmountPaid";
    NewTransaction.TotalAmountDueMenu = "cartTotalAmountDue";
    NewTransaction.TotalAmountRemainingMenu = "";
    NewTransaction.TotalChangeDueMenu = "";
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
    // Payer error text elemnets
    NewTransaction.payerNameError = "payerNameError";
    NewTransaction.payerPhoneError = "payerPhoneError";
    NewTransaction.payerStreetError = "payerStreetError";
    NewTransaction.payerCityError = "payerCityError";
    clayPay.NewTransaction = NewTransaction;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=newtransaction.js.map