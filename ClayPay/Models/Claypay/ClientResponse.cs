using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {
    public CashierData ResponseCashierData { get; set; }
    public List<Charge> ChargeList { get; set; } = new List<Charge>();
    public List<ReceiptPayment> ReceiptPayments { get; set; }
    public List<string> Errors { get; set; } = new List<string>();

    // These two are used only when there is an issue saving payments AFTER 
    // the credit card was charged for the amount. Very Bad
    public string TransactionId { get; set; } = "";
    public List<string> PartialErrors { get; set; } = new List<string>();

    public ClientResponse(string cashierid, List<Charge> charges = null)
    {
      
      ResponseCashierData = ResponseCashierData.CashierId == "" ? 
                            CashierData.Get(cashierid) : ResponseCashierData;

      ChargeList = charges == null || charges.Count() == 0 ? 
                   Charge.GetChargesByCashierId(cashierid) : charges;

      ReceiptPayments = ReceiptPayment.Get(cashierid);

      var payments = new List<ReceiptPayment>();
      
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



  }
}