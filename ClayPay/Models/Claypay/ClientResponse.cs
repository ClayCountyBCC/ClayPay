using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {

    public string TimeStamp { get; set; } = "";
    public string CashierId { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public List<string> Errors { get; set; }
    public List<string> PartialErrors { get; set; }
    public decimal AmountPaid { get; set; }

    public ClientResponse(DateTime datetime, string cashierid, string transId, List<string> err, List<string> partErr, decimal AmtApplied)
    {
      TimeStamp = datetime.ToString();
      CashierId = cashierid;
      TransactionId = transId;
      Errors = err;
      PartialErrors = partErr;
      AmountPaid = AmtApplied;
    }

  }
}