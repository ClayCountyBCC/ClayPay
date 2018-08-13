var clayPay;
(function (clayPay) {
    class ReceiptPayment {
        constructor() {
            this.CashierId = "";
            this.PayId = -1;
            this.OTId = -1;
            this.Info = "";
            this.TransactionDate = new Date();
            this.PaymentType = "";
            this.PaymentTypeDescription = "";
            this.AmountApplied = -1;
            this.AmountTendered = -1;
            this.ChangeDue = -1;
            this.ConvenienceFeeAmount = -1;
            this.CheckNumber = "";
            this.TransactionId = "";
        }
        static CreateReceiptPaymentView(receipts, IsEditable) {
            let df = document.createDocumentFragment();
            let table = ReceiptPayment.CreateTable();
            let tbody = document.createElement("TBODY");
            for (let receipt of receipts) {
                let transaction = receipt.CheckNumber.length > 0 ? receipt.CheckNumber : receipt.TransactionId;
                if (IsEditable) {
                    switch (receipt.PaymentTypeDescription.toLowerCase()) {
                        case "cash":
                            tbody.appendChild(ReceiptPayment.BuildCashPaymentRow(receipt));
                            break;
                        case "check":
                            tbody.appendChild(ReceiptPayment.BuildCheckPaymentRow(receipt));
                            break;
                        default:
                            tbody.appendChild(ReceiptPayment.BuildPaymentRow(receipt.PaymentTypeDescription, receipt.Info, transaction, receipt.AmountTendered, receipt.AmountApplied));
                    }
                }
                else {
                    tbody.appendChild(ReceiptPayment.BuildPaymentRow(receipt.PaymentTypeDescription, receipt.Info, transaction, receipt.AmountTendered, receipt.AmountApplied));
                }
            }
            // Here we handle Change Due and Convenience fees.
            // We'll add a row for each of them that are > 0
            let changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0; });
            let TotalChangeDue = changeDueTmp.reduce((ChangeDue, b) => {
                return ChangeDue + b.ChangeDue;
            }, 0);
            if (TotalChangeDue > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Total Change Due", "", "", TotalChangeDue, 0));
            }
            let convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0; });
            let TotalConvenienceFee = convenienceFeeTmp.reduce((ConvenienceFeeAmount, b) => {
                return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
            }, 0);
            if (TotalConvenienceFee > 0) {
                tbody.appendChild(ReceiptPayment.BuildPaymentRow("Convenience Fee Estimate", "", "", TotalConvenienceFee, 0));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        }
        static CreateTable() {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            let thead = document.createElement("THEAD");
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableHeaderElement("Payment Type", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Info", "35%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Check/Trans#", "20%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Tendered", "15%"));
            tr.appendChild(clayPay.UI.createTableHeaderElement("Applied", "15%"));
            thead.appendChild(tr);
            table.appendChild(thead);
            return table;
        }
        static BuildPaymentRow(paymentType, info, checkNumber, tendered, applied) {
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(paymentType));
            tr.appendChild(clayPay.UI.createTableElement(info));
            tr.appendChild(clayPay.UI.createTableElement(checkNumber));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(tendered)));
            if (paymentType === "Convenience Fee Estimate") {
                tr.appendChild(clayPay.UI.createTableElement(""));
            }
            else {
                tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(applied)));
            }
            return tr;
        }
        static BuildCashPaymentRow(receipt) {
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(receipt.PaymentTypeDescription));
            tr.appendChild(clayPay.UI.createTableElement(receipt.Info));
            // where the check number goes we're going to put a button labeled: "Change to Check"
            // and if the user clicks it, the button will disappear
            // and a text box will be added with the placeholder "Check Number"
            // for the user to enter the check number, and a Save button next to it.
            // We will need to check to make sure a check number is entered before we allow saving.
            let td = document.createElement("td");
            let container = document.createElement("div");
            let fieldContainer = document.createElement("div");
            fieldContainer.classList.add("hide");
            let field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("is-grouped");
            let inputControl = document.createElement("div");
            inputControl.classList.add("control");
            let input = document.createElement("input");
            input.classList.add("input");
            input.placeholder = "Enter Check Number";
            input.required = true;
            input.type = "text";
            let buttonControl = document.createElement("div");
            buttonControl.classList.add("control");
            let saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.classList.add("button");
            saveButton.classList.add("is-success");
            saveButton.appendChild(document.createTextNode("Save"));
            saveButton.onclick = () => {
                let checkNumber = input.value;
                if (checkNumber.length === 0) {
                    alert("You must enter a check number before you can save.");
                    return;
                }
                saveButton.classList.add("is-loading");
                let changed = new ReceiptPayment();
                changed.CashierId = receipt.CashierId;
                changed.OTId = receipt.OTId;
                changed.PaymentType = "CK";
                changed.PayId = receipt.PayId;
                changed.CheckNumber = checkNumber;
                ReceiptPayment.SavePaymentChanges(changed);
            };
            let convertButton = document.createElement("button");
            convertButton.type = "button";
            convertButton.classList.add("button");
            convertButton.classList.add("is-primary");
            convertButton.appendChild(document.createTextNode("Convert To Check"));
            convertButton.onclick = () => {
                Utilities.Hide(convertButton);
                Utilities.Show(fieldContainer);
            };
            inputControl.appendChild(input);
            buttonControl.appendChild(saveButton);
            field.appendChild(inputControl);
            field.appendChild(buttonControl);
            container.appendChild(convertButton);
            fieldContainer.appendChild(field);
            container.appendChild(fieldContainer);
            td.appendChild(container);
            tr.appendChild(td);
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountTendered)));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountApplied)));
            return tr;
        }
        static BuildCheckPaymentRow(receipt) {
            let tr = document.createElement("tr");
            tr.appendChild(clayPay.UI.createTableElement(receipt.PaymentTypeDescription));
            tr.appendChild(clayPay.UI.createTableElement(receipt.Info));
            let td = clayPay.UI.createTableElement(receipt.CheckNumber);
            // where the check number goes we're going to put a button labeled: "Change to Check"
            // and if the user clicks it, the button will disappear
            // and a text box will be added with the placeholder "Check Number"
            // for the user to enter the check number, and a Save button next to it.
            // We will need to check to make sure a check number is entered before we allow saving.
            let saveButton = document.createElement("button");
            saveButton.type = "button";
            saveButton.classList.add("button");
            saveButton.classList.add("is-success");
            saveButton.appendChild(document.createTextNode("Convert To Cash Payment"));
            saveButton.onclick = () => {
                saveButton.classList.add("is-loading");
                let changed = new ReceiptPayment();
                changed.CashierId = receipt.CashierId;
                changed.OTId = receipt.OTId;
                changed.PaymentType = "CA";
                changed.PayId = receipt.PayId;
                changed.CheckNumber = "";
                ReceiptPayment.SavePaymentChanges(changed);
            };
            td.appendChild(saveButton);
            tr.appendChild(td);
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountTendered)));
            tr.appendChild(clayPay.UI.createTableElement(Utilities.Format_Amount(receipt.AmountApplied)));
            return tr;
        }
        static SavePaymentChanges(receipt) {
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            let editPayment = receipt;
            Utilities.Post(path + "API/Balancing/EditPayments", editPayment)
                .then(function (cr) {
                console.log('cr returned', cr);
                if (cr.Errors.length > 0) {
                    alert("Errors occurred while attempting to save: " + cr.Errors[0]);
                    return;
                }
                clayPay.ClientResponse.BalancingSearch();
            }, function (error) {
                console.log('Save Payment Changes error', error);
            });
        }
    }
    clayPay.ReceiptPayment = ReceiptPayment;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ReceiptPayment.js.map