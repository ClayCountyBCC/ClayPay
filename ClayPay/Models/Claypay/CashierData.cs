using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class CashierData
  {
    public UserAccess CurrentUser { get; set; }
    public int OTId { get; set; }
    public string CashierId { get; set; }
    
    public string PayerCompanyName { get; set; } = "";
    public string PayerFirstName { get; set; } = ""; // Required
    public string PayerLastName { get; set; } = "";// Required
    public string PayerPhoneNumber { get; set; } = "";// Required
    public string PayerEmailAddress { get; set; } = "";
    public string ipAddress { get; set; } = "";
    public string PayerStreet1 { get; set; }
    public string PayerStreet2 { get; set; }
    public string PayerStreetAddress { get; set; } = ""; // Required
    public string PayerAddress2 // Required, but this is a combination of City State, Zip
    {
      get
      {
        return PayerCity + " " + PayerState + ", " + PayerZip;
      }
    }
    public string PayerCity { get; set; } = "";// Required
    public string PayerState { get; set; } = "";// Required
    public string PayerZip { get; set; } = "";// Required

    public CashierData()
    {
      
    }

    public CashierData(string cashierId)
    {
      
    }

    public List<string> ValidatePayerData()
    {
      var errors = new List<string>();
      PayerCity = PayerCity.Trim();
      PayerFirstName = PayerFirstName.Trim();
      PayerLastName = PayerLastName.Trim();
      PayerCity = PayerCity.Trim();
      PayerState = PayerState.Trim();
      PayerZip = PayerZip.Trim();
      PayerPhoneNumber = PayerPhoneNumber.Trim();
      PayerEmailAddress = PayerEmailAddress.Trim();
      PayerCompanyName = PayerCompanyName.Trim();

      if (PayerFirstName.Length == 0)
      {
        errors.Add("The Payer's First name is a required field.");

      }
      if (PayerLastName.Length == 0)
      {
        errors.Add("The Payer's Last name is a required field.");

      }
      if (PayerPhoneNumber.Length == 0)
      {
        errors.Add("The Payer's phone number is a required field.");

      }
      if (PayerEmailAddress.Length > 0)
      {
        try
        {
          var email = new System.Net.Mail.MailAddress(PayerEmailAddress);
        }
        catch (FormatException fe)
        {
          errors.Add("The email address provided does not appear to be in a valid format.");

        }
      }
      if (PayerStreetAddress.Length == 0)
      {
        errors.Add("The Payer's Street Address must be provided.");

      }

      if (PayerCity.Length == 0)
      {
        errors.Add("The Payer's City must be provided.");
        
      }
      if (PayerState.Length == 0)
      {
        errors.Add("The Payer's State must be provided.");

      }
      if (PayerZip.Length == 0)
      {
        errors.Add("The Payer's Zip Code must be provided.");
      }
      return errors;
    }
  }
}