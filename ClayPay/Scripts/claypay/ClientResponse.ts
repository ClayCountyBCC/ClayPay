namespace clayPay
{
  interface IClientResponse
  {
    TimeStamp: string;
    CashierId: string;
    TransactionId: string;
    AmountPaid: number;
    ChangeDue: number;
    Errors: Array<string>;
  }

  export class ClientResponse implements IClientResponse
  {
    public TimeStamp: string = "";
    public CashierId: string = "";
    public TransactionId: string = "";
    public AmountPaid: number = 0;
    public ChangeDue: number = 0;
    public Errors: Array<string> = [];

    static CashierErrorTarget: string = "paymentError";
    static PublicErrorTarget: string = "publicPaymentError";
    static ReceiptContainer: string = "receipt";
    static TimeStampInput: string = "receiptTimeStamp";
    static CashierIdInput: string = "receiptCashierId";
    static AmountPaidInput: string = "receiptAmountPaid";
    static ChangeDueInput: string = "receiptChangeDue";
    static TransactionIdContainer: string = "receiptTransactionIdContainer";
    static TransactionId: string = "receiptTransactionId";

    constructor()
    {
    }

    public static HandleResponse(cr: ClientResponse, IsCashier: boolean):void
    {
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

      if (cr.TransactionId.length > 0)
      {
        Utilities.Show(ClientResponse.TransactionIdContainer);
      } else
      {
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

}