var clayPay;
(function (clayPay) {
    let ChargeView;
    (function (ChargeView) {
        ChargeView[ChargeView["search_results"] = 0] = "search_results";
        ChargeView[ChargeView["cart"] = 1] = "cart";
        ChargeView[ChargeView["receipt"] = 2] = "receipt";
    })(ChargeView = clayPay.ChargeView || (clayPay.ChargeView = {}));
    class Charge {
        constructor() {
            this.ItemId = 0;
            this.Description = "";
            this.TimeStampDisplay = "";
        }
        static CreateTable(view) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("tr");
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
        }
        static CreateChargesTable(charges, view) {
            let df = document.createDocumentFragment();
            let table = Charge.CreateTable(view);
            let tbody = document.createElement("TBODY");
            charges.forEach(function (charge) {
                tbody.appendChild(Charge.buildChargeRow(charge, view));
            });
            let tfoot = document.createElement("TFOOT");
            tfoot.appendChild(Charge.buildChargeFooterRow(charges, view));
            table.appendChild(tbody);
            table.appendChild(tfoot);
            df.appendChild(table);
            return df;
        }
        static buildChargeFooterRow(charges, view) {
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
            let df = document.createDocumentFragment();
            let trTotal = document.createElement("tr");
            trTotal.appendChild(clayPay.UI.createTableElement("", "", view === ChargeView.receipt ? 1 : 2));
            trTotal.appendChild(clayPay.UI.createTableElement("Total", "has-text-weight-bold has-text-right", 1));
            let TotalAmount = charges.reduce((total, b) => {
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
                    clayPay.CurrentTransaction.TotalAmountDue = TotalAmount;
                    clayPay.CurrentTransaction.UpdateTotals();
                    df.appendChild(Charge.buildConvFeeFooterRow());
                    break;
            }
            return df;
        }
        static buildConvFeeFooterRow() {
            let tr = document.createElement("tr");
            tr.style.fontWeight = "bolder";
            tr.appendChild(clayPay.UI.createTableElement("There is a nonrefundable transaction fee charged for Credit Card Payments by our payment provider. This is charged in addition to the total above.", "", 2));
            tr.appendChild(clayPay.UI.createTableElement("Conv. Fee", "center", 1));
            tr.appendChild(clayPay.UI.createTableElement(clayPay.ConvenienceFee, "", 1));
            tr.appendChild(clayPay.UI.createTableElement("", "", 1));
            return tr;
        }
        static buildChargeRow(charge, view) {
            let tr = document.createElement("tr");
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
        }
        static createAddAllChargesToCartButton() {
            let td = document.createElement("td");
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-primary");
            button.appendChild(document.createTextNode("Add All To Cart"));
            button.onclick = (ev) => {
                for (let charge of clayPay.CurrentTransaction.CurrentCharges) {
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
        }
        static createChargeCartButtonToggle(value, itemId, className, toggle) {
            let removeButton = document.createElement("a");
            let remove = document.createElement("div");
            let addButton = document.createElement("button");
            let IsInCart = clayPay.UI.IsItemInCart(itemId);
            let d = document.createElement("td");
            d.className = className;
            addButton.style.display = IsInCart ? "none" : "inline-block";
            addButton.type = "button";
            addButton.className = "button is-primary";
            addButton.onclick = (ev) => {
                let item = clayPay.CurrentTransaction.CurrentCharges.filter((c) => {
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
            removeButton.onclick = (ev) => {
                let newCart = clayPay.CurrentTransaction.Cart.filter((c) => {
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
        }
        static createViewCartFooterRow() {
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement("", "", 4));
            let td = document.createElement("td");
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.onclick = (ev) => {
                let menulist = clayPay.UI.Menus.filter(function (j) { return j.id === "nav-cart"; });
                let cartMenu = menulist[0];
                let title = document.getElementById("menuTitle");
                let subTitle = document.getElementById("menuSubTitle");
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
        }
    }
    clayPay.Charge = Charge;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=Charge.js.map