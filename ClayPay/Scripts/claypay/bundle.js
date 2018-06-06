/*  This code was written by macromaniac
 *  Originally pulled from: https://gist.github.com/macromaniac/e62ed27781842b6c8611 on 7/14/2016
 *  and from https://gist.github.com/takanori-ugai/8262008944769419e614
 *
 */
var XHR;
/*  This code was written by macromaniac
 *  Originally pulled from: https://gist.github.com/macromaniac/e62ed27781842b6c8611 on 7/14/2016
 *  and from https://gist.github.com/takanori-ugai/8262008944769419e614
 *
 */
(function (XHR) {
    class Header {
        constructor(header, data) {
            this.header = header;
            this.data = data;
        }
    }
    XHR.Header = Header;
    class Data {
    }
    XHR.Data = Data;
    function DataFromJSXHR(jsXHR) {
        var data = new Data();
        data.Headers = jsXHR.getAllResponseHeaders();
        data.Text = jsXHR.responseText;
        data.Type = jsXHR.responseType;
        data.Status = jsXHR.status;
        data.StatusText = jsXHR.statusText;
        return data;
    }
    function SendCommand(method, url, headers, data = "") {
        return new Promise(function (resolve, reject) {
            var jsXHR = new XMLHttpRequest();
            jsXHR.open(method, url);
            if (headers != null)
                headers.forEach(header => jsXHR.setRequestHeader(header.header, header.data));
            jsXHR.onload = (ev) => {
                if (jsXHR.status < 200 || jsXHR.status >= 300) {
                    reject(DataFromJSXHR(jsXHR));
                }
                resolve(DataFromJSXHR(jsXHR));
            };
            jsXHR.onerror = (ev) => {
                reject("There was an error communicating with the server.  Please check your connection and try again.");
            };
            if (data.length > 0)
                jsXHR.send(data);
            else
                jsXHR.send();
        });
    }
    function addJSONHeader(headers) {
        if (headers === null || headers.length == 0) {
            headers = [
                new XHR.Header("Content-Type", "application/json; charset=utf-8"),
                new XHR.Header("Accept", "application/json")
            ];
        }
        else {
            headers.push(new XHR.Header("Content-Type", "application/json; charset=utf-8"));
            headers.push(new XHR.Header("Accept", "application/json"));
        }
        return headers;
    }
    function Get(url, headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('GET', url, headers);
    }
    XHR.Get = Get;
    function Post(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('POST', url, headers, data);
    }
    XHR.Post = Post;
    function Put(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('PUT', url, headers, data);
    }
    XHR.Put = Put;
    function Delete(url, data = "", headers = null, isJSON = true) {
        headers = (isJSON ? addJSONHeader(headers) : headers);
        return SendCommand('DELETE', url, headers, data);
    }
    XHR.Delete = Delete;
    function GetArray(url, queryString = "") {
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                let ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    XHR.GetArray = GetArray;
    function GetObject(url, queryString = "") {
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                let ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    XHR.GetObject = GetObject;
    function SaveObject(url, object) {
        var x = XHR.Post(url, JSON.stringify(object));
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                if (response.Text.length === 0) {
                    resolve([]);
                }
                else {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }
            }).catch(function (e) {
                console.log('save object error ' + url + ' ' + e);
                reject(null);
            });
        });
    }
    XHR.SaveObject = SaveObject;
})(XHR || (XHR = {}));
//# sourceMappingURL=XHR.js.map
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
/// <reference path="../app/xhr.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
var clayPay;
/// <reference path="../app/xhr.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
(function (clayPay) {
    var transport;
    (function (transport) {
        "use strict";
        function GetApplicationTypes() {
            var x = XHR.Get("./API/Apptypes/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Application Types");
                    reject(null);
                });
            });
        }
        transport.GetApplicationTypes = GetApplicationTypes;
        function GetConvenienceFee() {
            var x = XHR.Get("./API/Fee/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Convenience Fee");
                    reject(null);
                });
            });
        }
        transport.GetConvenienceFee = GetConvenienceFee;
        function GetCharges(key) {
            var x = XHR.Get("./API/Query/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Charges");
                    reject(null);
                });
            });
        }
        transport.GetCharges = GetCharges;
    })(transport = clayPay.transport || (clayPay.transport = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=transport.js.map
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="claypay.ts" />
var clayPay;
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="claypay.ts" />
(function (clayPay) {
    var UI;
    (function (UI) {
        "use strict";
        let Cart = [];
        let CurrentCharges = [];
        UI.ExpMonths = ['01', '02', '03', '04', '05',
            '06', '07', '08', '09', '10', '11', '12'];
        UI.ExpYears = [];
        function Submit() {
            Disable('btnSubmit');
            Hide('errorList');
            Hide('PaymentPosting');
            let f = document.getElementById('paymentForm');
            if (!f.checkValidity())
                return false;
            let itemIds = Cart.map(function (i) {
                return i.ItemId;
            });
            let total = Cart.reduce((total, b) => {
                return total + b.Total;
            }, 0);
            total = parseFloat(total.toFixed(2));
            let cc = new clayPay.CCData(getValue('ccFirstName'), getValue('ccLastName'), getValue('cardNumber'), getValue('ccTypes'), getValue('ccExpMonth'), getValue('ccExpYear'), getValue('ccCVV'), getValue('ccZip'), getValue('emailAddress'), total, itemIds);
            let errors = cc.Validate(); // clientside validation
            if (errors.length === 0) {
                Hide('CCForm'); // Hide the form
                Show('PaymentPosting'); // show swirly
                let save = cc.Save();
                save.then(function (response) {
                    let pr = JSON.parse(response);
                    resetApp();
                    PopulateReceipt(pr);
                }, function (reject) {
                    Show('errorList');
                    errors = [reject];
                    BuildErrors(errors);
                    Show('CCForm');
                    Hide('PaymentPosting');
                    Enable('btnSubmit');
                });
            }
            else {
                // show errors section
                Show('errorList');
                BuildErrors(errors);
                Enable('btnSubmit');
            }
            return false;
        }
        UI.Submit = Submit;
        function resetApp() {
            CurrentCharges = [];
            Cart = [];
            updateCart();
            updateCartNav();
            // reset paymentForm
            let f = document.getElementById('paymentForm');
            f.reset();
            Enable('btnSubmit');
            Show('CCForm');
            Hide('PaymentPosting');
        }
        function PopulateReceipt(pr) {
            clayPay.toggleNavDisplay('receipt');
            SetInputValue("receiptUniqueId", pr.CashierId);
            SetInputValue("receiptTimestamp", pr.TimeStamp_Display);
            SetInputValue("receiptAmount", pr.Amount.toFixed(2));
        }
        function ToggleDisabled(id, status) {
            document.getElementById(id).disabled = status;
        }
        function Disable(id) {
            ToggleDisabled(id, true);
        }
        function Enable(id) {
            ToggleDisabled(id, false);
        }
        function BuildErrors(errors) {
            let errorList = document.getElementById("errorList");
            let df = document.createDocumentFragment();
            clearElement(errorList);
            for (let error of errors) {
                let li = document.createElement("li");
                li.textContent = error;
                df.appendChild(li);
            }
            errorList.appendChild(df);
        }
        function getValue(id) {
            return document.getElementById(id).value;
        }
        function BuildAppTypes(appTypes) {
            let appSelect = document.getElementById("ApplicationTypeSelect");
            clearElement(appSelect);
            appSelect.appendChild(createOption("-1", "Select Application Type"));
            for (let appType of appTypes) {
                appSelect.appendChild(createOption(appType.Value, appType.Label));
            }
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildCardTypes(id) {
            let ccTypes = [
                { label: 'American Express', value: 'AMEX' },
                { label: 'Discover', value: 'DISCOVER' },
                { label: 'MasterCard', value: 'MASTERCARD' },
                { label: 'Visa', value: 'VISA' }
            ];
            let selectTypes = document.getElementById(id);
            clearElement(selectTypes);
            ccTypes.map(function (ccType) {
                selectTypes.appendChild(createOption(ccType.value, ccType.label));
            });
        }
        UI.BuildCardTypes = BuildCardTypes;
        function BuildExpMonths(id) {
            let expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            clearElement(expMonth);
            UI.ExpMonths.map(function (month) {
                expMonth.appendChild(createOption(month, month));
            });
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            let expYear = document.getElementById(id);
            clearElement(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                let y = (year + i).toString();
                expYear.appendChild(createOption(y, y));
                UI.ExpYears.push(y);
            }
        }
        UI.BuildExpYears = BuildExpYears;
        function createOption(value, label) {
            let opt = document.createElement("option");
            opt.setAttribute("value", value);
            opt.appendChild(document.createTextNode(label));
            return opt;
        }
        function clearElement(node) {
            while (node.firstChild) {
                node.removeChild(node.firstChild);
            }
        }
        UI.clearElement = clearElement;
        function toggleNav(nav, element) {
            let e = document.getElementById(nav);
            if (e === null)
                return;
            let activeNodes = e.getElementsByClassName("active");
            for (var i = 0; i < activeNodes.length; i++) {
                activeNodes[i].classList.remove("active");
            }
            let eNav = document.getElementById("nav-" + element);
            if (eNav === null)
                return;
            eNav.classList.add("active");
        }
        UI.toggleNav = toggleNav;
        function Show(id) {
            let e = document.getElementById(id);
            e.style.display = "block";
        }
        function Hide(id) {
            let e = document.getElementById(id);
            e.style.display = "none";
        }
        function Search(key) {
            Hide('InvalidSearch');
            Hide('SearchFailed');
            Hide('SearchSuccessful');
            Show('SearchResults');
            Show('Searching');
            let k = key.trim().toUpperCase();
            if (k.length > 0) {
                clayPay.transport.GetCharges(k).then(function (charges) {
                    CurrentCharges = charges;
                    Hide('Searching');
                    ProcessResults(charges, key);
                    return true;
                }, function () {
                    console.log('error getting charges');
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    Hide('Searching');
                    return false;
                });
            }
            else {
                // This message should be "Hey, you need to enter something in order to search!"
                Hide('Searching');
                Show('InvalidSearch');
                return false;
            }
        }
        UI.Search = Search;
        function ProcessResults(charges, key) {
            AddCharges(charges);
            if (charges.length == 0) {
                UpdateSearchFailed(key);
            }
            else {
                Show('SearchSuccessful');
                SetValue('ChargesKey', charges[0].AssocKey);
                SetValue('ChargesDetail', charges[0].Detail);
            }
        }
        function AddCharges(charges) {
            let container = document.getElementById('Charges');
            let df = document.createDocumentFragment();
            clearElement(container);
            for (let charge of charges) {
                df.appendChild(buildChargeRow(charge));
            }
            df.appendChild(buildChargeFooterRow());
            container.appendChild(df);
        }
        function buildChargeFooterRow() {
            let df = document.createDocumentFragment();
            let tr1 = document.createElement("tr");
            tr1.appendChild(createTableElement("", "", 3));
            tr1.appendChild(createTableElementButton("Add All to Cart", 0, "", true, AddAllItemsToCart, RemoveItemFromCart));
            df.appendChild(tr1);
            let tr2 = document.createElement("tr");
            tr2.appendChild(createTableElement("", "", 3));
            tr2.appendChild(createViewCartTableElementButton("View Cart", clayPay.toggleNavDisplay));
            df.appendChild(tr2);
            return df;
        }
        function buildChargeRow(charge) {
            let tr = document.createElement("tr");
            tr.appendChild(createTableElement(charge.Description, "left"));
            tr.appendChild(createTableElement(charge.TimeStampDisplay));
            tr.appendChild(createTableElement(charge.Total.toFixed(2)));
            tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "", true, AddItemToCart, RemoveItemFromCart));
            return tr;
        }
        function AddItemToCart(ev, itemId) {
            let item = CurrentCharges.filter((c) => {
                return c.ItemId == itemId;
            });
            if (item.length === 1 && Cart.indexOf(item[0]) === -1) {
                Cart.push(item[0]);
            }
            ToggleAddRemoveButtons(itemId);
            //let btnAdd: HTMLElement = document.getElementById("btnAdd" + itemId.toString());
            //let btnRem: HTMLElement = document.getElementById("btnRemove" + itemId.toString());
            //btnAdd.style.display = "none";
            //btnRem.style.display = "block";
            updateCart();
        }
        function RemoveItemFromCart(ev, itemId, toggle) {
            let newCart = Cart.filter((c) => {
                return c.ItemId !== itemId;
            });
            Cart = newCart;
            if (toggle)
                ToggleAddRemoveButtons(itemId);
            updateCart();
        }
        function ToggleAddRemoveButtons(itemId) {
            let btnAdd = document.getElementById("btnAdd" + itemId.toString());
            let btnRem = document.getElementById("btnRemove" + itemId.toString());
            let showAdd = btnAdd.style.display === "inline-block";
            btnAdd.style.display = showAdd ? "none" : "inline-block";
            btnRem.style.display = showAdd ? "inline-block" : "none";
        }
        function IsItemInCart(itemId) {
            let item = Cart.filter((c) => {
                return c.ItemId == itemId;
            });
            return item.length !== 0;
        }
        function AddAllItemsToCart() {
            for (let charge of CurrentCharges) {
                if (!IsItemInCart(charge.ItemId)) {
                    Cart.push(charge);
                }
            }
            updateCart();
            // we're going to rerun the "Create Table" so that it'll 
            // update each row
            AddCharges(CurrentCharges);
        }
        function createTableElement(value, className, colspan) {
            let d = document.createElement("td");
            if (className !== undefined) {
                d.className = className;
            }
            if (colspan !== undefined) {
                d.colSpan = colspan;
            }
            d.appendChild(document.createTextNode(value));
            return d;
        }
        function createTableElementButton(value, itemId, className, toggle, addOnClickFunction, removeOnClickFunction) {
            let IsInCart = IsItemInCart(itemId);
            let d = document.createElement("td");
            d.className = className;
            let add = document.createElement("button");
            add.style.display = IsInCart ? "none" : "inline-block";
            add.type = "button";
            add.id = "btnAdd" + itemId.toString();
            add.className = "btn btn-primary";
            add.onclick = (ev) => {
                addOnClickFunction(ev, itemId);
            };
            let remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            let removeButton = document.createElement("a");
            removeButton;
            removeButton.style.color = "darkgoldenrod";
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = (ev) => {
                removeOnClickFunction(ev, itemId, toggle);
            };
            remove.appendChild(removeButton);
            remove.appendChild(document.createTextNode(')'));
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            d.appendChild(remove);
            return d;
        }
        function createAddAllTableElementButton(value, ViewCartClickFunction) {
            let d = document.createElement("td");
            let add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-primary";
            add.onclick = (ev) => {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function createViewCartTableElementButton(value, ViewCartClickFunction) {
            let d = document.createElement("td");
            let add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-success";
            add.onclick = (ev) => {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function SetInputValue(id, value) {
            let e = document.getElementById(id);
            e.value = value;
        }
        function SetValue(id, value) {
            let e = document.getElementById(id);
            clearElement(e);
            e.appendChild(document.createTextNode(value));
        }
        function UpdateSearchFailed(key) {
            let e = document.getElementById('SearchFailed');
            clearElement(e);
            let message = document.createElement("h4");
            message.appendChild(document.createTextNode("No charges were found for search: " + key));
            e.appendChild(message);
            Show('SearchFailed');
        }
        function updateCartNav() {
            // This function is going to take the contents of the Cart array and 
            // update the CartNav element.
            // it's also going to make some changes to the cart Div, 
            // specifically it's going to hide and unhide the CartEmpty Div
            // based on the size of the array.
            let CartNav = document.getElementById('CartNav');
            clearElement(CartNav);
            let cartIcon = document.createElement("span");
            cartIcon.classList.add("glyphicon");
            cartIcon.classList.add("glyphicon-shopping-cart");
            CartNav.appendChild(cartIcon);
            if (Cart.length === 0) {
                Hide('CartNotEmpty');
                Show('CartEmpty');
                CartNav.appendChild(document.createTextNode('Cart: ('));
                let span = document.createElement("span");
                span.style.color = "darkgoldenrod";
                span.appendChild(document.createTextNode('empty'));
                CartNav.appendChild(span);
                CartNav.appendChild(document.createTextNode(')'));
            }
            else {
                Show('CartNotEmpty');
                Hide('CartEmpty');
                CartNav.appendChild(document.createTextNode('Cart: ' + Cart.length.toString() + (Cart.length === 1 ? ' item' : ' items')));
            }
        }
        function updateCart() {
            let CartCharges = document.getElementById('CartCharges');
            let df = document.createDocumentFragment();
            clearElement(CartCharges);
            for (let charge of Cart) {
                df.appendChild(buildCartRow(charge));
            }
            df.appendChild(buildCartFooterRow());
            df.appendChild(buildCartConvFeeFooterRow());
            CartCharges.appendChild(df);
            updateCartNav();
        }
        function buildCartFooterRow() {
            let tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("", "", 2));
            tr.appendChild(createTableElement("Total", "center", 1));
            let TotalAmount = Cart.reduce((total, b) => {
                return total + b.Total;
            }, 0);
            tr.appendChild(createTableElement(TotalAmount.toFixed(2), "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartConvFeeFooterRow() {
            let tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("Please Note: There is a nonrefundable transaction fee charged by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartRow(charge) {
            let tr = document.createElement("tr");
            tr.appendChild(createTableElement(charge.AssocKey));
            tr.appendChild(createTableElement(charge.Description, "left"));
            tr.appendChild(createTableElement(charge.TimeStampDisplay, "center"));
            tr.appendChild(createTableElement(charge.Total.toFixed(2), "center"));
            tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "center", true, AddItemToCart, RemoveItemFromCart));
            return tr;
        }
    })(UI = clayPay.UI || (clayPay.UI = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ui.js.map
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
var clayPay;
(function (clayPay) {
    class Charge {
        constructor() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
        }
    }
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map