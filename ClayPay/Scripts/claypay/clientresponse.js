var clayPay;
(function (clayPay) {
    class ClientResponse {
        constructor() {
            this.TimeStamp = "";
            this.CashierId = "";
            this.TransactionId = "";
            this.AmountPaid = 0;
            this.ChangeDue = 0;
            this.Errors = [];
        }
        static HandleResponse(cr, IsCashier) {
            if (cr.Errors.length > 0) {
                if (IsCashier) {
                    Utilities.Error_Show(ClientResponse.CashierErrorTarget, cr.Errors);
                }
                else {
                    Utilities.Error_Show(ClientResponse.CashierErrorTarget, cr.Errors);
                }
                return;
            }
            if (cr.TransactionId.length > 0) {
                Utilities.Show(ClientResponse.TransactionIdContainer);
            }
            else {
                Utilities.Hide(ClientResponse.TransactionIdContainer);
            }
            Utilities.Set_Value(ClientResponse.TransactionId, cr.TransactionId);
            Utilities.Set_Value(ClientResponse.TimeStampInput, cr.TimeStamp);
            Utilities.Set_Value(ClientResponse.CashierIdInput, cr.CashierId);
            Utilities.Set_Value(ClientResponse.AmountPaidInput, Utilities.Format_Amount(cr.AmountPaid));
            Utilities.Set_Value(ClientResponse.ChangeDueInput, Utilities.Format_Amount(cr.ChangeDue));
            // this needs to hide all of the other sections and just show the receipt.
            Utilities.Show_Hide_Selector("#views > section", ClientResponse.ReceiptContainer);
        }
    }
    ClientResponse.CashierErrorTarget = "paymentError";
    ClientResponse.PublicErrorTarget = "publicPaymentError";
    ClientResponse.ReceiptContainer = "receipt";
    ClientResponse.TimeStampInput = "receiptTimeStamp";
    ClientResponse.CashierIdInput = "receiptCashierId";
    ClientResponse.AmountPaidInput = "receiptAmountPaid";
    ClientResponse.ChangeDueInput = "receiptChangeDue";
    ClientResponse.TransactionIdContainer = "receiptTransactionIdContainer";
    ClientResponse.TransactionId = "receiptTransactionId";
    clayPay.ClientResponse = ClientResponse;
})(clayPay || (clayPay = {}));
//# sourceMappingURL=clientresponse.js.map