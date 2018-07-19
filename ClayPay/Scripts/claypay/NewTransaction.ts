/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />

namespace clayPay
{
  interface INewTransaction
  {
    OTid: number;
    CashierId: string;
    ItemIds: Array<number>;
    CCData: CCPayment;
    Payments: Array<Payment>;
    PayerFirstName: string;
    PayerLastName: string;
    PayerPhoneNumber: string;
    PayerEmailAddress: string;
    PayerCompanyName: string;
    PayerStreetAddress: string;
    PayerCity: string;
    PayerState: string;
    PayerZip: string;
    IsCashier: boolean;
    TotalAmountDue: number;
    CheckPayment: Payment;
    CashPayment: Payment;
    Validate(): boolean;
  }

  export class NewTransaction implements INewTransaction
  {
    // CurrentCharges are the search results (charges) returned and displayed
    // in the results container.
    public CurrentCharges: Array<Charge> = [];
    // Cart are the charges that the user chose from the CurrentCharges to
    // pay for in this session.
    public Cart: Array<Charge> = [];

    public OTid: number = 0; // used after the transaction is saved
    public CashierId: string = ""; // used after the transaction is saved
    public ItemIds: Array<number> = [];
    public CCData: CCPayment = new CCPayment();
    public Payments: Array<Payment> = [];
    public PayerFirstName: string;
    public PayerLastName: string;
    public PayerPhoneNumber: string;
    public PayerEmailAddress: string;
    public PayerCompanyName: string;
    public PayerStreetAddress: string;
    public PayerCity: string;
    public PayerState: string;
    public PayerZip: string;
    public IsCashier: boolean = false;    
    public CheckPayment: Payment = new Payment(payment_type.check);
    public CashPayment: Payment = new Payment(payment_type.cash);
    public TotalAmountDue: number = 0;
    public TotalAmountPaid: number = 0;
    public TotalAmountRemaining: number = 0;
    public TotalChangeDue: number = 0;
    // Menu Ids
    public static TotalAmountPaidMenu = "cartTotalAmountPaid";
    public static TotalAmountDueMenu = "cartTotalAmountDue";
    public static TotalAmountRemainingMenu = "cartTotalAmountRemaining";
    public static TotalChangeDueMenu = "cartTotalChangeDue";

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
    public static PayNowCashierButton = "processPayments";
    public static PayNowPublicButton = "processCCPayment";

    // Payer error text elemnets
    public static payerNameError = "payerNameError";
    public static payerPhoneError = "payerPhoneError";
    public static payerStreetError = "payerStreetError";
    public static payerCityError = "payerCityError";

    // Transaction Error container
    public static paymentError = "paymentError";

    constructor()
    {

    }

    public UpdateIsCashier(): void
    {
      let e = document.getElementById(Payment.checkPaymentContainer);
      this.IsCashier = e !== undefined && e !== null;
    }

    public Validate():boolean
    {
      let payer = this.ValidatePayer();
      if (!payer)
      {
        Utilities.Show("validatePayer");
        Utilities.Hide("paymentData");
        return false;
      } else
      {
        Utilities.Hide("validatePayer");
        Utilities.Show("paymentData");        
      }
      if (this.IsCashier)
      {
        this.UpdateTotals();
        let payments = this.ValidatePayments();
        let button = <HTMLButtonElement>document.getElementById(NewTransaction.PayNowCashierButton);
        button.disabled = !(payer && payments);
        return (payer && payments);
      }
      return true;
    }

    UpdateTotals(): void
    {
      if (!this.IsCashier) return;

      this.TotalAmountPaid = 0;
      this.TotalAmountRemaining = 0;
      this.TotalChangeDue = 0;

      let TotalPaid = 0;
      if (this.CheckPayment.Validated) TotalPaid += this.CheckPayment.Amount;
      if (this.CashPayment.Validated) TotalPaid += this.CashPayment.Amount;
      if (this.CCData.Validated) TotalPaid += this.CCData.Amount;
      
      this.TotalAmountPaid = TotalPaid;
      this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
      if (this.TotalAmountDue - this.TotalAmountPaid < 0)
      {
        this.TotalChangeDue = this.TotalAmountPaid - this.TotalAmountDue;
      }
      this.UpdateForm();
    }

    UpdateForm()
    {
      Utilities.Set_Text(NewTransaction.TotalAmountDueMenu, Utilities.Format_Amount(this.TotalAmountDue));
      Utilities.Set_Text(NewTransaction.TotalAmountPaidMenu, Utilities.Format_Amount(this.TotalAmountPaid));
      Utilities.Set_Text(NewTransaction.TotalChangeDueMenu, Utilities.Format_Amount(this.TotalChangeDue));
      Utilities.Set_Text(NewTransaction.TotalAmountRemainingMenu, Utilities.Format_Amount(this.TotalAmountRemaining));
      let amount = this.TotalAmountRemaining.toFixed(2);
      if (!this.CCData.Validated) Utilities.Set_Value(CCPayment.AmountPaidInput, amount);
      if (!this.CheckPayment.Validated) Utilities.Set_Value(Payment.checkAmountInput, amount);
      if (!this.CashPayment.Validated) Utilities.Set_Value(Payment.cashAmountInput, amount);
    }

    public ValidatePayments(): boolean
    {
      if (this.IsCashier)
      {
        if (this.CashPayment.Validated && this.CashPayment.Amount > 0)
        {
          if (this.TotalChangeDue >= this.CashPayment.Amount)
          {
            Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
            return false;
          }
        }
        if (this.TotalChangeDue > 0 && (!this.CashPayment.Validated || this.CashPayment.Amount === 0))
        {
          Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.")
          return false;
        }
        if (this.TotalAmountRemaining > 0) return false;
      }
      return true;
    }

    public ValidatePayer(): boolean
    {
      this.ResetPayerData();
      this.PayerFirstName = Utilities.Validate_Text(NewTransaction.payerFirstName, NewTransaction.payerNameError, "The Firstname field is required.");
      if (this.PayerFirstName.length === 0) return false;

      this.PayerLastName = Utilities.Validate_Text(NewTransaction.payerLastName, NewTransaction.payerNameError, "The Lastname field is required.");
      if (this.PayerLastName.length === 0) return false;

      this.PayerPhoneNumber = Utilities.Validate_Text(NewTransaction.payerPhone, NewTransaction.payerPhoneError, "The Phone number field is required.");
      if (this.PayerPhoneNumber.length === 0) return false;
      if (this.PayerPhoneNumber.length < 10)
      {
        Utilities.Error_Show(NewTransaction.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
        let element = document.getElementById(NewTransaction.payerPhone);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return false;
      }

      this.PayerEmailAddress = Utilities.Get_Value(NewTransaction.payerEmail).trim();


      this.PayerCompanyName = Utilities.Get_Value(NewTransaction.payerCompany).trim();

      this.PayerStreetAddress = Utilities.Validate_Text(NewTransaction.payerStreet, NewTransaction.payerStreetError, "The street address field is required.");
      if (this.PayerStreetAddress.length === 0) return false;

      this.PayerCity = Utilities.Validate_Text(NewTransaction.payerCity, NewTransaction.payerCityError, "The City field is required.");
      if (this.PayerCity.length === 0) return false;
      this.PayerState = Utilities.Validate_Text(NewTransaction.payerState, NewTransaction.payerCityError, "The State field is required.");
      if (this.PayerState.length === 0) return false;
      this.PayerZip = Utilities.Validate_Text(NewTransaction.payerZip, NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
      if (this.PayerZip.length === 0) return false;
      if (this.PayerZip.length < 5)
      {
        Utilities.Error_Show(NewTransaction.payerCityError, "You must enter a Zip code of at least 5 digits.");
        let element = document.getElementById(NewTransaction.payerZip);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return false;
      }
      return true;
    }

    public ResetPayerForm():void
    {
      Utilities.Set_Value(NewTransaction.payerCity, "");
      Utilities.Set_Value(NewTransaction.payerCompany, "");
      Utilities.Set_Value(NewTransaction.payerFirstName, "");
      Utilities.Set_Value(NewTransaction.payerLastName, "");
      Utilities.Set_Value(NewTransaction.payerPhone, "");
      Utilities.Set_Value(NewTransaction.payerEmail, "");
      Utilities.Set_Value(NewTransaction.payerStreet, "");
      (<HTMLSelectElement>document.getElementById(NewTransaction.payerState)).selectedIndex = 0;
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

    Save(): void
    {
      if (!this.Validate) return;

      if (this.IsCashier)
      {
        Utilities.Toggle_Loading_Button(NewTransaction.PayNowCashierButton, true);
      }
      else
      {
        Utilities.Toggle_Loading_Button(NewTransaction.PayNowPublicButton, true);
      }

      this.ItemIds = clayPay.CurrentTransaction.Cart.map((c) =>
      {
        return c.ItemId;
      });

      this.Payments = [];

      let IsCashier = this.IsCashier;
      let toggleButton = IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
      let errorTarget = IsCashier ? ClientResponse.CashierErrorTarget : ClientResponse.PublicErrorTarget;
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      Utilities.Put<ClientResponse>(path + "API/Payments/Pay/", this)
        .then(function (cr)
        {
          if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
          {
            Utilities.Error_Show(errorTarget, cr.Errors);
          }
          else
          {
            
            clayPay.CurrentTransaction.ResetPayerForm();
            clayPay.CurrentTransaction.CCData.ResetForm();
            Payment.ResetAll();
            clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
            clayPay.UI.updateCart();
          }


          ClientResponse.HandleResponse(cr, true);
          Utilities.Toggle_Loading_Button(toggleButton, false);
          // need to reset the form and transaction / payment objects
        },
          function (e)
          {
            // We should show an error in the same spot we'd show a client response error.
            Utilities.Error_Show(errorTarget, e);
            Utilities.Toggle_Loading_Button(toggleButton, false);
          });
    }
  }
}