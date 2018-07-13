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
    public string PaymentTypeString
    {
      get
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
            }
            return "cc_test";
          case payment_type_enum.check:
            return "CK";
          case payment_type_enum.cash:
            return "CA";
          //case payment_type_enum.impact_fee_credit:
          //  return "IF_credit";
          //case payment_type_enum.impact_fee_exemption:
          //  return "IF_exemption";
          //case payment_type_enum.impact_waiver_school:
          //  return "IF_waiver_school";
          //case payment_type_enum.impact_waiver_road:
          //  return "IF_waiver_road";
          default:
            return "";
        }
      }
    }
    public decimal Amount { get; set; }
    public decimal AmtTendered
    {
      get
      {
        return Amount;
      }

    }
    public decimal AmtApplied { get; set; }
    public string Info { get; set; }
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public bool Validated { get; set; } = false;

    public Payment()
    { 
    }

    public Payment(CCPayment ccpayment, UserAccess ua)
    {

      PaymentType = payment_type_enum.credit_card;

      TransactionId = ccpayment.TransactionId;
    }

    //public string SetPaymentTypeString() // only used to enter payment type into payment row. Client does not need this data
    //{
    //  if (PaymentTypeString == "")
    //  {
    //    switch (PaymentType)
    //    {
    //      case payment_type_enum.credit_card:
    //        switch (Environment.MachineName.ToUpper())
    //        {
    //          case "CLAYBCCIIS01":
    //            return"cc_cashier";
    //          case "CLAYBCCDMZIIS01":
    //            return "cc_online";
    //        }
    //        return "cc_test";
    //      case payment_type_enum.check:
    //        return "CK";
    //      case payment_type_enum.cash:
    //        return "CA";
    //      //case payment_type_enum.impact_fee_credit:
    //      //  return "IFCR";
    //      //case payment_type_enum.impact_fee_exemption:
    //      //  return "IFEX";
    //      //case payment_type_enum.impact_waiver_school:
    //      //  return "IFWS";
    //      //case payment_type_enum.impact_waiver_road:
    //      //  return "IFWR";
    //      default:
    //      return "";
    //    }
       
    //  }
    //  else
    //  {
    //     return PaymentTypeString;
    //  }
    //}
  }

}