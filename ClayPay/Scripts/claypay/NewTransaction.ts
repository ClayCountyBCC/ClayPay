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
    TransactionCashierData: CashierData;
    IsCashier: boolean;
    TotalAmountDue: number;
    TotalAmountDueInt: number;
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
    public TransactionCashierData: CashierData = new CashierData();
    public IsCashier: boolean = false;    
    public CheckPayment: Payment = new Payment(payment_type.check);
    public CashPayment: Payment = new Payment(payment_type.cash);
    public TotalAmountDue: number = 0;
    public TotalAmountDueInt: number = 0;
    public TotalAmountPaid: number = 0;
    public TotalAmountPaidInt: number = 0;
    public TotalAmountRemaining: number = 0;
    public TotalAmountRemainingInt: number = 0;
    public TotalChangeDue: number = 0;
    public TotalChangeDueInt: number = 0;
    // Menu Ids
    public static TotalAmountPaidMenu = "cartTotalAmountPaid";
    public static TotalAmountDueMenu = "cartTotalAmountDue";
    public static TotalAmountRemainingMenu = "cartTotalAmountRemaining";
    public static TotalChangeDueMenu = "cartTotalChangeDue";


    public static PayNowCashierButton = "processPayments";
    public static PayNowPublicButton = "processCCPayment";

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
      let payer = this.TransactionCashierData.ValidatePayer();
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
      //console.log('values', this.TotalAmountDue, this.TotalAmountPaid, this.TotalAmountRemaining);
      if (this.IsCashier)
      {
        this.UpdateTotals();
        let payments = this.ValidatePayments();
        let button = <HTMLButtonElement>document.getElementById(NewTransaction.PayNowCashierButton);
        console.log('values', this);
        button.disabled = !(payer && payments);
        return (payer && payments);
      }
      return true;
    }

    UpdateTotals(): void
    {
      if (!this.IsCashier) return;

      this.TotalAmountPaid = 0;
      this.TotalAmountPaidInt = 0;
      this.TotalAmountRemaining = 0;
      this.TotalAmountRemainingInt = 0;
      this.TotalChangeDue = 0;
      this.TotalChangeDueInt = 0;

      let TotalPaid = 0;
      let TotalPaidInt = 0;
      if (this.CheckPayment.Validated)
      {
        TotalPaid += this.CheckPayment.Amount;
        TotalPaidInt += this.CheckPayment.AmountInt;
      }
      if (this.CashPayment.Validated)
      {
        TotalPaid += this.CashPayment.Amount;
        TotalPaidInt += this.CashPayment.AmountInt;
      }
      if (this.CCData.Validated)
      {
        TotalPaid += this.CCData.Amount;
        TotalPaidInt += this.CCData.AmountInt;
      }
      
      this.TotalAmountPaid = TotalPaid;
      this.TotalAmountPaidInt = TotalPaidInt;
      this.TotalAmountDueInt = parseInt((this.TotalAmountDue * 100).toString());

      this.TotalAmountRemaining = Math.max(this.TotalAmountDue - this.TotalAmountPaid, 0);
      this.TotalAmountRemainingInt = Math.max(this.TotalAmountDueInt - this.TotalAmountPaidInt, 0);

      if (this.TotalAmountDueInt - this.TotalAmountPaidInt < 0)
      {
        this.TotalChangeDue = this.TotalAmountPaid - this.TotalAmountDue;
        this.TotalChangeDueInt = parseInt((this.TotalChangeDue * 100).toString());
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
          if (this.TotalChangeDueInt >= this.CashPayment.AmountInt)
          {
            Utilities.Error_Show(NewTransaction.paymentError, "The Total Change due the customer cannot be more than or equal to the amount of Cash paid.");
            return false;
          }
        }
        if (this.TotalChangeDueInt > 0 && (!this.CashPayment.Validated || this.CashPayment.AmountInt === 0))
        {
          Utilities.Error_Show(NewTransaction.paymentError, "The Total Amount Paid cannot be greater than the Total Amount Due if no cash has been received.")
          return false;
        }
        if (this.TotalAmountRemainingInt > 0)
        {
          return false;
        }
          
      }
      return true;
    }

    CopyPayerData(): void
    {
      // this function is used when the user clicks the "This is the same as Payer Information"
      // checkbox in the credit card data.  It takes the information in that form and
      // updates the CCData with it and then the CCData object will update the CCData form.
      this.CCData.FirstName = this.TransactionCashierData.PayerFirstName;
      this.CCData.LastName = this.TransactionCashierData.PayerLastName;
      this.CCData.ZipCode = this.TransactionCashierData.PayerZip;
      // this.CCData.EmailAddress = this.TransactionCashierData.PayerEmailAddress;
      this.CCData.UpdatePayerData();
    }

    public Save = Utilities.Debounce(function ()
    {
      clayPay.CurrentTransaction.DebouncedSave();
    }, 1000, true);

    DebouncedSave():void
    {
      // Disable the button that was just used so that it can't be clicked multiple times.
      let loadingButton = this.IsCashier ? NewTransaction.PayNowCashierButton : NewTransaction.PayNowPublicButton;
      Utilities.Toggle_Loading_Button(loadingButton, true);

      if (!this.Validate())
      {
        Utilities.Toggle_Loading_Button(loadingButton, false);
        return;
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
      Utilities.Post<ClientResponse>(path + "API/Payments/Pay/", this)
        .then(function (cr)
        {
          if (cr.Errors.length > 0) // Errors occurred, payment was unsuccessful.
          {
            Utilities.Error_Show(errorTarget, cr.Errors);
          }
          else
          {
            if (clayPay.CurrentTransaction.IsCashier) Payment.ResetAll();
            clayPay.CurrentTransaction.TransactionCashierData.ResetPayerForm();
            clayPay.CurrentTransaction = new NewTransaction(); // this will reset the entire object back to default.
            clayPay.CurrentTransaction.CCData.ResetForm();
            clayPay.UI.updateCart();
            ClientResponse.ShowPaymentReceipt(cr, ClientResponse.PaymentReceiptContainer);
          }
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