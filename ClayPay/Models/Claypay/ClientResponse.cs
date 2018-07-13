using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {

    public string TimeStamp { get; set; } = DateTime.Now.ToString();
    public string CashierId { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public List<string> Errors { get; set; }
    public List<string> PartialErrors { get; set; }
    public decimal AmountPaid { get; set; }
    public decimal ChangeDue { get; set; } // only applicable in Cash payments.

    public ClientResponse(string cashierid, string transId, List<string> err, List<string> partErr, decimal AmtApplied)
    {
      CashierId = cashierid;
      TransactionId = transId;
      Errors = err;
      PartialErrors = partErr;
      AmountPaid = AmtApplied;
    }

  }
}