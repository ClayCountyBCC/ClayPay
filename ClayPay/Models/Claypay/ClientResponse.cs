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
      Constants.SaveEmail(EmailAddress, "Clay County Payment Receipt", BuildEmailBody());
    }

    private string BuildEmailBody()
    {
      var sb = new StringBuilder();
      sb.Append(CustomerEmailHeaderString());
      sb.Append(CustomerEmailChargesString());
      sb.Append(CustomerEmailPaymentsString());
      return sb.ToString();
    }

    public string CustomerEmailHeaderString()
    {
      var header = new StringBuilder();
      header.AppendFormat("{0,-40} {1,50}", ResponseCashierData.PayerName,ResponseCashierData.TransactionDate.ToString()).AppendLine()
           .Append(ResponseCashierData.PayerEmailAddress).AppendLine()
           .Append(ResponseCashierData.PayerCompanyName).AppendLine()
           .Append(ResponseCashierData.PayerStreet1).AppendLine()
           .Append(ResponseCashierData.PayerStreet2)
           .AppendLine()
           .AppendLine();
      return header.ToString();
    }

    public string CustomerEmailChargesString()
    {

      var cs = new StringBuilder();
      cs.AppendFormat("{0,-36} {1,-70} {2,12}", "Key", "Description", "Amount")
      .AppendLine()
      .AppendFormat("{0,-32} {1,-60} {2,16}", "-------------", "---------------------------------", "-----------")
      .AppendLine();

      foreach (var c in Charges)
      {
        cs.AppendFormat("{0,-31} {1,-41} {2,30}", c.AssocKey, c.Description , c.TotalDisplay)
        .AppendLine();
      }

      return cs.ToString();

    }

    public string CustomerEmailPaymentsString()
    {

      var ps = new StringBuilder();

      ps.AppendLine()
        .AppendLine()
        .AppendFormat("{0,45} {1,52}\n", "CheckNumber/", "Convenience")
        .AppendFormat("{0,-15} {1,-25} {2,-12} {3,21}\n", "Payment Type", "Transaction ID", "Amount", "Fee(cc only)")
        .AppendFormat("{0,-20} {1,-29} {2,-15} {3,23}\n", "------------------", "-----------------", "-----------", "----------------");

      foreach (var p in ReceiptPayments)
      {
        ps.AppendFormat("{0,-26} {1,-42} {2,-25:$#.00} {3,12:$#.00}", p.PaymentTypeDescription, p.TransactionId, p.AmountApplied, p.ConvenienceFeeAmount)
        .AppendLine();
      }
      return ps.ToString();

    }
  }
}
