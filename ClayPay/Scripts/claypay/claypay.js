/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />
//let Card: any;
//let CurrentCard: any;
var clayPay;
/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />
//let Card: any;
//let CurrentCard: any;
(function (clayPay) {
    "use strict";
    clayPay.TotalAmountDue = 0;
    clayPay.CreditCardAmount = 0;
    clayPay.CheckAmount = 0;
    clayPay.CashAmount = 0;
    clayPay.ChangeOwed = 0;
    function start() {
        HandleUIEvents();
        clayPay.UI.buildMenuElements();
        loadDefaultValues();
    }
    clayPay.start = start;
    function HandleUIEvents() {
        document.getElementById('permitSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
            }
        };
        document.getElementById("permitSearchButton")
            .onclick = () => {
            clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
        };
        document.getElementById('contractorSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
                return false;
            }
        };
        document.getElementById("contractorSearchButton")
            .onclick = () => {
            clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
            return false;
        };
        document.getElementById('applicationSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
                return false;
            }
        };
        document.getElementById("applicationSearchButton")
            .onclick = () => {
            clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
            return false;
        };
    }
    function loadDefaultValues() {
        loadApplicationTypes();
        clayPay.UI.BuildPayerStates();
        loadCreditCardFee();
        loadCreditCardExpirationValues();
    }
    function loadCreditCardExpirationValues() {
        clayPay.UI.BuildExpMonths("creditCardMonth");
        clayPay.UI.BuildExpYears("creditCardYear");
    }
    function loadCreditCardFee() {
        //"./API/Fee/"
        Utilities.Get("./API/Fee/")
            .then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
        }, function () {
            console.log('error getting convenience fee');
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        //transport.GetApplicationTypes().then(function (appTypes: Array<AppType>)
        Utilities.Get("./API/Apptypes/")
            .then(function (appTypes) {
            clayPay.UI.BuildAppTypes(appTypes);
        }, function () {
            console.log('error getting application types');
            // do something with the error here
        });
    }
    //export function toggleNavDisplay(element: string): void
    //{
    //  UI.toggleNav("navTopMenu", element);
    //  let section = document.getElementsByTagName("section");
    //  for (var i = 0; i < section.length; i++)
    //  {
    //    if (section[i].style.display !== "none")
    //    {
    //      section[i].style.display = "none";
    //    }
    //  }
    //  document.getElementById(element).style.display = "block";
    //}
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map