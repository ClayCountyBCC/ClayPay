/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="CCPayment.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />
//let Card: any;
//let CurrentCard: any;
var clayPay;
(function (clayPay) {
    "use strict";
    clayPay.CurrentTransaction = new clayPay.NewTransaction();
    function start() {
        clayPay.CurrentTransaction.UpdateIsCashier();
        HandleUIEvents();
        clayPay.UI.buildMenuElements(clayPay.CurrentTransaction.IsCashier);
        loadDefaultValues();
        window.onhashchange = HandleHash;
    }
    clayPay.start = start;
    function HandleHash() {
        var hash = location.hash;
        var currentHash = new clayPay.LocationHash(location.hash.substring(1));
        if (currentHash.Permit.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[1]);
            HandleSearch('permitSearchButton', 'permitSearch', currentHash.Permit);
            return;
        }
        if (currentHash.CashierId.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[5]);
            HandleSearch('receiptSearchButton', 'receiptSearch', currentHash.CashierId);
            return;
        }
        if (currentHash.ContractorId.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[2]);
            HandleSearch('contractorSearchButton', 'contractorSearch', currentHash.ContractorId);
            return;
        }
        if (currentHash.ApplicationNumber.length > 0) {
            Utilities.Update_Menu(clayPay.UI.Menus[3]);
            HandleSearch('applicationSearchButton', 'applicationSearch', currentHash.ApplicationNumber);
            return;
        }
    }
    clayPay.HandleHash = HandleHash;
    function HandleSearch(buttonId, inputId, value) {
        var button = document.getElementById(buttonId);
        Utilities.Set_Value(inputId, value);
        button.click();
    }
    function HandleUIEvents() {
        document.getElementById('permitSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
            }
        };
        document.getElementById("permitSearchButton")
            .onclick = function () {
            clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
        };
        document.getElementById('contractorSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
            }
        };
        document.getElementById("contractorSearchButton")
            .onclick = function () {
            clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
        };
        document.getElementById('applicationSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
            }
        };
        document.getElementById("applicationSearchButton")
            .onclick = function () {
            clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError');
        };
        document.getElementById('receiptSearch')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                clayPay.ClientResponse.Search();
            }
        };
        document.getElementById("receiptSearchButton")
            .onclick = function () {
            clayPay.ClientResponse.Search();
        };
    }
    function loadDefaultValues() {
        loadApplicationTypes();
        clayPay.UI.BuildPayerStates(clayPay.UI.AllStates, "payerState");
        loadCreditCardFee();
        loadCreditCardExpirationValues();
    }
    function loadCreditCardExpirationValues() {
        clayPay.UI.BuildExpMonths("creditCardMonth");
        clayPay.UI.BuildExpYears("creditCardYear");
    }
    function loadCreditCardFee() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Fee/")
            .then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
            if (location.hash.substring(1).length > 0) {
                HandleHash();
            }
        }, function (e) {
            console.log('error getting convenience fee', e);
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        var path = "/";
        var i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Apptypes/")
            .then(function (appTypes) {
            clayPay.UI.BuildAppTypes(appTypes);
        }, function (e) {
            console.log('error getting application types', e);
            // do something with the error here
        });
    }
    function isNaN(value) {
        return value !== value;
    }
    clayPay.isNaN = isNaN;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map