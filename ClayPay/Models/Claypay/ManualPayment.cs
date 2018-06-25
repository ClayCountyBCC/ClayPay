using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class ManualPayment
  {
    public string PaymentType { get; set; }
    public decimal Amount { get; set; }
    public long CheckNumber { get; set; }
    //public string Info { get; set; }


    public ManualPayment(decimal amount, string paymentType, long checkNumber = -1)
    {
      this.PaymentType = paymentType;
      this.Amount = amount;
      this.CheckNumber = checkNumber;
    }
    
    public static string Save(List<ManualPayment> manualPayments)
    {
      
      var error = "";

      try
      {
        var pr = new PaymentResponse(null, manualPayments);
        foreach(var payment in manualPayments)
        {
          PaymentResponse.Save(null, null, payment);
        }
      }catch(Exception ex)
      {
        Constants.Log(ex);
      }

      return error;
    }
  }
}