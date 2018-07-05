Number.isNaN = Number.isNaN || function (value)
{
  return value !== value;
}

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
    Validated: boolean;
  }

  export class Payment implements IPayment
  {
    public PaymentType: payment_type;
    public Amount: number = 0;
    public CheckNumber: string = "";
    public TransactionId: string = "";
    public Validated: boolean = false;
    static checkErrorElement: string = "checkPaymentError";
    static cashErrorElement: string = "cashPaymentError";
    static checkAmountInput: string = "checkPaymentAmount";
    static cashAmountInput: string = "checkPaymentAmount";
    static checkNumberInput: string = "checkNumber";

    constructor(paymentType: payment_type)
    {
      this.PaymentType = paymentType;
    }

    public Validate():boolean
    {
      this.Validated == false;
      this.Amount = 0;
      this.CheckNumber = "";
      this.TransactionId = "";
      // We don't need to validate Credit card payments here
      // because they are validated in CCData.
      if (this.PaymentType === payment_type.cash)
      {
        return this.ValidateCash();
      }
      else
      {
        return this.ValidateCheck();
      }
    }

    ValidateCash():boolean
    {
      this.PopulateCash();
      if (Number.isNaN(this.Amount))
      {
        Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");

      }
      else
      {
        this.Validated == true;
      }
      return this.Validated;
    }

    PopulateCash(): void
    {
      let value = Utilities.Get_Value(Payment.cashAmountInput).trim();
      if (value.length === 0) return;
      this.Amount = parseFloat(value);
    }

    ValidateCheck(): boolean
    {
      this.PopulateCheck();
      if (Number.isNaN(this.Amount))
      {
        this.Amount = 0;
        Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
      }
      else
      {
        if (this.CheckNumber.length === 0 && this.Amount > 0)
        {
          Utilities.Error_Show(Payment.checkErrorElement, "A Check number must be entered if a Check amount is entered.");
        }
        this.Validated == true;
      }
      return this.Validated;
    }

    PopulateCheck(): void
    {
      this.CheckNumber = Utilities.Get_Value(Payment.checkNumberInput).trim();
      let value = Utilities.Get_Value(Payment.checkAmountInput).trim();
      if (value.length === 0) return;
      this.Amount = parseFloat(value);
    }

  }
}