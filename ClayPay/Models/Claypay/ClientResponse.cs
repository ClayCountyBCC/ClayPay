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
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> PartialErrors { get; set; } = new List<string>();
    public decimal AmountPaid { get; set; } = 0;
    private decimal ConvenienceFeeAmount { get; set; } = 0;
    public decimal ChangeDue { get; set; } = 0; // only applicable in Cash payments.

    public ClientResponse(string cashierid, string transId, List<string> partErr, decimal AmtApplied, decimal change, decimal convFeeAmount = 0)
    {
      CashierId = cashierid;
      TransactionId = transId;
      PartialErrors = partErr;
      AmountPaid = AmtApplied;
      ChangeDue = change;
      ConvenienceFeeAmount = convFeeAmount;
    }

    // If you've got any errors, you won't need anything else.
    public ClientResponse(List<string> errors)
    {
      Errors = errors;
    }

  }
}