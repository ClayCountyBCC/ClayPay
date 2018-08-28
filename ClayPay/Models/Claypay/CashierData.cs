using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class CashierData
  {
    public UserAccess CurrentUser { get; set; }
    public int OTId { get; set; } = -1;
    public string CashierId { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.Now;
    public string PayerCompanyName { get; set; } = "";
    public string PayerName { get; set; } = "";
    public string PayerFirstName { get; set; } = ""; // Required
    public string PayerLastName { get; set; } = "";// Required
    public string PayerPhoneNumber { get; set; } = "";// Required
    public string PayerEmailAddress { get; set; } = "";
    public string ipAddress { get; set; } = "";
    public string PayerStreet1 { get; set; } = "";
    public string PayerStreet2 { get; set; } = "";
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
    public string UserName { get; set; } = "";
    public bool IsVoided { get; set; } = false;

    public CashierData()
    {
    }
    
    public static CashierData Get(string cashierid)
    {

      var param = new DynamicParameters();
      param.Add("@CashierId", cashierid);
      
      var query = @"
        USE WATSC;
        
        SELECT
          OTId,
          CashierId,
          TransDt TransactionDate,
          ISNULL(Name, '') PayerName,
          ISNULL(CoName, '') PayerCompanyName,
          ISNULL(Phone, '') PayerPhoneNumber,
          ISNULL(Addr1, '') PayerStreet1,
          ISNULL(Addr2, '') PayerStreet2,
          ISNULL(EmailAddress, '') PayerEmailAddress,
          NTUser UserName,
          IsVoided
        FROM ccCashier
        WHERE CashierId = @CashierId";

      return Constants.Get_Data<CashierData>(query, param).DefaultIfEmpty(new CashierData()).First();
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
#pragma warning disable CS0168 // Variable is declared but never used
        catch (FormatException fe)
#pragma warning restore CS0168 // Variable is declared but never used
        {
          errors.Add("The email address provided does not appear to be in a valid format.");
        }
      }
      if (PayerStreetAddress.Length == 0)
      {
        errors.Add("The Payer's Street Address must be provided.");
      }
      if (PayerZip.Length == 0)
      {
        errors.Add("The Payer's Zip Code must be provided.");
      }
      return errors;
    }
  }
}