using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models
{
  public class CCPayment
  {
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public string CardNumber { get; set; } = "";
    public string CardType { get; set; } = "";
    public string ExpMonth { get; set; } = "";
    public string ExpYear { get; set; } = "";
    public string CVVNumber { get; set; } = "";
    public string ZipCode { get; set; } = "";
    public decimal Amount { get; set; } = 0;
    public string EmailAddress { get; set; } = "";
    //public string IPAddress { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public bool Validated { get; set; } = false;

    public readonly static string[] CardTypes = { "MASTERCARD", "VISA", "DISCOVER", "AMEX" };

    // this function validates the data we get from the client.
    // it also cleans it up a bit.
    // it returns an error string if anything that's required isn't present,
    // and no error if everything is present and seeming valid.
    // the error returned should contain all errors that were detected.
    public List<string> Validate()
    {
      
      List<string> e = new List<string>();
      if(this.Amount == 0)
      {
        Validated = false;
        return e;
      }
      try
      {
        // We'll start by cleaning up the data that they can key in, 
        // removing extraneous whitespace.
        FirstName = FirstName.Trim();
        LastName = LastName.Trim();
        ExpMonth = ExpMonth.Trim();
        ExpYear = ExpYear.Trim();
        CVVNumber = CVVNumber.Trim();
        ZipCode = ZipCode.Trim();
        CardType = CardType.Trim();
        // Here we make sure everything that's required actually has a value.
        if (FirstName.Length == 0 || LastName.Length == 0 || CardNumber.Length == 0 ||
          CardType.Length == 0 || ExpMonth.Length == 0 || ExpYear.Length == 0 ||
          CVVNumber.Length == 0 || ZipCode.Length == 0)
        {
          e.Add("Missing a required value.\n");
        }
        // FirstName, LastName, Cardnumber, CVV, and Zipcode 
        // are validated just by having a value.
        if (!CardTypes.Contains(CardType))
        {
          e.Add("Card type is invalid.\n");
        }
        // Expiration Month Validation
        if (int.TryParse(ExpMonth, out int IExpMonth))
        {
          if (IExpMonth > 12 || IExpMonth < 1)
          {
            e.Add("Expiration Month is invalid.\n");
          }
        }
        else
        {
          e.Add("Expiration Month is not a number.\n");
        }
        // Expiration Year validation
        if (int.TryParse(ExpYear, out int IExpYear))
        {
          if (IExpYear < DateTime.Now.Year || IExpYear > DateTime.Now.AddYears(10).Year)
          {
            e.Add("Expiration Year is invalid.\n");
          }
        }
        else
        {
          e.Add("Expiration Year is not a number.\n");
        }
        
      }
      catch (Exception ex)
      {
        Constants.Log(ex);

        e.Add("Error in credit card validation, unable to continue.");
      }
      // if e has a length, it's an error.        
      return e;
    }

  }
}