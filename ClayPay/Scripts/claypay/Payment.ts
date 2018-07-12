Number.isNaN = Number.isNaN || function (value)
{
  return value !== value;
}

namespace clayPay
{

  export enum payment_type 
  {
    cash = 0,
    check = 1,
    credit_card = 2
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
    static checkAmountInput: string = "checkPaymentAmount";
    static checkNumberInput: string = "checkNumber";
    static checkPaymentTotalMenu: string = "checkPaymentTotal";
    static checkPaymentContainer: string = "checkPaymentType";

    static cashErrorElement: string = "cashPaymentError";
    static cashAmountInput: string = "cashPaymentAmount";
    static cashPaymentTotalMenu: string = "cashPaymentTotal";
    static cashPaymentContainer: string = "cashPaymentType";

    constructor(paymentType: payment_type)
    {
      this.PaymentType = paymentType;
    }

    public UpdateTotal(): void
    {
      let input = this.PaymentType === payment_type.cash ? Payment.cashAmountInput : Payment.checkAmountInput;
      Utilities.Set_Value(input, this.Amount.toFixed(2));
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
      this.Validated = false;
      let cashAmount = <HTMLInputElement>document.getElementById(Payment.cashAmountInput);

      // check that an amount was entered.
      // It must be 0 or greater.

      let testAmount = Utilities.Validate_Text(Payment.cashAmountInput, Payment.cashErrorElement, "You must enter an amount of 0 or greater in order to continue.");
      if (testAmount.length === 0) return;

      // check that it's a valid amount.
      // 0 is valid because they could've set it to greater than 0
      // and are now wanting to revert it back to 0.      
      this.Amount = parseFloat(testAmount);
      if (Number.isNaN(this.Amount) || this.Amount < 0)
      {
        cashAmount.classList.add("is-danger");
        cashAmount.focus();
        cashAmount.scrollTo();
        this.Amount = 0;
        Utilities.Error_Show(Payment.cashErrorElement, "An invalid amount was entered.");
        return false;
      }

      this.Validated = true;
      Utilities.Set_Text(Payment.cashPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
      Utilities.Hide(Payment.cashPaymentContainer);

      clayPay.CurrentTransaction.Validate();

      return this.Validated;
    }

    ValidateCheck(): boolean
    {
      this.Validated = false;
      let checkAmount = <HTMLInputElement>document.getElementById(Payment.checkAmountInput);
      //let checkNumber = <HTMLInputElement>document.getElementById(Payment.checkNumberInput);
      //let checkError = document.getElementById(Payment.checkErrorElement);
      //checkAmount.classList.remove("is-danger");
      //checkNumber.classList.remove("is-danger");

      // check that an amount was entered.
      let testAmount = Utilities.Validate_Text(Payment.checkAmountInput, Payment.checkErrorElement, "You must enter an amount of 0 or greater in order to continue.");
      if (testAmount.length === 0) return;

      // check that it's a valid amount.
      // 0 is valid because they could've set it to greater than 0
      // and are now wanting to revert it back to 0.
      // We are also going to make sure that the amount is >= 0.
      this.Amount = parseFloat(testAmount);
      if (Number.isNaN(this.Amount) || this.Amount < 0)
      {
        checkAmount.classList.add("is-danger");
        checkAmount.focus();
        checkAmount.scrollTo();
        this.Amount = 0;
        Utilities.Error_Show(Payment.checkErrorElement, "An invalid amount was entered.");
        return false;
      }
      if (this.Amount > clayPay.CurrentTransaction.TotalAmountDue)
      {
        checkAmount.classList.add("is-danger");
        checkAmount.focus();
        checkAmount.scrollTo();        
        Utilities.Error_Show(Payment.checkErrorElement, "You cannot enter an amount for more than the total amount due.");
        return false;
      }

      // get the check number
      this.CheckNumber = Utilities.Validate_Text(Payment.checkNumberInput, Payment.checkErrorElement, "You must enter the check number to continue.");
      if (this.CheckNumber.length === 0) return;

      this.Validated = true;
      Utilities.Set_Text(Payment.checkPaymentTotalMenu, Utilities.Format_Amount(this.Amount));
      Utilities.Hide(Payment.checkPaymentContainer);

      clayPay.CurrentTransaction.Validate();

      return this.Validated;
    }

    static ResetAll(): void
    {
      Payment.ResetCash();
      Payment.ResetCheck();
    }

    public static ResetCash(): void
    {
      clayPay.CurrentTransaction.CashPayment = new Payment(payment_type.cash);
      let e = <HTMLInputElement>document.getElementById(Payment.cashAmountInput);
      Utilities.Set_Value(e, "");
      e.classList.remove("is-danger");
      let menu = document.getElementById(Payment.cashPaymentTotalMenu);
      Utilities.Set_Text(menu, "Add");
      Utilities.Hide(Payment.cashPaymentContainer);
      clayPay.CurrentTransaction.Validate();
    }

    public static ResetCheck(): void
    {
      clayPay.CurrentTransaction.CheckPayment = new Payment(payment_type.check);
      let amount = <HTMLInputElement>document.getElementById(Payment.checkAmountInput);
      Utilities.Set_Value(amount, "");
      amount.classList.remove("is-danger");
      let number = <HTMLInputElement>document.getElementById(Payment.checkNumberInput);
      Utilities.Set_Value(number, "");
      number.classList.remove("is-danger");
      let menu = document.getElementById(Payment.checkPaymentTotalMenu);
      Utilities.Set_Text(menu, "Add");      
      Utilities.Hide(Payment.checkPaymentContainer);
      clayPay.CurrentTransaction.Validate();
    }

  }
}