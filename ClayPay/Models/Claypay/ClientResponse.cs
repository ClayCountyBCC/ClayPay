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

    public ClientResponse(DateTime datetime, string cId, string transId, List<string> err)
    {
      TimeStamp = datetime.ToString();
      CashierId = cId;
      TransactionId = transId;
      Errors = err;
    }

  }
}