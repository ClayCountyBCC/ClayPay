using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class Payment
  {
    
    public string PaymentType { get; set; }
    public decimal Amount { get; set; }
    public long CheckNumber { get; set; }
    public string TransactionId { get; set; }

    //public string Info { get; set; }


    public Payment()
    {
      
    }
  }
}