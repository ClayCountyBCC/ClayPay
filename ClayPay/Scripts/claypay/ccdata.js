var clayPay;
(function (clayPay) {
    var CCData = (function () {
        function CCData(FirstName, LastName, CardNumber, CardType, ExpMonth, ExpYear, CVVNumber, ZipCode, EmailAddress, Total, ItemIds) {
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
        CCData.prototype.Validate = function () {
            var errors = [];
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
            if (this.ItemIds === null || this.ItemIds.length === 0) {
                errors.push('No items were found in the cart.  Please check this and try again.');
            }
            var cardTypes = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
            if (cardTypes.indexOf(this.CardType) === -1) {
                errors.push('An invalid Credit Card Type has been selected.');
            }
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) === -1) {
                errors.push('An invalid Expiration Month has been selected.');
            }
            if (clayPay.UI.ExpYears.indexOf(this.ExpYear) === -1) {
                errors.push('An invalid Expiration Year has been selected.');
            }
            if (clayPay.UI.ExpMonths.indexOf(this.ExpMonth) !== -1 &&
                clayPay.UI.ExpYears.indexOf(this.ExpYear) !== -1) {
                var year = parseInt(this.ExpYear);
                var month = parseInt(this.ExpMonth);
                var expD = new Date(year, month - 1, 1);
                var tmpD = new Date();
                var thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);
                if (expD < thisMonth) {
                    errors.push('The expiration date entered has passed.  Please check it and try again.');
                }
            }
            return errors;
        };
        CCData.prototype.Save = function () {
            var ccd = this;
            return new Promise(function (resolve, reject) {
                if (ccd.Validate().length > 0) {
                    return reject(false);
                }
                else {
                    var x = XHR.Put("./API/Pay", JSON.stringify(ccd));
                    x.then(function (response) {
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
        };
        return CCData;
    }());
    clayPay.CCData = CCData;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ccdata.js.map