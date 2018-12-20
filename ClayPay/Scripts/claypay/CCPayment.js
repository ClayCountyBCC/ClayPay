var clayPay;
(function (clayPay) {
    var CCPayment = /** @class */ (function () {
        function CCPayment() {
            this.Validated = false;
            this.ValidateAndSave = Utilities.Debounce(function () {
                clayPay.CurrentTransaction.CCData.DebouncedValidateAndSave();
            }, 1500, true);
        }
        CCPayment.prototype.UpdatePayerData = function () {
            Utilities.Set_Value(CCPayment.FirstNameInput, this.FirstName);
            Utilities.Set_Value(CCPayment.LastNameInput, this.LastName);
            //Utilities.Set_Value(CCPayment.EmailAddressInput, this.EmailAddress);
            Utilities.Set_Value(CCPayment.ZipCodeInput, this.ZipCode);
        };
        CCPayment.prototype.UpdateTotal = function () {
            Utilities.Set_Value(CCPayment.AmountPaidInput, this.Amount.toFixed(2));
        };
        CCPayment.prototype.ResetForm = function () {
            this.ResetData();
            this.ResetFormErrors();
            // now clear the form
            Utilities.Set_Value(CCPayment.FirstNameInput, "");
            Utilities.Set_Value(CCPayment.LastNameInput, "");
            Utilities.Set_Value(CCPayment.ZipCodeInput, "");
            //Utilities.Set_Value(CCPayment.EmailAddressInput, "");
            Utilities.Set_Value(CCPayment.ccNumberInput, "");
            document.getElementById(CCPayment.ccTypeSelect).selectedIndex = 0;
            document.getElementById(CCPayment.ccMonthSelect).selectedIndex = 0;
            document.getElementById(CCPayment.ccYearSelect).selectedIndex = 0;
            Utilities.Set_Value(CCPayment.ccCVCInput, "");
            if (clayPay.CurrentTransaction.IsCashier) {
                Utilities.Set_Value(CCPayment.AmountPaidInput, "");
                Utilities.Hide(CCPayment.CreditCardForm);
            }
        };
        CCPayment.prototype.ResetData = function () {
            this.Amount = 0;
            this.Validated = false;
            this.FirstName = "";
            this.LastName = "";
            this.EmailAddress = "";
            this.ZipCode = "";
            this.CardNumber = "";
            this.CardType = "";
            this.ExpMonth = "";
            this.ExpYear = "";
            this.CVVNumber = "";
        };
        CCPayment.prototype.ResetFormErrors = function () {
            document.getElementById(CCPayment.FirstNameInput).classList.remove("is-danger");
            document.getElementById(CCPayment.LastNameInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ZipCodeInput).classList.remove("is-danger");
            //document.getElementById(CCPayment.EmailAddressInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ccNumberInput).classList.remove("is-danger");
            document.getElementById(CCPayment.ccTypeSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccMonthSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccYearSelect).parentElement.classList.remove("is-danger");
            document.getElementById(CCPayment.ccCVCInput).classList.remove("is-danger");
            if (clayPay.CurrentTransaction.IsCashier) {
                document.getElementById(CCPayment.AmountPaidInput).classList.remove("is-danger");
            }
        };
        CCPayment.prototype.Validate = function () {
            this.ResetData();
            this.ResetFormErrors();
            this.Validated = false;
            this.FirstName = Utilities.Validate_Text(CCPayment.FirstNameInput, CCPayment.NameError, "The Firstname field is required.");
            if (this.FirstName.length === 0)
                return;
            this.LastName = Utilities.Validate_Text(CCPayment.LastNameInput, CCPayment.NameError, "The Lastname field is required.");
            if (this.LastName.length === 0)
                return;
            this.ZipCode = Utilities.Validate_Text(CCPayment.ZipCodeInput, CCPayment.ZipError, "The Zip code field is required.");
            if (this.ZipCode.length === 0)
                return;
            if (this.ZipCode.length < 5) {
                Utilities.Error_Show(CCPayment.ZipError, "You must enter a Zip code of at least 5 digits.");
                var element = document.getElementById(CCPayment.ZipCodeInput);
                element.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            //this.EmailAddress = Utilities.Get_Value(CCPayment.EmailAddressInput).trim();
            //if (this.EmailAddress.length > 0 && this.EmailAddress.indexOf("@") == -1)
            //{
            //  Utilities.Error_Show(CCPayment.ZipError, "The email address appears to be invalid. Please correct it to continue.");
            //  let element = document.getElementById(CCPayment.EmailAddressInput);
            //  element.classList.add("is-danger");
            //  element.focus();
            //  element.scrollTo();
            //  return;
            //}
            this.CardNumber = Utilities.Validate_Text(CCPayment.ccNumberInput, CCPayment.NumberError, "The Credit Card Number field is required.");
            if (this.CardNumber.length === 0)
                return;
            this.CardType = Utilities.Validate_Text(CCPayment.ccTypeSelect, CCPayment.NumberError, "You must select a Card Type.");
            if (this.CardType.length === 0)
                return;
            var cardTypes = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
            if (cardTypes.indexOf(this.CardType) === -1) {
                Utilities.Error_Show(CCPayment.NumberError, "The credit card type appears to be invalid, please correct it and try again.");
                var element = document.getElementById(CCPayment.ccTypeSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            // add in some validation to ensure that only the months we've listed are valid.
            // and check to make sure that the month/year are not in the past.
            this.ExpMonth = Utilities.Validate_Text(CCPayment.ccMonthSelect, CCPayment.ExpirationError, "The Month Expiration field is required.");
            if (this.ExpMonth.length === 0)
                return;
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) === -1) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The Expiration Month appears to be invalid, please correct it and try again.");
                var element = document.getElementById(CCPayment.ccMonthSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.ExpYear = Utilities.Validate_Text(CCPayment.ccYearSelect, CCPayment.ExpirationError, "The Year Expiration field is required.");
            if (this.ExpYear.length === 0)
                return;
            if (clayPay.UI.ExpYears.indexOf(this.ExpYear) === -1) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The Expiration Year appears to be invalid, please correct it and try again.");
                var element = document.getElementById(CCPayment.ccYearSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            // here we're checking to make sure that the expiration date they put in is
            // greater than or equal to this month/year.
            var year = parseInt(this.ExpYear);
            var month = parseInt(this.ExpMonth);
            var expD = new Date(year, month - 1, 1); // subtracting 1 from month because Date's month is Base 0
            var tmpD = new Date();
            var thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);
            if (expD < thisMonth) {
                Utilities.Error_Show(CCPayment.ExpirationError, "The expiration date entered has passed.  Please check it and try again.");
                var element = document.getElementById(CCPayment.ccYearSelect);
                element.parentElement.classList.add("is-danger");
                element.focus();
                element.scrollTo();
                return;
            }
            this.CVVNumber = Utilities.Validate_Text(CCPayment.ccCVCInput, CCPayment.ExpirationError, "The CV Code field is required.");
            if (this.CVVNumber.length === 0)
                return;
            if (clayPay.CurrentTransaction.IsCashier) {
                var testAmount = Utilities.Validate_Text(CCPayment.AmountPaidInput, CCPayment.AmountError, "The Amount field is required.");
                if (testAmount.length === 0)
                    return;
                this.Amount = parseFloat(testAmount);
                if (clayPay.isNaN(this.Amount) || this.Amount < 0) {
                    this.Amount = 0;
                    Utilities.Error_Show(CCPayment.AmountError, "An invalid amount was entered.");
                    return false;
                }
                if (this.Amount > clayPay.CurrentTransaction.TotalAmountDue) {
                    var element = document.getElementById(CCPayment.AmountPaidInput);
                    element.classList.add("is-danger");
                    element.focus();
                    element.scrollTo();
                    Utilities.Error_Show(clayPay.Payment.checkErrorElement, "You cannot enter an amount for more than the total amount due.");
                    return false;
                }
            }
            else {
                clayPay.CurrentTransaction.CCData.Amount = clayPay.CurrentTransaction.TotalAmountDue;
            }
            this.Validated = true;
            if (clayPay.CurrentTransaction.IsCashier) {
                Utilities.Set_Text(CCPayment.creditCardTotalMenu, Utilities.Format_Amount(this.Amount));
                Utilities.Hide(CCPayment.CreditCardForm);
            }
            return clayPay.CurrentTransaction.Validate();
        };
        CCPayment.prototype.DebouncedValidateAndSave = function () {
            // TODO: This is the call from the button
            if (!this.Validate())
                return;
            clayPay.CurrentTransaction.DebouncedSave();
        };
        // credit card form container
        CCPayment.CreditCardForm = "creditCardPaymentType";
        // inputs
        CCPayment.FirstNameInput = "creditCardFirstName";
        CCPayment.LastNameInput = "creditCardLastName";
        CCPayment.ZipCodeInput = "creditCardZip";
        // static EmailAddressInput: string = "creditCardEmailAddress";
        CCPayment.ccNumberInput = "creditCardNumber";
        CCPayment.ccTypeSelect = "creditCardType";
        CCPayment.ccMonthSelect = "creditCardMonth";
        CCPayment.ccYearSelect = "creditCardYear";
        CCPayment.ccCVCInput = "creditCardCVV";
        CCPayment.AmountPaidInput = "creditCardPaymentAmount";
        // Error Inputs
        CCPayment.NameError = "creditCardNameError";
        CCPayment.ZipError = "creditCardZipError";
        CCPayment.NumberError = "creditCardNumberError";
        CCPayment.ExpirationError = "creditCardExpirationError";
        CCPayment.AmountError = "creditCardPaymentAmountError";
        // Menus
        CCPayment.creditCardTotalMenu = "creditCardPaymentTotal";
        return CCPayment;
    }());
    clayPay.CCPayment = CCPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CCPayment.js.map