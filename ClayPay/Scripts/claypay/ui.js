var clayPay;
(function (clayPay) {
    var UI;
    (function (UI) {
        "use strict";
        var Cart = [];
        var CurrentCharges = [];
        UI.ExpMonths = ['01', '02', '03', '04', '05',
            '06', '07', '08', '09', '10', '11', '12'];
        UI.ExpYears = [];
        function Submit() {
            Disable('btnSubmit');
            Hide('errorList');
            Hide('PaymentPosting');
            var f = document.getElementById('paymentForm');
            if (!f.checkValidity())
                return false;
            var itemIds = Cart.map(function (i) {
                return i.ItemId;
            });
            var total = Cart.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            total = parseFloat(total.toFixed(2));
            var cc = new clayPay.CCData(getValue('ccFirstName'), getValue('ccLastName'), getValue('cardNumber'), getValue('ccTypes'), getValue('ccExpMonth'), getValue('ccExpYear'), getValue('ccCVV'), getValue('ccZip'), getValue('emailAddress'), total, itemIds);
            var errors = cc.Validate();
            if (errors.length === 0) {
                Hide('CCForm');
                Show('PaymentPosting');
                var save = cc.Save();
                save.then(function (response) {
                    var pr = JSON.parse(response);
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
            var f = document.getElementById('paymentForm');
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
            var errorList = document.getElementById("errorList");
            var df = document.createDocumentFragment();
            clearElement(errorList);
            for (var _i = 0, errors_1 = errors; _i < errors_1.length; _i++) {
                var error = errors_1[_i];
                var li = document.createElement("li");
                li.textContent = error;
                df.appendChild(li);
            }
            errorList.appendChild(df);
        }
        function getValue(id) {
            return document.getElementById(id).value;
        }
        function BuildAppTypes(appTypes) {
            var appSelect = document.getElementById("ApplicationTypeSelect");
            clearElement(appSelect);
            appSelect.appendChild(createOption("-1", "Select Application Type"));
            for (var _i = 0, appTypes_1 = appTypes; _i < appTypes_1.length; _i++) {
                var appType = appTypes_1[_i];
                appSelect.appendChild(createOption(appType.Value, appType.Label));
            }
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildCardTypes(id) {
            var ccTypes = [
                { label: 'American Express', value: 'AMEX' },
                { label: 'Discover', value: 'DISCOVER' },
                { label: 'MasterCard', value: 'MASTERCARD' },
                { label: 'Visa', value: 'VISA' }
            ];
            var selectTypes = document.getElementById(id);
            clearElement(selectTypes);
            ccTypes.map(function (ccType) {
                selectTypes.appendChild(createOption(ccType.value, ccType.label));
            });
        }
        UI.BuildCardTypes = BuildCardTypes;
        function BuildExpMonths(id) {
            var expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            clearElement(expMonth);
            UI.ExpMonths.map(function (month) {
                expMonth.appendChild(createOption(month, month));
            });
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            var expYear = document.getElementById(id);
            clearElement(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                var y = (year + i).toString();
                expYear.appendChild(createOption(y, y));
                UI.ExpYears.push(y);
            }
        }
        UI.BuildExpYears = BuildExpYears;
        function createOption(value, label) {
            var opt = document.createElement("option");
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
            var e = document.getElementById(nav);
            if (e === null)
                return;
            var activeNodes = e.getElementsByClassName("active");
            for (var i = 0; i < activeNodes.length; i++) {
                activeNodes[i].classList.remove("active");
            }
            var eNav = document.getElementById("nav-" + element);
            if (eNav === null)
                return;
            eNav.classList.add("active");
        }
        UI.toggleNav = toggleNav;
        function Show(id) {
            var e = document.getElementById(id);
            e.style.display = "block";
        }
        function Hide(id) {
            var e = document.getElementById(id);
            e.style.display = "none";
        }
        function Search(key) {
            Hide('InvalidSearch');
            Hide('SearchFailed');
            Hide('SearchSuccessful');
            Show('SearchResults');
            Show('Searching');
            var k = key.trim().toUpperCase();
            if (k.length > 0) {
                clayPay.transport.GetCharges(k).then(function (charges) {
                    CurrentCharges = charges;
                    Hide('Searching');
                    ProcessResults(charges, key);
                    return true;
                }, function () {
                    console.log('error getting charges');
                    Hide('Searching');
                    return false;
                });
            }
            else {
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
            var container = document.getElementById('Charges');
            var df = document.createDocumentFragment();
            clearElement(container);
            for (var _i = 0, charges_1 = charges; _i < charges_1.length; _i++) {
                var charge = charges_1[_i];
                df.appendChild(buildChargeRow(charge));
            }
            df.appendChild(buildChargeFooterRow());
            container.appendChild(df);
        }
        function buildChargeFooterRow() {
            var df = document.createDocumentFragment();
            var tr1 = document.createElement("tr");
            tr1.appendChild(createTableElement("", "", 3));
            tr1.appendChild(createTableElementButton("Add All to Cart", 0, "", true, AddAllItemsToCart, RemoveItemFromCart));
            df.appendChild(tr1);
            var tr2 = document.createElement("tr");
            tr2.appendChild(createTableElement("", "", 3));
            tr2.appendChild(createViewCartTableElementButton("View Cart", clayPay.toggleNavDisplay));
            df.appendChild(tr2);
            return df;
        }
        function buildChargeRow(charge) {
            var tr = document.createElement("tr");
            tr.appendChild(createTableElement(charge.Description, "left"));
            tr.appendChild(createTableElement(charge.TimeStampDisplay));
            tr.appendChild(createTableElement(charge.Total.toFixed(2)));
            tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "", true, AddItemToCart, RemoveItemFromCart));
            return tr;
        }
        function AddItemToCart(ev, itemId) {
            var item = CurrentCharges.filter(function (c) {
                return c.ItemId == itemId;
            });
            if (item.length === 1 && Cart.indexOf(item[0]) === -1) {
                Cart.push(item[0]);
            }
            ToggleAddRemoveButtons(itemId);
            updateCart();
        }
        function RemoveItemFromCart(ev, itemId, toggle) {
            var newCart = Cart.filter(function (c) {
                return c.ItemId !== itemId;
            });
            Cart = newCart;
            if (toggle)
                ToggleAddRemoveButtons(itemId);
            updateCart();
        }
        function ToggleAddRemoveButtons(itemId) {
            var btnAdd = document.getElementById("btnAdd" + itemId.toString());
            var btnRem = document.getElementById("btnRemove" + itemId.toString());
            var showAdd = btnAdd.style.display === "inline-block";
            btnAdd.style.display = showAdd ? "none" : "inline-block";
            btnRem.style.display = showAdd ? "inline-block" : "none";
        }
        function IsItemInCart(itemId) {
            var item = Cart.filter(function (c) {
                return c.ItemId == itemId;
            });
            return item.length !== 0;
        }
        function AddAllItemsToCart() {
            for (var _i = 0, CurrentCharges_1 = CurrentCharges; _i < CurrentCharges_1.length; _i++) {
                var charge = CurrentCharges_1[_i];
                if (!IsItemInCart(charge.ItemId)) {
                    Cart.push(charge);
                }
            }
            updateCart();
            AddCharges(CurrentCharges);
        }
        function createTableElement(value, className, colspan) {
            var d = document.createElement("td");
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
            var IsInCart = IsItemInCart(itemId);
            var d = document.createElement("td");
            d.className = className;
            var add = document.createElement("button");
            add.style.display = IsInCart ? "none" : "inline-block";
            add.type = "button";
            add.id = "btnAdd" + itemId.toString();
            add.className = "btn btn-primary";
            add.onclick = function (ev) {
                addOnClickFunction(ev, itemId);
            };
            var remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            var removeButton = document.createElement("a");
            removeButton;
            removeButton.style.color = "darkgoldenrod";
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = function (ev) {
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
            var d = document.createElement("td");
            var add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-primary";
            add.onclick = function (ev) {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function createViewCartTableElementButton(value, ViewCartClickFunction) {
            var d = document.createElement("td");
            var add = document.createElement("button");
            add.type = "button";
            add.className = "btn btn-success";
            add.onclick = function (ev) {
                ViewCartClickFunction('cart');
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function SetInputValue(id, value) {
            var e = document.getElementById(id);
            e.value = value;
        }
        function SetValue(id, value) {
            var e = document.getElementById(id);
            clearElement(e);
            e.appendChild(document.createTextNode(value));
        }
        function UpdateSearchFailed(key) {
            var e = document.getElementById('SearchFailed');
            clearElement(e);
            var message = document.createElement("h4");
            message.appendChild(document.createTextNode("No charges were found for search: " + key));
            e.appendChild(message);
            Show('SearchFailed');
        }
        function updateCartNav() {
            var CartNav = document.getElementById('CartNav');
            clearElement(CartNav);
            var cartIcon = document.createElement("span");
            cartIcon.classList.add("glyphicon");
            cartIcon.classList.add("glyphicon-shopping-cart");
            CartNav.appendChild(cartIcon);
            if (Cart.length === 0) {
                Hide('CartNotEmpty');
                Show('CartEmpty');
                CartNav.appendChild(document.createTextNode('Cart: ('));
                var span = document.createElement("span");
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
            var CartCharges = document.getElementById('CartCharges');
            var df = document.createDocumentFragment();
            clearElement(CartCharges);
            for (var _i = 0, Cart_1 = Cart; _i < Cart_1.length; _i++) {
                var charge = Cart_1[_i];
                df.appendChild(buildCartRow(charge));
            }
            df.appendChild(buildCartFooterRow());
            df.appendChild(buildCartConvFeeFooterRow());
            CartCharges.appendChild(df);
            updateCartNav();
        }
        function buildCartFooterRow() {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("", "", 2));
            tr.appendChild(createTableElement("Total", "center", 1));
            var TotalAmount = Cart.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            tr.appendChild(createTableElement(TotalAmount.toFixed(2), "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartConvFeeFooterRow() {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(createTableElement("Please Note: There is a nonrefundable transaction fee charged by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(createTableElement("", "", 1));
            return tr;
        }
        function buildCartRow(charge) {
            var tr = document.createElement("tr");
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