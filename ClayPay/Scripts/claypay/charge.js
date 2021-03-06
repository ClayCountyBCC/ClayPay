var clayPay;
(function (clayPay) {
    var ChargeView;
    (function (ChargeView) {
        ChargeView[ChargeView["search_results"] = 0] = "search_results";
        ChargeView[ChargeView["cart"] = 1] = "cart";
        ChargeView[ChargeView["receipt"] = 2] = "receipt";
    })(ChargeView = clayPay.ChargeView || (clayPay.ChargeView = {}));
    var Charge = /** @class */ (function () {
        function Charge() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
            this.ImpactFeeCreditAvailable = false;
        }
        Charge.CreateTable = function (view) {
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            var thead = document.createElement("THEAD");
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Key", "20%"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(clayPay.UI.createTableHeaderElement("Description", "40%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Date", "15%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Amount", "15%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("", "10%"));
            }
            else {
                tr.appendChild(clayPay.UI.createTableHeaderElement("Description", "50%"));
                tr.appendChild(clayPay.UI.createTableHeaderElement("Amount", "30%"));
            }
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        };
        Charge.CreateChargesTable = function (charges, view) {
            var df = document.createDocumentFragment();
            var table = Charge.CreateTable(view);
            var tbody = document.createElement("TBODY");
            charges.forEach(function (charge) {
                tbody.appendChild(Charge.buildChargeRow(charge, view));
            });
            var tfoot = document.createElement("TFOOT");
            tfoot.appendChild(Charge.buildChargeFooterRow(charges, view));
            table.appendChild(tbody);
            table.appendChild(tfoot);
            df.appendChild(table);
            return df;
        };
        Charge.buildChargeFooterRow = function (charges, view) {
            // Based on ChargeView:
            // Search Results Footer should show: 
            //  1. Total Charges
            //  2. Add All Charges To Cart
            //  3. View Cart
            // Cart Footer should show:
            //  1. Total Charges
            //  2. Convenience Fee
            // Receipt Footer should show:
            //  1. Total Charges
            var df = document.createDocumentFragment();
            var trTotal = document.createElement("tr");
            trTotal.appendChild(clayPay.UI.createTableElement("", "", view === ChargeView.receipt ? 1 : 2));
            trTotal.appendChild(clayPay.UI.createTableElement("Total", "has-text-weight-bold has-text-right", 1));
            var TotalAmount = charges.reduce(function (total, b) {
                return total + b.Total;
            }, 0);
            trTotal.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(TotalAmount), ""));
            if (view === ChargeView.search_results) {
                trTotal.appendChild(Charge.createAddAllChargesToCartButton());
            }
            else {
                if (view !== ChargeView.receipt) {
                    trTotal.appendChild(clayPay.UI.createTableElement("", "", 1));
                }
            }
            df.appendChild(trTotal);
            switch (view) {
                case ChargeView.search_results:
                    // Add View Cart button
                    df.appendChild(Charge.createViewCartFooterRow());
                    break;
                case ChargeView.cart:
                    // Show Convenience Fee
                    clayPay.CurrentTransaction.TotalAmountDue = parseFloat(TotalAmount.toFixed(2));
                    clayPay.CurrentTransaction.UpdateTotals();
                    df.appendChild(Charge.buildConvFeeFooterRow());
                    break;
            }
            return df;
        };
        Charge.buildConvFeeFooterRow = function () {
            var tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(clayPay.UI.createTableElement("There is a nonrefundable transaction fee charged for Credit Card Payments by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(clayPay.UI.createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(clayPay.UI.createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(clayPay.UI.createTableElement("", "", 1));
            return tr;
        };
        Charge.buildChargeRow = function (charge, view) {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(charge.AssocKey));
            tr.appendChild(clayPay.UI.createTableElement(charge.Description, "left"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(clayPay.UI.createTableElement(charge.TimeStampDisplay, "center"));
            }
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(charge.Total), "center"));
            if (view !== ChargeView.receipt) {
                tr.appendChild(Charge.createChargeCartButtonToggle("Add to Cart", charge.ItemId, "center", true));
            }
            return tr;
        };
        Charge.createAddAllChargesToCartButton = function () {
            var td = document.createElement("td");
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-primary");
            button.appendChild(document.createTextNode("Add All To Cart"));
            button.onclick = function (ev) {
                for (var _i = 0, _a = clayPay.CurrentTransaction.CurrentCharges; _i < _a.length; _i++) {
                    var charge = _a[_i];
                    if (!clayPay.UI.IsItemInCart(charge.ItemId)) {
                        clayPay.CurrentTransaction.Cart.push(charge);
                    }
                }
                clayPay.UI.updateCart();
                // we're going to rerun the "Create Table" so that it'll 
                // update each row
                clayPay.UI.ProcessSearchResults(clayPay.CurrentTransaction.CurrentCharges);
                //AddCharges(clayPay.CurrentTransaction.CurrentCharges);
            };
            td.appendChild(button);
            return td;
        };
        Charge.createChargeCartButtonToggle = function (value, itemId, className, toggle) {
            var removeButton = document.createElement("a");
            var remove = document.createElement("div");
            var addButton = document.createElement("button");
            var IsInCart = clayPay.UI.IsItemInCart(itemId);
            var d = document.createElement("td");
            d.className = className;
            addButton.style.display = IsInCart ? "none" : "inline-block";
            addButton.type = "button";
            addButton.className = "button is-primary";
            addButton.onclick = function (ev) {
                var item = clayPay.CurrentTransaction.CurrentCharges.filter(function (c) {
                    return c.ItemId == itemId;
                });
                if (item.length === 1 && clayPay.CurrentTransaction.Cart.indexOf(item[0]) === -1) {
                    clayPay.CurrentTransaction.Cart.push(item[0]);
                }
                remove.style.display = "inline-block";
                addButton.style.display = "none";
                clayPay.UI.updateCart();
            };
            remove.style.display = IsInCart ? "inline-block" : "none";
            remove.appendChild(document.createTextNode('Added ('));
            removeButton.classList.add("is-warning");
            removeButton.style.cursor = "pointer";
            removeButton.appendChild(document.createTextNode('remove'));
            removeButton.onclick = function (ev) {
                var newCart = clayPay.CurrentTransaction.Cart.filter(function (c) {
                    return c.ItemId !== itemId;
                });
                clayPay.CurrentTransaction.Cart = newCart;
                clayPay.UI.updateCart();
                remove.style.display = "none";
                addButton.style.display = "inline-block";
            };
            remove.appendChild(removeButton);
            remove.appendChild(document.createTextNode(')'));
            addButton.appendChild(document.createTextNode(value));
            d.appendChild(addButton);
            d.appendChild(remove);
            return d;
        };
        Charge.createViewCartFooterRow = function () {
            var tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement("", "", 4));
            var td = document.createElement("td");
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.onclick = function (ev) {
                var menulist = clayPay.UI.Menus.filter(function (j) { return j.id === "nav-cart"; });
                var cartMenu = menulist[0];
                var title = document.getElementById("menuTitle");
                var subTitle = document.getElementById("menuSubTitle");
                Utilities.Clear_Element(title);
                Utilities.Clear_Element(subTitle);
                title.appendChild(document.createTextNode(cartMenu.title));
                subTitle.appendChild(document.createTextNode(cartMenu.subTitle));
                Utilities.Show_Menu(cartMenu.id);
            };
            button.appendChild(document.createTextNode("View Cart"));
            td.appendChild(button);
            tr.appendChild(td);
            return tr;
        };
        return Charge;
    }());
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map