var clayPay;
(function (clayPay) {
    class CCData {
        constructor(FirstName, LastName, CardNumber, CardType, ExpMonth, ExpYear, CVVNumber, ZipCode, EmailAddress, Total, ItemIds) {
            this.FirstName = FirstName;
            this.LastName = LastName;
            this.CardNumber = CardNumber;
            this.CardType = CardType;
            this.ExpMonth = ExpMonth;
            this.ExpYear = ExpYear;
            this.CVVNumber = CVVNumber;
            this.ZipCode = ZipCode;
            this.EmailAddress = EmailAddress;
            this.Total = Total;
            this.ItemIds = ItemIds;
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
            if (this.ItemIds === null || this.ItemIds.length === 0) {
                errors.push('No items were found in the cart.  Please check this and try again.');
            }
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
        Save() {
            let ccd = this;
            return new Promise(function (resolve, reject) {
                if (ccd.Validate().length > 0) {
                    return reject(false);
                }
                else {
                    // do actual save stuff here        
                    var x = XHR.Put("./API/Pay", JSON.stringify(ccd));
                    x.then(function (response) {
                        // decide what happens when the payment is successful.
                        return resolve(response.Text);
                    }, function (e) {
                        if (e.Text.toLowerCase().indexOf("message")) {
                            return reject(JSON.parse(e.Text).Message);
                        }
                        else {
                            return reject(e.Text);
                        }
                    });
                }
            });
        }
    }
    clayPay.CCData = CCData;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=CCData.js.map