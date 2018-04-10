namespace clayPay
{

  interface ICCData
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
    ItemIds: Array<number>;

    Validate(): Array<string>;

    Save(): Promise<string>;
  }
  

  export class CCData implements ICCData
  {
    constructor(
      public FirstName: string,
      public LastName: string,
      public CardNumber: string,
      public CardType: string,
      public ExpMonth: string,
      public ExpYear: string,
      public CVVNumber: string,
      public ZipCode: string,
      public EmailAddress: string,
      public Total: number,
      public ItemIds: Array<number>
    )
    {

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
      if (this.ItemIds === null || this.ItemIds.length === 0)
      {
        errors.push('No items were found in the cart.  Please check this and try again.');
      }

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

    Save(): Promise<string>
    {
      let ccd = this;
      return new Promise(function (resolve, reject)
      {
        if (ccd.Validate().length > 0)
        {
          return reject(false);
        }
        else
        {
          // do actual save stuff here        
          var x = XHR.Put("./API/Pay", JSON.stringify(ccd));
          x.then(function (response: XHR.Data)
          {
            // decide what happens when the payment is successful.
            return resolve(response.Text);
          },
            function (e: XHR.Data)
            {              
              if (e.Text.toLowerCase().indexOf("message"))
              {
                return reject(JSON.parse(e.Text).Message);
              }
              else
              {
                return reject(e.Text);
              }               
            });
        }
      })
    }    

  }
}