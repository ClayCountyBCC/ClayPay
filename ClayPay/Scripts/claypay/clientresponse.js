var clayPay;
(function (clayPay) {
    class ClientResponse {
        constructor() {
            this.ResponseCashierData = new clayPay.CashierData();
            this.Charges = [];
            this.ReceiptPayments = [];
            this.TransactionId = "";
            this.Errors = []; // Errors are full stop, meaning the payment did not process.
            this.PartialErrors = []; // Partial errors mean part of the transaction was completed, but something wasn't.
        }
        static ShowPaymentReceipt(cr) {
            console.log('client response', cr);
            let container = document.getElementById(ClientResponse.ReceiptContainer);
            Utilities.Clear_Element(container);
            container.appendChild(ClientResponse.CreateReceiptView(cr));
            //if (cr.PartialErrors.length > 0)
            //{
            //  Utilities.Error_Show(ClientResponse.ReceiptErrorContainer, cr.PartialErrors, false);
            //}
            //if (cr.TransactionId.trim().length > 0)
            //{
            //  Utilities.Show(ClientResponse.TransactionIdContainer);
            //} else
            //{
            //  Utilities.Hide(ClientResponse.TransactionIdContainer);
            //}
            //Utilities.Set_Value(ClientResponse.TransactionId, cr.TransactionId);
            //Utilities.Set_Text(ClientResponse.TimeStampInput, cr.TimeStamp);
            //Utilities.Set_Value(ClientResponse.CashierIdInput, cr.CashierId);
            //Utilities.Set_Value(ClientResponse.AmountPaidInput, Utilities.Format_Amount(cr.AmountPaid));
            //Utilities.Set_Value(ClientResponse.ChangeDueInput, Utilities.Format_Amount(cr.ChangeDue));
            // this needs to hide all of the other sections and just show the receipt.
            Utilities.Show_Hide_Selector("#views > section", ClientResponse.ReceiptContainer);
        }
        static CreateReceiptView(cr) {
            let df = document.createDocumentFragment();
            df.appendChild(ClientResponse.CreateReceiptView(cr));
            df.appendChild(clayPay.Charge.CreateChargesTable(cr.Charges, clayPay.ChargeView.receipt));
            return df;
        }
        static CreateReceiptHeader(cr) {
            let div = document.createElement("div");
            div.classList.add("level");
            let title = document.createElement("span");
            title.classList.add("level-item");
            title.classList.add("title");
            title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
            div.appendChild(title);
            let receiptDate = document.createElement("span");
            receiptDate.classList.add("level-item");
            receiptDate.classList.add("subtitle");
            receiptDate.appendChild(document.createTextNode(Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
            let timestamp = cr.ResponseCashierData.TransactionDate;
            return div;
        }
        static Search() {
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, true);
            let input = document.getElementById(ClientResponse.receiptSearchInput);
            let k = input.value.trim().toUpperCase();
            if (k.length !== 9) {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Receipts must be 8 digits and a dash, like 18-000001.");
                return;
            }
            if (k.length > 0) {
                let path = "/";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Get(path + "API/Payments/Receipt/?CashierId=" + k).then(function (cr) {
                    if (cr.Errors.length > 0) {
                        Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
                    }
                    else {
                        ClientResponse.ShowPaymentReceipt(cr);
                    }
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                    return true;
                }, function (errorText) {
                    console.log('error in Receipt Search', errorText);
                    Utilities.Error_Show(ClientResponse.receiptSearchError, errorText);
                    // do something with the error here
                    // need to figure out how to detect if something wasn't found
                    // versus an error.
                    Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                    return;
                });
            }
            else {
                Utilities.Error_Show(ClientResponse.receiptSearchError, "Invalid search. Please check your entry and try again.");
                input.focus();
                Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
                return;
            }
        }
    }
    ClientResponse.CashierErrorTarget = "paymentError";
    ClientResponse.PublicErrorTarget = "publicPaymentError";
    ClientResponse.ReceiptContainer = "receipt";
    //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
    // receiptSearchElements
    ClientResponse.receiptSearchInput = "receiptSearch";
    ClientResponse.receiptSearchButton = "receiptSearchButton";
    ClientResponse.receiptSearchError = "receiptSearchError";
    clayPay.ClientResponse = ClientResponse;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=ClientResponse.js.map