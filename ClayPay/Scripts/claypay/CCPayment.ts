namespace clayPay
{

  interface ICCPayment
  {
    FirstName: string;
    LastName: string;
    CardNumber: string;
    CardType: string;
    ExpMonth: string;
    ExpYear: string;
    CVVNumber: string;
    ZipCode: string;
    Total: number;
    EmailAddress: string;

    Validate(): Array<string>;
  }
  

  export class CCPayment implements ICCPayment
  {
    public FirstName: string;
    public LastName: string;
    public CardNumber: string;
    public CardType: string;
    public ExpMonth: string;
    public ExpYear: string;
    public CVVNumber: string;
    public ZipCode: string;
    public EmailAddress: string;
    public Total: number;

    static FirstNameInput: string = "creditCardFirstName";
    static LastNameInput: string = "creditCardLastName";
    static ZipCodeInput: string = "creditCardZip";
    static EmailAddressInput: string = "creditCardEmailAddress";
    static ccNumberInput: string = "creditCardNumber";
    static ccTypeSelect: string = "creditCardType";
    static ccMonthSelect: string = "creditCardMonth";
    static ccYearSelect: string = "creditCardYear";
    static ccCVCInput: string = "creditCardCVV";
    static AmountPaidInput: string = "creditCardPaymentAmount";

    constructor()
    {

    }

    public UpdatePayerData(): void
    {
      Utilities.Set_Value(CCPayment.FirstNameInput, this.FirstName);
      Utilities.Set_Value(CCPayment.LastNameInput, this.LastName);
      Utilities.Set_Value(CCPayment.EmailAddressInput, this.EmailAddress);
      Utilities.Set_Value(CCPayment.ZipCodeInput, this.ZipCode);
    }

    public UpdateTotal(): void
    {
      Utilities.Set_Value(CCPayment.AmountPaidInput, this.Total.toFixed(2));
    }

    Validate(): Array<string>
    {
      let errors: Array<string> = [];

      this.FirstName = this.FirstName.trim();
      if (this.FirstName.length === 0)
      {
        errors.push('You must enter a First Name.');
      }

      this.LastName = this.LastName.trim();
      if (this.LastName.length === 0)
      {
        errors.push('You must enter a Last Name.');
      }

      this.CardNumber = this.CardNumber.trim();
      if (this.CardNumber.length === 0)
      {
        errors.push('You must enter a Card number.');
      }

      this.CVVNumber = this.CVVNumber.trim();
      if (this.CVVNumber.length === 0)
      {
        errors.push('You must enter a CVC number.');
      }

      this.ZipCode = this.ZipCode.trim();
      if (this.ZipCode.length === 0)
      {
        errors.push('You must enter a Zip Code.');
      }

      this.EmailAddress = this.EmailAddress.trim();
      if (this.EmailAddress.length === 0)
      {
        errors.push('You must enter an Email Address.');
      }

      // let's make sure there are some items
      //if (this.ItemIds === null || this.ItemIds.length === 0)
      //{
      //  errors.push('No items were found in the cart.  Please check this and try again.');
      //}

      // check the card type is one of the 4 we care about
      let cardTypes: Array<string> = ['AMEX', 'DISCOVER', 'MASTERCARD', 'VISA'];
      if (cardTypes.indexOf(this.CardType) === -1)
      {
        errors.push('An invalid Credit Card Type has been selected.');
      }

      // check the month/year expirations
      if (UI.ExpMonths.indexOf(this.ExpMonth) === -1)
      {
        errors.push('An invalid Expiration Month has been selected.')
      }
      if (UI.ExpYears.indexOf(this.ExpYear) === -1)
      {
        errors.push('An invalid Expiration Year has been selected.')
      }
      if (UI.ExpMonths.indexOf(this.ExpMonth) !== -1 &&
        UI.ExpYears.indexOf(this.ExpYear) !== -1)
      {
        let year: number = parseInt(this.ExpYear);
        let month: number = parseInt(this.ExpMonth);
        let expD = new Date(year, month - 1, 1);// subtracting 1 from month because Date's month is Base 0
        
        let tmpD = new Date();
        let thisMonth = new Date(tmpD.getFullYear(), tmpD.getMonth(), 1);        
        if (expD < thisMonth)
        {
          errors.push('The expiration date entered has passed.  Please check it and try again.');
        }
      }
      return errors;
    }

    //Save(): Promise<string>
    //{
    //  let ccd = this;
    //  return new Promise(function (resolve, reject)
    //  {
    //    if (ccd.Validate().length > 0)
    //    {
    //      return reject(false);
    //    }
    //    else
    //    {
    //      // do actual save stuff here        
    //      var x = XHR.Put("./API/Pay", JSON.stringify(ccd));
    //      x.then(function (response: XHR.Data)
    //      {
    //        // decide what happens when the payment is successful.
    //        return resolve(response.Text);
    //      },
    //        function (e: XHR.Data)
    //        {              
    //          if (e.Text.toLowerCase().indexOf("message"))
    //          {
    //            return reject(JSON.parse(e.Text).Message);
    //          }
    //          else
    //          {
    //            return reject(e.Text);
    //          }               
    //        });
    //    }
    //  })
    //}    

  }
}