/// <reference path="payment.ts" />

namespace clayPay
{
  interface INewTransaction
  {
    OTid: number;
    CashierId: string;
    ItemIds: Array<number>;
    CCData: CCPayment;
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
    TotalAmountDue: number;
    CheckPayment: Payment;
    CashPayment: Payment;
    Validate(): boolean;
  }

  export class NewTransaction implements INewTransaction
  {
    public OTid: number = 0; // used after the transaction is saved
    public CashierId: string = ""; // used after the transaction is saved
    public ItemIds: Array<number> = [];
    public CCData: CCPayment = null;
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
    public TotalAmountDue: number = 0;
    public CheckPayment: Payment = new Payment(payment_type.check);
    public CashPayment: Payment = new Payment(payment_type.cash);
    // Menu Ids
    public static TotalAmountPaidMenu = "cartTotalAmountPaid";
    public static TotalAmountDueMenu = "cartTotalAmountDue";
    public static TotalAmountRemainingMenu = "";
    public static TotalChangeDueMenu = "";

    // Payer Inputs
    public static payerFirstName = "payerFirstName";
    public static payerLastName = "payerLastName";
    public static payerPhone = "payerPhone";
    public static payerEmail = "payerEmailAddress";
    public static payerCompany = "payerCompany";
    public static payerStreet = "payerStreetAddress";
    public static payerCity = "payerCity";
    public static payerState = "payerState";
    public static payerZip = "payerZip";
    // Payer error text elemnets
    public static payerNameError = "payerNameError";
    public static payerPhoneError = "payerPhoneError";
    public static payerStreetError = "payerStreetError";
    public static payerCityError = "payerCityError";
    constructor()
    {

    }

    public Validate():boolean
    {
      this.UpdateTotals();
      return false;
    }

    UpdateTotals(): void
    {
      let TotalPaid = 0;
      if (this.CheckPayment.Validated) TotalPaid += this.CheckPayment.Amount;
      if (this.CashPayment.Validated) TotalPaid += this.CashPayment.Amount;
      Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(TotalPaid));
    }

    public ValidatePayer(): void
    {
      this.ResetPayerData();
      this.PayerFirstName = Utilities.Validate_Text(NewTransaction.payerFirstName, NewTransaction.payerNameError, "The Firstname field is required.");
      if (this.PayerFirstName.length === 0) return;

      this.PayerLastName = Utilities.Validate_Text(NewTransaction.payerLastName, NewTransaction.payerNameError, "The Lastname field is required.");
      if (this.PayerLastName.length === 0) return;

      this.PayerPhoneNumber = Utilities.Validate_Text(NewTransaction.payerPhone, NewTransaction.payerPhoneError, "The Phone number field is required.");
      if (this.PayerPhoneNumber.length === 0) return;
      if (this.PayerPhoneNumber.length < 10)
      {
        Utilities.Error_Show(NewTransaction.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
        let element = document.getElementById(NewTransaction.payerPhone);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return;
      }

      this.PayerEmailAddress = Utilities.Get_Value(NewTransaction.payerEmail).trim();
      this.PayerCompanyName = Utilities.Get_Value(NewTransaction.payerCompany).trim();

      this.PayerStreetAddress = Utilities.Validate_Text(NewTransaction.payerStreet, NewTransaction.payerStreetError, "The street address field is required.");
      if (this.PayerStreetAddress.length === 0) return;

      this.PayerCity = Utilities.Validate_Text(NewTransaction.payerCity, NewTransaction.payerCityError, "The City field is required.");
      if (this.PayerCity.length === 0) return;
      this.PayerState = Utilities.Validate_Text(NewTransaction.payerState, NewTransaction.payerCityError, "The State field is required.");
      if (this.PayerState.length === 0) return;
      this.PayerZip = Utilities.Validate_Text(NewTransaction.payerZip, NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
      if (this.PayerZip.length === 0) return;
      if (this.PayerZip.length < 5)
      {
        Utilities.Error_Show(NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
        let element = document.getElementById(NewTransaction.payerZip);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return;
      }

      // if they make it to the end, let's hide the button and show the payment info
      Utilities.Hide("validatePayer");
      Utilities.Show("paymentData");

    }

    public ResetPayerForm():void
    {

    }

    CopyPayerData(): void
    {
      // this function is used when the user clicks the "This is the same as Payer Information"
      // checkbox in the credit card data.  It takes the information in that form and
      // updates the CCData with it and then the CCData object will update the CCData form.
      this.CCData.FirstName = this.PayerFirstName;
      this.CCData.LastName = this.PayerLastName;
      this.CCData.ZipCode = this.PayerZip;
      this.CCData.EmailAddress = this.PayerEmailAddress;
      this.CCData.UpdatePayerData();
    }

    ResetPayerData(): void
    {
      this.PayerFirstName = "";
      this.PayerLastName = "";
      this.PayerPhoneNumber = "";
      this.PayerEmailAddress = "";
      this.PayerCompanyName = "";
      this.PayerState = "";
      this.PayerCity = "";
      this.PayerStreetAddress = "";
      this.PayerZip = "";
    }


  }
}