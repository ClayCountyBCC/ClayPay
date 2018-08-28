var clayPay;
(function (clayPay) {
    var ClientResponse = /** @class */ (function () {
        function ClientResponse() {
            this.ResponseCashierData = new clayPay.CashierData();
            this.Charges = [];
            this.ReceiptPayments = [];
            this.TransactionId = "";
            this.IsEditable = false;
            this.Errors = []; // Errors are full stop, meaning the payment did not process.
            this.PartialErrors = []; // Partial errors mean part of the transaction was completed, but something wasn't.
        }
        ClientResponse.ShowPaymentReceipt = function (cr, target) {
            console.log('client response ShowPaymentReceipt', cr);
            var container = document.getElementById(target);
            Utilities.Clear_Element(container);
            container.appendChild(ClientResponse.CreateReceiptView(cr));
            Utilities.Show_Hide_Selector("#views > section", target);
        };
        ClientResponse.CreateReceiptView = function (cr) {
            var df = document.createDocumentFragment();
            if (cr.ReceiptPayments.length === 0)
                return df;
            df.appendChild(ClientResponse.CreateReceiptHeader(cr));
            df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
            df.appendChild(clayPay.Charge.CreateChargesTable(cr.Charges, clayPay.ChargeView.receipt));
            df.appendChild(clayPay.ReceiptPayment.CreateReceiptPaymentView(cr.ReceiptPayments, cr.IsEditable));
            // show payment info
            return df;
        };
        ClientResponse.CreateReceiptHeader = function (cr) {
            var div = document.createElement("div");
            div.classList.add("level");
            var title = document.createElement("span");
            title.classList.add("level-item");
            title.classList.add("title");
            title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
            var receiptDate = document.createElement("span");
            receiptDate.classList.add("level-item");
            receiptDate.classList.add("subtitle");
            receiptDate.appendChild(document.createTextNode("Transaction Date: " + Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
            div.appendChild(title);
            div.appendChild(receiptDate);
            var timestamp = cr.ResponseCashierData.TransactionDate;
            return div;
        };
        ClientResponse.CreateReceiptPayerView = function (cd) {
            var df = document.createDocumentFragment();
            if (cd.IsVoided) {
                var level = document.createElement("div");
                level.classList.add("level");
                level.classList.add("notification");
                level.classList.add("is-danger");
                var levelitem = document.createElement("p");
                levelitem.classList.add("level-item");
                levelitem.classList.add("title");
                //levelitem.style.alignContent = "center";
                //levelitem.style.alignItems = "center";
                //levelitem.style.justifyContent = "center";
                levelitem.appendChild(document.createTextNode("This transaction has been voided."));
                level.appendChild(levelitem);
                df.appendChild(level);
            }
            df.appendChild(ClientResponse.CreatePayerDataColumns("Name", cd.PayerName, "Company Name", cd.PayerCompanyName));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Phone Number", cd.PayerPhoneNumber, "Email Address", cd.PayerEmailAddress));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Street Address", cd.PayerStreet1, "Address 2", cd.PayerStreet2));
            df.appendChild(ClientResponse.CreatePayerDataColumns("Processed By", cd.UserName, "", ""));
            return df;
        };
        ClientResponse.CreatePayerDataColumns = function (label1, value1, label2, value2) {
            var div = document.createElement("div");
            div.classList.add("columns");
            div.style.marginBottom = "0";
            div.appendChild(ClientResponse.CreatePayerData(label1, value1));
            div.appendChild(ClientResponse.CreatePayerData(label2, value2));
            return div;
        };
        ClientResponse.CreatePayerData = function (label, value) {
            var field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            var dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            var control = document.createElement("div");
            control.classList.add("control");
            var input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        };
        ClientResponse.Search = function () {
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, true);
            var input = document.getElementById(ClientResponse.receiptSearchInput);
            var k = input.value.trim().toUpperCase();
            if (k.length !== 9) {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Receipts must be 8 digits and a dash, like 18-000001.");
                return;
            }
            if (k.length > 0) {
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Get(path + "API/Payments/Receipt/?CashierId=" + k).then(function (cr) {
                    console.log('Client Response', cr);
                    if (cr.Errors.length > 0) {
                        Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
                    }
                    else {
                        ClientResponse.ShowPaymentReceipt(cr, ClientResponse.PaymentReceiptContainer);
                    }
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                }, function (errorText) {
                    console.log('error in Receipt Search', errorText);
                    Utilities.Error_Show(ClientResponse.receiptSearchError, errorText);
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                });
            }
            else {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Invalid search. Please check your entry and try again.");
                input.focus();
                Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
            }
        };
        ClientResponse.BalancingSearch = function (link) {
            if (link === void 0) { link = null; }
            var cashierId = Utilities.Get_Value("receiptSearch");
            var path = "/";
            var qs = "";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            //DateTime DateToBalance, string PaymentType
            qs = "?CashierId=" + cashierId;
            Utilities.Get(path + "API/Balancing/Receipt" + qs)
                .then(function (cr) {
                console.log('client response', cr);
                if (link !== null)
                    Utilities.Set_Text(link, cashierId);
                clayPay.ClientResponse.ShowPaymentReceipt(cr, Balancing.Payment.DJournalReceiptContainer);
                // need to select the right box at the top
                var menulist = Balancing.Menus.filter(function (j) { return j.id === "nav-receipts"; });
                var receiptMenu = menulist[0];
                Utilities.Update_Menu(receiptMenu);
            }, function (error) {
                console.log('error getting client response for cashier id: ' + cashierId, error);
                if (link !== null)
                    Utilities.Set_Text(link, cashierId); // change it back
            });
        };
        ClientResponse.CashierErrorTarget = "paymentError";
        ClientResponse.PublicErrorTarget = "publicPaymentError";
        ClientResponse.PaymentReceiptContainer = "receipt";
        ClientResponse.BalancingReceiptContainer = "receiptView";
        //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
        // receiptSearchElements
        ClientResponse.receiptSearchInput = "receiptSearch";
        ClientResponse.receiptSearchButton = "receiptSearchButton";
        ClientResponse.receiptSearchError = "receiptSearchError";
        return ClientResponse;
    }());
    clayPay.ClientResponse = ClientResponse;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ClientResponse.js.map