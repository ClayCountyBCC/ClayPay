namespace clayPay
{

  export enum payment_type 
  {
    credit_card = 0,
    check = 1,
    cash = 2
  }

  interface IPayment
  {
    PaymentType: payment_type;
    Amount: number;
    CheckNumber: string;
    TransactionId: string;
  }

  export class Payment implements IPayment
  {
    public PaymentType: payment_type;
    public Amount: number = 0;
    public CheckNumber: string;
    public TransactionId: string;
  }
}