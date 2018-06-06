/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />
//let Card: any;
//let CurrentCard: any;
var clayPay;
/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />
//let Card: any;
//let CurrentCard: any;
(function (clayPay) {
    "use strict";
    function start() {
        loadDefaultValues();
    }
    clayPay.start = start;
    function loadDefaultValues() {
        loadApplicationTypes();
        loadCreditCardFee();
        loadCreditCardExpirationValues();
        clayPay.UI.BuildCardTypes("ccTypes");
    }
    function loadCreditCardExpirationValues() {
        clayPay.UI.BuildExpMonths("ccExpMonth");
        clayPay.UI.BuildExpYears("ccExpYear");
    }
    function loadCreditCardFee() {
        clayPay.transport.GetConvenienceFee().then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
        }, function () {
            console.log('error getting convenience fee');
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        clayPay.transport.GetApplicationTypes().then(function (appTypes) {
            clayPay.UI.BuildAppTypes(appTypes);
        }, function () {
            console.log('error getting application types');
            // do something with the error here
        });
    }
    function toggleNavDisplay(element) {
        clayPay.UI.toggleNav("navTopMenu", element);
        let section = document.getElementsByTagName("section");
        for (var i = 0; i < section.length; i++) {
            if (section[i].style.display !== "none") {
                section[i].style.display = "none";
            }
        }
        document.getElementById(element).style.display = "block";
    }
    clayPay.toggleNavDisplay = toggleNavDisplay;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map