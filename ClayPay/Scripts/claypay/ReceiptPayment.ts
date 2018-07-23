namespace clayPay
{
  interface IReceiptPayment
  {
    CashierId: string;
    PayId: number;
    OTId: number;
    Info: string;
    TransactionDate: Date;
    PaymentType: string;
    PaymentTypeDescription: string;
    AmountApplied: number;
    AmountTendered: number;
    ChangeDue: number;
    ConvenienceFeeAmount: number;

  }

  export class ReceiptPayment implements IReceiptPayment
  {
    public CashierId: string = "";
    public PayId: number = -1;
    public OTId: number = -1;
    public Info: string = "";
    public TransactionDate: Date = new Date();
    public PaymentType: string = "";
    public PaymentTypeDescription: string = "";
    public AmountApplied: number = -1;
    public AmountTendered: number = -1;
    public ChangeDue: number = -1;
    public ConvenienceFeeAmount: number = -1;

    constructor()
    {

    }
  }


}