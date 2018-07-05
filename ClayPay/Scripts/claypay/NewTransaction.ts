/// <reference path="payment.ts" />

namespace clayPay
{
  interface INewTransaction
  {
    OTid: number;
    CashierId: string;
    ItemIds: Array<number>;
    CCPayment: CCData;
    Payments: Array<Payment>;
    errors: Array<string>;
    PayerFirstName: string;
    PayerLastName: string;
    PayerPhoneNumber: string;
    PayerEmailAddress: string;
    PayerCompanyName: string;
    PayerStreetAddress: string;
    PayerCity: string;
    PayerState: string;
    PayerZip: string;
    CheckPayment: Payment;
    CashPayment: Payment;
    Validate(): boolean;
  }

  export class NewTransaction implements INewTransaction
  {
    public OTid: number = 0; // used after the transaction is saved
    public CashierId: string = ""; // used after the transaction is saved
    public ItemIds: Array<number> = [];
    public CCPayment: CCData = null;
    public Payments: Array<Payment> = [];
    public errors: Array<string> = [];
    public PayerFirstName: string;
    public PayerLastName: string;
    public PayerPhoneNumber: string;
    public PayerEmailAddress: string;
    public PayerCompanyName: string;
    public PayerStreetAddress: string;
    public PayerCity: string;
    public PayerState: string;
    public PayerZip: string;
    public CheckPayment: Payment = new Payment(payment_type.check);
    public CashPayment: Payment = new Payment(payment_type.cash);

    constructor()
    {

    }

    public Validate():boolean
    {
      
      return false;
    }


  }
}