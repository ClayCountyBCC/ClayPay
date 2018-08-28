namespace clayPay
{
  interface ICashierData
  {
    PayerName: string;
    PayerFirstName: string;
    PayerLastName: string;
    PayerPhoneNumber: string;
    PayerEmailAddress: string;
    PayerCompanyName: string;
    PayerStreetAddress: string;
    PayerStreet1: string;
    PayerStreet2: string;
    PayerCity: string;
    PayerState: string;
    PayerZip: string;
    UserName: string;
    TransactionDate: Date;
    IsVoided: boolean;
  }

  export class CashierData implements ICashierData
  {
    public PayerFirstName: string = "";
    public PayerLastName: string = "";
    public PayerName: string = "";
    public PayerPhoneNumber: string = "";
    public PayerEmailAddress: string = "";
    public PayerCompanyName: string = "";
    public PayerStreetAddress: string = "";
    public PayerStreet1: string = "";
    public PayerStreet2: string = "";
    public PayerCity: string = "";
    public PayerState: string = "";
    public PayerZip: string = "";
    public UserName: string = "";
    public TransactionDate: Date = new Date();
    public IsVoided: boolean = false;
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

    public ValidatePayer(): boolean
    {
      this.ResetPayerData();
      this.PayerFirstName = Utilities.Validate_Text(CashierData.payerFirstName, CashierData.payerNameError, "The Firstname field is required.");
      if (this.PayerFirstName.length === 0) return false;

      this.PayerLastName = Utilities.Validate_Text(CashierData.payerLastName, CashierData.payerNameError, "The Lastname field is required.");
      if (this.PayerLastName.length === 0) return false;

      this.PayerPhoneNumber = Utilities.Validate_Text(CashierData.payerPhone, CashierData.payerPhoneError, "The Phone number field is required.");
      if (this.PayerPhoneNumber.length === 0) return false;
      if (this.PayerPhoneNumber.length < 10)
      {
        Utilities.Error_Show(CashierData.payerPhoneError, "The Phone Number should include area code and a 7 digit number.");
        let element = document.getElementById(CashierData.payerPhone);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return false;
      }

      this.PayerEmailAddress = Utilities.Get_Value(CashierData.payerEmail).trim();


      this.PayerCompanyName = Utilities.Get_Value(CashierData.payerCompany).trim();

      this.PayerStreetAddress = Utilities.Validate_Text(CashierData.payerStreet, CashierData.payerStreetError, "The street address field is required.");
      if (this.PayerStreetAddress.length === 0) return false;
      this.PayerCity = this.PayerState = Utilities.Get_Value(CashierData.payerCity).trim();
      this.PayerState = Utilities.Get_Value(CashierData.payerState).trim();
      this.PayerZip = Utilities.Validate_Text(CashierData.payerZip, CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
      if (this.PayerZip.length === 0) return false;
      if (this.PayerZip.length < 5)
      {
        Utilities.Error_Show(CashierData.payerCityError, "You must enter a Zip code of at least 5 digits.");
        let element = document.getElementById(CashierData.payerZip);
        element.classList.add("is-danger");
        element.focus();
        element.scrollTo();
        return false;
      }
      return true;
    }

    public ResetPayerForm(): void
    {
      Utilities.Set_Value(CashierData.payerCity, "");
      Utilities.Set_Value(CashierData.payerCompany, "");
      Utilities.Set_Value(CashierData.payerFirstName, "");
      Utilities.Set_Value(CashierData.payerLastName, "");
      Utilities.Set_Value(CashierData.payerPhone, "");
      Utilities.Set_Value(CashierData.payerEmail, "");
      Utilities.Set_Value(CashierData.payerStreet, "");
      (<HTMLSelectElement>document.getElementById(CashierData.payerState)).selectedIndex = 0;
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