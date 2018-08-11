/// <reference path="transport.ts" />
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
        clayPay.UI.buildMenuElements();
        loadDefaultValues();
        window.onhashchange = HandleHash;
        if (location.hash.substring(1).length > 0) {
            HandleHash();
        }
    }
    clayPay.start = start;
    function HandleHash() {
        let hash = location.hash;
        let currentHash = new clayPay.LocationHash(location.hash.substring(1));
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
        let button = document.getElementById(buttonId);
        Utilities.Set_Text(inputId, value);
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
            .onclick = () => {
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
            .onclick = () => {
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
            .onclick = () => {
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
            .onclick = () => {
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
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0) {
            path = "/claypay/";
        }
        Utilities.Get(path + "API/Payments/Fee/")
            .then(function (fee) {
            clayPay.ConvenienceFee = fee;
            console.log('conv fee is', fee);
        }, function (e) {
            console.log('error getting convenience fee', e);
            // do something with the error here
        });
    }
    function loadApplicationTypes() {
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
})(clayPay || (clayPay = {}));
//# sourceMappingURL=claypay.js.map