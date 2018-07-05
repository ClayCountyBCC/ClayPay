using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class Payment
  {

    //public string Info { get; set; }
    public enum payment_type_enum : int
    {
      none,
      check,
      cash,
      visa,
      mastercard,
      amex,
      discover,
      cc_online,
      impact_fee_credit,
      impact_fee_exemption,
      impact_waiver_school,
      impact_waiver_road
    }

    public payment_type_enum PaymentType { get; set; }

    // This is to set the payment type string for inserting into db. Client does not need this.
    private string PaymentTypeString { get; set; }

    public decimal Amount { get; set; }
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";

    public Payment()
    {
      SetPaymentTypeString();
    }
    
    public Payment(CCData ccpayment, UserAccess ua)
    {
      if (ua.authenticated == false)
      {
        PaymentType = payment_type_enum.cc_online;
      }
      else
      {
        PaymentTypeString = ccpayment.CardType.ToUpper();
      }

      Amount = ccpayment.Total;
      TransactionId = ccpayment.TransactionId;
    }    
    
    private string SetPaymentTypeString() // only used to enter payment type into payment row. Client does not need this data
    {
      switch (PaymentType)
      {
        case payment_type_enum.check:
          return "CK";
        case payment_type_enum.cash:
          return "CA";
        case payment_type_enum.visa:
          return "VISA";
        case payment_type_enum.mastercard:
          return "MC";
        case payment_type_enum.amex:
          return "AMEX";
        case payment_type_enum.discover:
          return "DISC";
        case payment_type_enum.cc_online:
          return "CC Online";
        case payment_type_enum.impact_fee_credit:
          return "IFCR";
        case payment_type_enum.impact_fee_exemption:
          return "IFEX";
        case payment_type_enum.impact_waiver_school:
          return "IFWS";
        case payment_type_enum.impact_waiver_road:
          return "IFWR";
        default:
          return "";

      }
    }

    public string GetPaymentTypeString()
    {
      return PaymentTypeString;
    }


  }
}