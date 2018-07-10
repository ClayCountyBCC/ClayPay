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
        UI.AllStates = [
            { state: "Select", abv: "" },
            { state: "ALABAMA", abv: "AL" },
            { state: "ALASKA", abv: "AK" },
            { state: "ARIZONA", abv: "AZ" },
            { state: "ARKANSAS", abv: "AR" },
            { state: "CALIFORNIA", abv: "CA" },
            { state: "COLORADO", abv: "CO" },
            { state: "CONNECTICUT", abv: "CT" },
            { state: "DELAWARE", abv: "DE" },
            { state: "FLORIDA", abv: "FL" },
            { state: "GEORGIA", abv: "GA" },
            { state: "HAWAII", abv: "HI" },
            { state: "IDAHO", abv: "ID" },
            { state: "ILLINOIS", abv: "IL" },
            { state: "INDIANA", abv: "IN" },
            { state: "IOWA", abv: "IA" },
            { state: "KANSAS", abv: "KS" },
            { state: "KENTUCKY", abv: "KY" },
            { state: "LOUISIANA", abv: "LA" },
            { state: "MAINE", abv: "ME" },
            { state: "MARYLAND", abv: "MD" },
            { state: "MASSACHUSETTS", abv: "MA" },
            { state: "MICHIGAN", abv: "MI" },
            { state: "MINNESOTA", abv: "MN" },
            { state: "MISSISSIPPI", abv: "MS" },
            { state: "MISSOURI", abv: "MO" },
            { state: "MONTANA", abv: "MT" },
            { state: "NEBRASKA", abv: "NE" },
            { state: "NEVADA", abv: "NV" },
            { state: "NEW HAMPSHIRE", abv: "NH" },
            { state: "NEW JERSEY", abv: "NJ" },
            { state: "NEW MEXICO", abv: "NM" },
            { state: "NEW YORK", abv: "NY" },
            { state: "NORTH CAROLINA", abv: "NC" },
            { state: "NORTH DAKOTA", abv: "ND" },
            { state: "OHIO", abv: "OH" },
            { state: "OKLAHOMA", abv: "OK" },
            { state: "OREGON", abv: "OR" },
            { state: "PENNSYLVANIA", abv: "PA" },
            { state: "RHODE ISLAND", abv: "RI" },
            { state: "SOUTH CAROLINA", abv: "SC" },
            { state: "SOUTH DAKOTA", abv: "SD" },
            { state: "TENNESSEE", abv: "TN" },
            { state: "TEXAS", abv: "TX" },
            { state: "UTAH", abv: "UT" },
            { state: "VERMONT", abv: "VT" },
            { state: "VIRGINIA", abv: "VA" },
            { state: "WASHINGTON", abv: "WA" },
            { state: "WEST VIRGINIA", abv: "WV" },
            { state: "WISCONSIN", abv: "WI" },
            { state: "WYOMING", abv: "WY" }
        ];
        UI.ExpYears = [];
        let Menus = [
            {
                id: "nav-Home",
                title: "Welcome!",
                subTitle: "You can use this application to easily find and pay Clay County fees.",
                icon: "fas fa-home",
                label: "Home",
                selected: true
            },
            {
                id: "nav-permitFees",
                title: "Search by Permit Number",
                subTitle: "Searching by Permit number will show you all of the unpaid fees for a given permit number.",
                icon: "fas fa-file",
                label: "Permit Fees",
                selected: false
            },
            {
                id: "nav-contractorFees",
                title: "Search by Contractor ID number",
                subTitle: "Searching by Contractor ID will list any unpaid fees for a given contractor.",
                icon: "fas fa-user",
                label: "Contractor Fees",
                selected: false
            },
            {
                id: "nav-applicationFees",
                title: "Search by Application Type and Application Number",
                subTitle: "Pick an application type and then enter an application number to see any unpaid fees associated with that application.",
                icon: "fas fa-clipboard",
                label: "Application Fees",
                selected: false
            },
            {
                id: "nav-cart",
                title: "Your Shopping Cart",
                subTitle: "Shows the charges you have added to your shopping cart. You can pay for them here.",
                icon: "fas fa-shopping-cart",
                label: "Cart",
                selected: false
            }
        ];
        //export function Submit():boolean
        //{
        //  Disable('btnSubmit');
        //  Utilities.Hide('errorList');
        //  Utilities.Hide('PaymentPosting');
        //  let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
        //  if (!f.checkValidity()) return false;
        //  let itemIds: Array<number> = Cart.map(function (i)
        //  {
        //    return i.ItemId;
        //  });
        //  let total: number = Cart.reduce((total: number, b: Charge) =>
        //  {
        //    return total + b.Total;
        //  }, 0);
        //  total = parseFloat(total.toFixed(2));
        //  let cc = new clayPay.CCPayment();
        //  let errors: Array<string> = cc.Validate(); // clientside validation
        //  if (errors.length === 0)
        //  {
        //    Utilities.Hide('CCForm'); // Hide the form
        //    Utilities.Show('PaymentPosting'); // show swirly
        //    //let save = cc.Save();
        //    //save.then(function (response)
        //    //{
        //    //  let pr = JSON.parse(response);
        //    //  resetApp();
        //    //  PopulateReceipt(pr);
        //    //},
        //    //  function (reject)
        //    //  {
        //    //    Utilities.Show('errorList');
        //    //    errors = [reject];
        //    //    BuildErrors(errors);          
        //    //    Utilities.Show('CCForm');
        //    //    Utilities.Hide('PaymentPosting');
        //    //    Enable('btnSubmit');
        //    //  });
        //  } else
        //  {
        //    // show errors section
        //    Utilities.Show('errorList');
        //    BuildErrors(errors);
        //    Enable('btnSubmit');
        //  }    
        //  return false;
        //}
        function resetApp() {
            CurrentCharges = [];
            Cart = [];
            updateCart();
            updateCartNav();
            // reset paymentForm
            let f = document.getElementById('paymentForm');
            f.reset();
            Enable('btnSubmit');
            Utilities.Show('CCForm');
            Utilities.Hide('PaymentPosting');
        }
        function PopulateReceipt(pr) {
            //clayPay.toggleNavDisplay('receipt');
            Utilities.Set_Value("receiptUniqueId", pr.CashierId);
            Utilities.Set_Value("receiptTimestamp", pr.TimeStamp_Display);
            Utilities.Set_Value("receiptAmount", pr.Amount.toFixed(2));
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
            Utilities.Clear_Element(errorList);
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
        function BuildPayerStates(States, id) {
            let stateSelect = document.getElementById(id);
            if (stateSelect === undefined)
                return;
            Utilities.Clear_Element(stateSelect);
            States.forEach(function (j) {
                stateSelect.appendChild(Utilities.Create_Option(j.abv, j.state));
            });
            stateSelect.selectedIndex = 0;
        }
        UI.BuildPayerStates = BuildPayerStates;
        function BuildAppTypes(appTypes) {
            let appSelect = document.getElementById("applicationSearchType");
            Utilities.Clear_Element(appSelect);
            appSelect.appendChild(Utilities.Create_Option("-1", "Select Application Type", true));
            appTypes.forEach(function (a) {
                appSelect.appendChild(Utilities.Create_Option(a.Value, a.Label));
            });
            appSelect.selectedIndex = 0;
        }
        UI.BuildAppTypes = BuildAppTypes;
        function BuildExpMonths(id) {
            let expMonth = document.getElementById(id);
            if (expMonth === undefined)
                return;
            Utilities.Clear_Element(expMonth);
            for (let month of UI.ExpMonths) {
                expMonth.appendChild(Utilities.Create_Option(month, month));
            }
            expMonth.selectedIndex = 0;
        }
        UI.BuildExpMonths = BuildExpMonths;
        function BuildExpYears(id) {
            let expYear = document.getElementById(id);
            Utilities.Clear_Element(expYear);
            var year = new Date().getFullYear();
            for (var i = 0; i < 10; i++) {
                let y = (year + i).toString();
                expYear.appendChild(Utilities.Create_Option(y, y));
                UI.ExpYears.push(y); // save the year we're adding for later when we do some basic validation
            }
        }
        UI.BuildExpYears = BuildExpYears;
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
        function toggleSearch(e, disabled) {
            e.disabled = disabled;
            e.classList.toggle("is-loading", disabled);
        }
        function Search(buttonId, inputId, errorId) {
            let button = document.getElementById(buttonId);
            toggleSearch(button, true);
            let input = document.getElementById(inputId);
            let k = input.value.trim().toUpperCase();
            if (inputId.indexOf("application") > -1) {
                // we'll need to validate the application data
                // the user needs to select a valid application type 
                // and enter a valid application number.
                let appType = document.getElementById(inputId + "Type").value;
                if (appType === "-1" || appType.length === 0) {
                    Utilities.Error_Show(errorId, "You must select an Application Type in order to search by Application Number.");
                    toggleSearch(button, false);
                    return false;
                }
                k = appType.toUpperCase() + "-" + input.value.trim().toUpperCase();
            }
            if (k.length > 0) {
                Utilities.Get("../API/Payments/Query/?key=" + k).then(function (charges) {
                    CurrentCharges = charges;
                    if (charges.length > 0) {
                        ProcessResults(charges, k);
                        Utilities.Show("searchResults");
                    }
                    else {
                        Utilities.Error_Show(errorId, "No charges were found for search: " + k);
                    }
                    toggleSearch(button, false);
                    return true;
                }, function (errorText) {
                    Utilities.Error_Show(errorId, errorText);
                    console.log('error getting charges');
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    toggleSearch(button, false);
                    return false;
                });
            }
            else {
                Utilities.Error_Show("Invalid search. Please check your entry and try again.");
                input.focus();
                toggleSearch(this, false);
                return false;
            }
        }
        UI.Search = Search;
        function ProcessResults(charges, key) {
            AddCharges(charges);
            Utilities.Set_Text('ChargesKey', charges[0].AssocKey);
            Utilities.Set_Text('ChargesDetail', charges[0].Detail);
        }
        function AddCharges(charges) {
            let container = document.getElementById('Charges');
            let df = document.createDocumentFragment();
            Utilities.Clear_Element(container);
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
            let menulist = Menus.filter(function (j) { return j.id === "nav-cart"; });
            let cartMenu = menulist[0];
            tr2.appendChild(createViewCartTableElementButton("View Cart", function () {
                let title = document.getElementById("menuTitle");
                let subTitle = document.getElementById("menuSubTitle");
                Utilities.Clear_Element(title);
                Utilities.Clear_Element(subTitle);
                title.appendChild(document.createTextNode(cartMenu.title));
                subTitle.appendChild(document.createTextNode(cartMenu.subTitle));
                Utilities.Show_Menu(cartMenu.id);
            }));
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
            add.className = "button is-primary";
            add.onclick = (ev) => {
                addOnClickFunction(ev, itemId);
            };
            let remove = document.createElement("div");
            remove.id = "btnRemove" + itemId.toString();
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            let removeButton = document.createElement("a");
            //removeButton
            removeButton.classList.add("is-warning");
            //removeButton.style.color = "darkgoldenrod";
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
            add.className = "button is-primary";
            add.onclick = (ev) => {
                ViewCartClickFunction();
            };
            add.appendChild(document.createTextNode(value));
            d.appendChild(add);
            return d;
        }
        function updateCartNav() {
            // This function is going to take the contents of the Cart array and 
            // update the CartNav element.
            // it's also going to make some changes to the cart Div, 
            // specifically it's going to hide and unhide the CartEmpty Div
            // based on the size of the array.
            let CartNav = document.getElementById('nav-cart-total');
            // emptyCart / fullCart is used when displaying the Cart
            // if there are no charges, we show emptyCart.
            // if there are charges, we show fullCart.
            let emptyCart = document.getElementById("emptyCart");
            let fullCart = document.getElementById("fullCart");
            let payerData = document.getElementById("payerData");
            let paymentData = document.getElementById("paymentData");
            Utilities.Hide(emptyCart);
            Utilities.Hide(fullCart);
            Utilities.Hide(payerData);
            Utilities.Hide(paymentData);
            Utilities.Clear_Element(CartNav);
            if (Cart.length === 0) {
                CartNav.appendChild(document.createTextNode("(empty)"));
                Utilities.Show(emptyCart);
            }
            else {
                CartNav.appendChild(document.createTextNode(+Cart.length.toString() + (Cart.length === 1 ? ' item' : ' items')));
                Utilities.Show(fullCart);
                Utilities.Show(payerData);
                //Utilities.Show(paymentData);
            }
        }
        function updateCart() {
            let CartCharges = document.getElementById('CartCharges');
            let df = document.createDocumentFragment();
            Utilities.Clear_Element(CartCharges);
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
            clayPay.CurrentTransaction.TotalAmountDue = TotalAmount;
            clayPay.CurrentTransaction.Validate();
            //Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(TotalAmount));
            //let cartTotalPayment = document.getElementById("cartTotalAmountDue");
            //Utilities.Clear_Element(cartTotalPayment);
            //cartTotalPayment.appendChild(document.createTextNode(TotalAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })));
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
        function buildMenuElements() {
            let menu = document.getElementById("menuTabs");
            for (let menuItem of Menus) {
                menu.appendChild(createMenuElement(menuItem));
            }
            createNavCart();
        }
        UI.buildMenuElements = buildMenuElements;
        function createNavCart() {
            let cart = document.getElementById("nav-cart");
            let cartTotal = document.createElement("span");
            cartTotal.id = "nav-cart-total";
            cartTotal.style.fontSize = "larger";
            cartTotal.style.fontWeight = "bolder";
            cartTotal.style.paddingLeft = "1em";
            cartTotal.appendChild(document.createTextNode("(empty)"));
            cart.appendChild(cartTotal);
        }
        function createMenuElement(menuItem) {
            let li = document.createElement("li");
            if (menuItem.selected)
                li.classList.add("is-active");
            let a = document.createElement("a");
            a.id = menuItem.id;
            a.href = "#";
            a.onclick = function () {
                let title = document.getElementById("menuTitle");
                let subTitle = document.getElementById("menuSubTitle");
                Utilities.Clear_Element(title);
                Utilities.Clear_Element(subTitle);
                title.appendChild(document.createTextNode(menuItem.title));
                subTitle.appendChild(document.createTextNode(menuItem.subTitle));
                Utilities.Show_Menu(menuItem.id);
            };
            if (menuItem.icon.length > 0) {
                let span = document.createElement("span");
                span.classList.add("icon");
                span.classList.add("is-medium");
                let i = document.createElement("i");
                let icons = menuItem.icon.split(" ");
                for (let icon of icons) {
                    i.classList.add(icon);
                }
                span.appendChild(i);
                a.appendChild(span);
            }
            a.appendChild(document.createTextNode(menuItem.label));
            li.appendChild(a);
            return li;
        }
        function ShowPaymentMethod(id) {
        }
        UI.ShowPaymentMethod = ShowPaymentMethod;
    })(UI = clayPay.UI || (clayPay.UI = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=UI.js.map