using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models
{
  public class CCData
  {
    public string FirstName { get; set; }
    public string LastName { get; set; }
    public string CardNumber { get; set; }
    public string CardType { get; set; }
    public string ExpMonth { get; set; }
    public string ExpYear { get; set; }
    public string CVVNumber { get; set; }
    public string ZipCode { get; set; }
    public decimal Total { get; set; }
    public string EmailAddress { get; set; }
    public List<int> ItemIds { get; set; } = new List<int>();

    public readonly static string[] CardTypes = { "MASTERCARD", "VISA", "DISCOVER", "AMEX" };

    // this function validates the data we get from the client.
    // it also cleans it up a bit.
    // it returns an error string if anything that's required isn't present,
    // and no error if everything is present and seeming valid.
    // the error returned should contain all errors that were detected.
    public List<string> Validate(List<Charge> charges)
    {
      List<string> e = new List<string>();
      try
      {

        var dbTotal = (from c in charges select c.Total).Sum();

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
        // Payment amount validiation
        if (Total <= 0)
        {
          e.Add("Payment amount must be greater than 0.\n");
        }
        if (Total != dbTotal)
        {
          e.Add("The total for this transaction has changed.  Please check the charges and try again.");
        }
        if (ActiveTransactions.AnyExists(this.ItemIds))
        {
          e.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
        }
        // this is the last thing we'll validate.  If this doesn't fail then we'll be able
        // to start sending data.
        if (e.Count == 0)
        {
          if (!ActiveTransactions.Start(this.ItemIds))
          {
            e.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
          }
        }
        // if e has a length, it's an error.        
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        this.UnlockIds();
        e.Add("Error in validation, unable to continue.");
      }
      return e;
    }

    public void UnlockIds()
    {
      ActiveTransactions.Finish(this.ItemIds);
    }

    public List<string> GetAssocKeys()
    {

      string query = @"
        SELECT DISTINCT LTRIM(RTRIM(AssocKey)) AS AssocKey FROM ccCashierItem
        WHERE ItemId IN @ids;";
      return Constants.Get_Data<string>(query, ItemIds);
    }

  }
}