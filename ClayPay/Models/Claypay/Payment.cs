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
      check,
      cash,
      credit_card
      //impact_fee_credit,
      //impact_fee_exemption,
      //impact_waiver_school,
      //impact_waiver_road

    }

    public payment_type_enum PaymentType { get; set; } = 0;

    // This is to set the payment type string for inserting into db. Client does not need this.
    public string PaymentTypeString { get; set; } = "";
    public decimal Amount { get; set; }
    public decimal AmtTendered { get; set; }
    public decimal AmtApplied { get; set; }
    public string Info { get; set; }
    public string CkNo { get; set; } = "";
    public string TransactionId { get; set; } = "";

    public Payment()
    {
      SetPaymentTypeString();
      AmtApplied = Amount;
      AmtTendered = Amount;

    }
    
    public Payment(CCData ccpayment, UserAccess ua)
    {
      if (ua.authenticated == false)
      {
        PaymentType = payment_type_enum.credit_card;
      }
      else
      {
        PaymentTypeString = ccpayment.CardType.ToUpper();
      }

      AmtApplied = ccpayment.Total;
      AmtTendered = ccpayment.Total;
      TransactionId = ccpayment.TransactionId;
    }

    private string SetPaymentTypeString() // only used to enter payment type into payment row. Client does not need this data
    {
      if (this.PaymentTypeString == "")
      {
        switch (PaymentType)
        {
          case payment_type_enum.credit_card:
            switch (Environment.MachineName.ToUpper())
            {
              case "CLAYBCCIIS01":
                return "cc_cashier";
              case "CLAYBCCDMZIIS01":
                return "cc_online";
              case "CLAYBCCDV10":
                return "cc_test";
            }
            return "credit_card";
          case payment_type_enum.check:
            return "CK";
          case payment_type_enum.cash:
            return "CA";            
          //case payment_type_enum.impact_fee_credit:
          //  return "IFCR";
          //case payment_type_enum.impact_fee_exemption:
          //  return "IFEX";
          //case payment_type_enum.impact_waiver_school:
          //  return "IFWS";
          //case payment_type_enum.impact_waiver_road:
          //  return "IFWR";
          default:
            return "";

        }
      }        

      return this.PaymentTypeString;

    }


  }
}