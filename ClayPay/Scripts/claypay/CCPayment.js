var clayPay;
(function (clayPay) {
    class CCPayment {
        constructor() {
        }
        UpdatePayerData() {
            Utilities.Set_Value(CCPayment.FirstNameInput, this.FirstName);
            Utilities.Set_Value(CCPayment.LastNameInput, this.LastName);
            Utilities.Set_Value(CCPayment.EmailAddressInput, this.EmailAddress);
            Utilities.Set_Value(CCPayment.ZipCodeInput, this.ZipCode);
        }
        UpdateTotal() {
            Utilities.Set_Value(CCPayment.AmountPaidInput, this.Total.toFixed(2));
        }
        Validate() {
            let errors = [];
            this.FirstName = this.FirstName.trim();
            if (this.FirstName.length === 0) {
                errors.push('You must enter a First Name.');
            }
            this.LastName = this.LastName.trim();
            if (this.LastName.length === 0) {
                errors.push('You must enter a Last Name.');
            }
            this.CardNumber = this.CardNumber.trim();
            if (this.CardNumber.length === 0) {
                errors.push('You must enter a Card number.');
            }
            this.CVVNumber = this.CVVNumber.trim();
            if (this.CVVNumber.length === 0) {
                errors.push('You must enter a CVC number.');
            }
            this.ZipCode = this.ZipCode.trim();
            if (this.ZipCode.length === 0) {
                errors.push('You must enter a Zip Code.');
            }
            this.EmailAddress = this.EmailAddress.trim();
            if (this.EmailAddress.length === 0) {
                errors.push('You must enter an Email Address.');
            }
            // let's make sure there are some items
            //if (this.ItemIds === null || this.ItemIds.length === 0)
            //{
            //  errors.push('No items were found in the cart.  Please check this and try again.');
            //}
            // check the card type is one of the 4 we care about
            let cardTypes = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
            if (cardTypes.indexOf(this.CardType) === -1) {
                errors.push('An invalid Credit Card Type has been selected.');
            }
            // check the month/year expirations
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) === -1) {
                errors.push('An invalid Expiration Month has been selected.');
            }
            if (clayPay.UI.ExpYears.indexOf(this.ExpYear) === -1) {
                errors.push('An invalid Expiration Year has been selected.');
            }
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) !== -1 &&
                clayPay.UI.ExpYears.indexOf(this.ExpYear) !== -1) {
                let year = parseInt(this.ExpYear);
                let month = parseInt(this.ExpMonth);
                let expD = new Date(year, month - 1, 1); // subtracting 1 from month because Date's month is Base 0
                let tmpD = new Date();
                let thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);
                if (expD < thisMonth) {
                    errors.push('The expiration date entered has passed.  Please check it and try again.');
                }
            }
            return errors;
        }
    }
    CCPayment.FirstNameInput = "creditCardFirstName";
    CCPayment.LastNameInput = "creditCardLastName";
    CCPayment.ZipCodeInput = "creditCardZip";
    CCPayment.EmailAddressInput = "creditCardEmailAddress";
    CCPayment.ccNumberInput = "creditCardNumber";
    CCPayment.ccTypeSelect = "creditCardType";
    CCPayment.ccMonthSelect = "creditCardMonth";
    CCPayment.ccYearSelect = "creditCardYear";
    CCPayment.ccCVCInput = "creditCardCVV";
    CCPayment.AmountPaidInput = "creditCardPaymentAmount";
    clayPay.CCPayment = CCPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CCPayment.js.map