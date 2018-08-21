var clayPay;
(function (clayPay) {
    class CashierData {
        constructor() {
            this.PayerFirstName = "";
            this.PayerLastName = "";
            this.PayerName = "";
            this.PayerPhoneNumber = "";
            this.PayerEmailAddress = "";
            this.PayerCompanyName = "";
            this.PayerStreetAddress = "";
            this.PayerStreet1 = "";
            this.PayerStreet2 = "";
            this.PayerCity = "";
            this.PayerState = "";
            this.PayerZip = "";
            this.UserName = "";
            this.TransactionDate = new Date();
        }
        ValidatePayer() {
            this.ResetPayerData();
            this.PayerFirstName = Utilities.Validate_Text(CashierData.payerFirstName, CashierData.payerNameError, "The Firstname field is required.");
            if (this.PayerFirstName.length === 0)
                return false;
            this.PayerLastName = Utilities.Validate_Text(CashierData.payerLastName, CashierData.payerNameError, "The Lastname field is required.");
            if (this.PayerLastName.length === 0)
                return false;
            this.PayerPhoneNumber = Utilities.Validate_Text(CashierData.payerPhone, CashierData.payerPhoneError, "The Phone number field is required.");
            if (this.PayerPhoneNumber.length === 0)
                return false;
            if (this.PayerPhoneNumber.length < 10) {
                Utilities.Error_Show(CashierData.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
                let element = document.getElementById(CashierData.payerPhone);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            this.PayerEmailAddress = Utilities.Get_Value(CashierData.payerEmail).trim();
            this.PayerCompanyName = Utilities.Get_Value(CashierData.payerCompany).trim();
            this.PayerStreetAddress = Utilities.Validate_Text(CashierData.payerStreet, CashierData.payerStreetError, "The street address field is required.");
            if (this.PayerStreetAddress.length === 0)
                return false;
            this.PayerCity = this.PayerState = Utilities.Get_Value(CashierData.payerCity).trim();
            this.PayerState = Utilities.Get_Value(CashierData.payerState).trim();
            this.PayerZip = Utilities.Validate_Text(CashierData.payerZip, CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
            if (this.PayerZip.length === 0)
                return false;
            if (this.PayerZip.length < 5) {
                Utilities.Error_Show(CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
                let element = document.getElementById(CashierData.payerZip);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return false;
            }
            return true;
        }
        ResetPayerForm() {
            Utilities.Set_Value(CashierData.payerCity, "");
            Utilities.Set_Value(CashierData.payerCompany, "");
            Utilities.Set_Value(CashierData.payerFirstName, "");
            Utilities.Set_Value(CashierData.payerLastName, "");
            Utilities.Set_Value(CashierData.payerPhone, "");
            Utilities.Set_Value(CashierData.payerEmail, "");
            Utilities.Set_Value(CashierData.payerStreet, "");
            document.getElementById(CashierData.payerState).selectedIndex = 0;
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
    // Payer Inputs
    CashierData.payerFirstName = "payerFirstName";
    CashierData.payerLastName = "payerLastName";
    CashierData.payerPhone = "payerPhone";
    CashierData.payerEmail = "payerEmailAddress";
    CashierData.payerCompany = "payerCompany";
    CashierData.payerStreet = "payerStreetAddress";
    CashierData.payerCity = "payerCity";
    CashierData.payerState = "payerState";
    CashierData.payerZip = "payerZip";
    // Payer error text elemnets
    CashierData.payerNameError = "payerNameError";
    CashierData.payerPhoneError = "payerPhoneError";
    CashierData.payerStreetError = "payerStreetError";
    CashierData.payerCityError = "payerCityError";
    clayPay.CashierData = CashierData;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CashierData.js.map