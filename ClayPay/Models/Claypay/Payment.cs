using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class Payment
  {

    //public string Info { get; set; }
    public enum payment_type_enum 
    {
      cash = 0,
      check = 1,
      credit_card = 2
      //impact_fee_credit,
      //impact_fee_exemption,
      //impact_waiver_school,
      //impact_waiver_road

    }

    public payment_type_enum PaymentType { get; set; }

    // This is to set the payment type string for inserting into db. Client does not need this.
    public string PaymentTypeString { get; set; } = "";
    public decimal Amount { get; set; }
    public decimal AmtTendered { get; set; }
    public decimal AmtApplied { get; set; }
    public string Info { get; set; }
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";

    public Payment()
    {
      SetPaymentTypeString();
      AmtApplied = Amount;
      AmtTendered = Amount;

    }
    
    public Payment(CCData ccpayment, UserAccess ua)
    {

      PaymentType = payment_type_enum.credit_card;
      AmtApplied = ccpayment.Total;
      AmtTendered = ccpayment.Total;
      TransactionId = ccpayment.TransactionId;
    }

    private void SetPaymentTypeString() // only used to enter payment type into payment row. Client does not need this data
    {
      if (PaymentTypeString == "")
      {
        switch (payType)
        {
          case payment_type_enum.credit_card:
            switch (Environment.MachineName.ToUpper())
            {
              case "CLAYBCCIIS01":
                PaymentTypeString = "cc_cashier";
                return;
              case "CLAYBCCDMZIIS01":
                PaymentTypeString = "cc_online";
                return;
              case "CLAYBCCDV10":
                PaymentTypeString = "cc_test";
                return;
            }
            PaymentTypeString = "credit_card";
            return;
          case payment_type_enum.check:
            PaymentTypeString = "CK";
            return;
          case payment_type_enum.cash:
            PaymentTypeString = "CA";     
            return;
          //case payment_type_enum.impact_fee_credit:
          //  return "IFCR";
          //case payment_type_enum.impact_fee_exemption:
          //  return "IFEX";
          //case payment_type_enum.impact_waiver_school:
          //  return "IFWS";
          //case payment_type_enum.impact_waiver_road:
          //  return "IFWR";
          default:
            PaymentTypeString = "";
            return;
        }
      }        



    }


  }
}