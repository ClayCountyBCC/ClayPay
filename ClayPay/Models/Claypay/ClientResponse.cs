using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;

using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {
    public CashierData ResponseCashierData { get; set; }
    public List<Charge> Charges { get; set; } = new List<Charge>();
    public List<ReceiptPayment> ReceiptPayments { get; set; }
    public bool IsEditable { get; set; } = false;
    public List<string> Errors { get; set; } = new List<string>();

    // These two are used only when there is an issue saving payments AFTER 
    // the credit card was charged for the amount. Very Bad
    public string TransactionId { get; set; } = "";
    public List<string> PartialErrors { get; set; } = new List<string>();

    public ClientResponse(string cashierid, List<Charge> charges)
    {
      ResponseCashierData = CashierData.Get(cashierid);
      Charges = charges;
      ReceiptPayments = ReceiptPayment.Get(cashierid);

    }

    public ClientResponse(string cashierid)
    {
      ResponseCashierData = CashierData.Get(cashierid);
      if (ResponseCashierData.CashierId != cashierid)
      {
        Errors.Add($"CashierId: {cashierid} was not found.");
        return;
      }
      Charges = Charge.GetChargesByCashierId(cashierid);
      ReceiptPayments = ReceiptPayment.Get(cashierid);
    }

    public ClientResponse(List<string> errors)
    {
      Errors = errors;
    }

    public ClientResponse(List<string> partialErrors, string transId)
    {
      TransactionId = transId;
      PartialErrors = partialErrors;
    }


    public void SendPayerEmailReceipt(string EmailAddress)
    {
      if (EmailAddress.Length == 0) return;

      int i = 0;
    }

    private string BuildEmailBody()
    {
      var emailBody = "";
      emailBody += CustomerEmailHeaderString();
      emailBody += CustomerEmailChargesString();
      emailBody += CustomerEmailPaymentsString();
      return emailBody;
    }

    public string CustomerEmailHeaderString()
    {
      var header = new StringBuilder();
      header.Append(ResponseCashierData.PayerName).Append("\t\t\t").Append(ResponseCashierData.TransactionDate.ToString()).AppendLine()
           .Append(ResponseCashierData.PayerEmailAddress).AppendLine()
           .Append(ResponseCashierData.PayerCompanyName).AppendLine()
           .Append(ResponseCashierData.PayerStreetAddress).AppendLine()
           .Append(ResponseCashierData.PayerStreet2).AppendLine()
           .AppendLine()
           .AppendLine();
      return header.ToString();
    }

    public string CustomerEmailChargesString()
    {

      var cs = new StringBuilder();
      cs.Append("Key\t\tDescription\tAmount");
      foreach (var c in Charges)
      {
        cs.Append(c.AssocKey).
        Append("\t")
        .Append(c.Description)
        .Append("\t")
        .Append(c.TotalDisplay)
        .AppendLine();
      }

      return cs.ToString();

    }

    public string CustomerEmailPaymentsString()
    {

      var ps = new StringBuilder();

      ps.AppendLine()
          .Append("\t\tCheck Number\n")
          .Append("Payment Type\tTransaction ID\tAmount\tConvenience Fee(cc only)\n");

      foreach (var p in ReceiptPayments)
      {
        ps.Append(p.PaymentTypeDescription)
        .Append("\t")
        .Append(p.CheckNumber + p.TransactionId)
        .Append("\t\t")
        .Append(p.AmountApplied)
        .Append("\t")
        .Append(p.ConvenienceFeeAmount)
        .AppendLine();
      }
      return ps.ToString();

    }
  }
}