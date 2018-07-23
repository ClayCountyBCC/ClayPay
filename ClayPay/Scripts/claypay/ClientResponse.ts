
namespace clayPay
{
  interface IClientResponse
  {
    ResponseCashierData: CashierData;
    Charges: Array<Charge>;
    ReceiptPayments: Array<ReceiptPayment>;
    Errors: Array<string>;
    TransactionId: string;
    PartialErrors: Array<string>;
  }

  export class ClientResponse implements IClientResponse
  {
    public ResponseCashierData: CashierData = new CashierData();
    public Charges: Array<Charge> = [];
    public ReceiptPayments: Array<ReceiptPayment> = [];
    public TransactionId: string = "";

    public Errors: Array<string> = []; // Errors are full stop, meaning the payment did not process.
    public PartialErrors: Array<string> = []; // Partial errors mean part of the transaction was completed, but something wasn't.

    static CashierErrorTarget: string = "paymentError";
    static PublicErrorTarget: string = "publicPaymentError";
    static ReceiptContainer: string = "receipt";
    static TimeStampInput: string = "receiptTimeStamp";
    static CashierIdInput: string = "receiptCashierId";
    static AmountPaidInput: string = "receiptAmountPaid";
    static ChangeDueInput: string = "receiptChangeDue";
    static TransactionIdContainer: string = "receiptTransactionIdContainer";
    static TransactionId: string = "receiptTransactionId";
    static ReceiptErrorContainer: string = "receiptTransactionErrorContainer";

    constructor()
    {
    }

    public static HandleResponse(cr: ClientResponse, IsCashier: boolean):void
    {
      console.log('client response', cr);
      if (cr.Errors.length > 0)
      {
        if (IsCashier)
        {
          Utilities.Error_Show(ClientResponse.CashierErrorTarget, cr.Errors);
        }
        else
        {
          Utilities.Error_Show(ClientResponse.CashierErrorTarget, cr.Errors);
        }        
        return;
      }
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


  }

}