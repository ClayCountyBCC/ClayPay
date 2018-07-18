using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class Payment
  {

    //public string Info { get; set; }
    public enum payment_type
    {
      cash = 0,
      check = 1,
      credit_card_public = 2,
      impact_fee_credit = 3,
      impact_fee_exemption = 4,
      impact_waiver_school = 5,
      impact_waiver_road = 6,
      credit_card_cashier = 7
    }

    public payment_type PaymentType { get; set; }
    // This is to set the payment type string for inserting into db. Client does not need this.
    public string PaymentTypeValue
    {
      get
      {
        switch (PaymentType)
        {
          case payment_type.credit_card_cashier:
            return "cc_cashier";
          case payment_type.credit_card_public:
            return "cc_online";

          //case payment_type.credit_card:
          //  switch (Environment.MachineName.ToUpper())
          //  {
          //    case "CLAYBCCIIS01":
          //      return "cc_cashier";
          //    case "CLAYBCCDMZIIS01":
          //      return "cc_online";
          //  }
          //  return "cc_test";
          case payment_type.check:
            return "CK";
          case payment_type.cash:
            return "CA";
          case payment_type.impact_fee_credit:
            return "IFCR";
          case payment_type.impact_fee_exemption:
            return "IFEX";
          case payment_type.impact_waiver_school:
            return "IFWS";
          case payment_type.impact_waiver_road:
            return "IFWR";
          default:
            return ""; // this should not ever be the case.
        }
      }
    }
    public string PaymentTypeDisplayString
    {
      get
      {
        switch (PaymentType)
        {
          case payment_type.credit_card_cashier:
          case payment_type.credit_card_public:
            return "cc_online";

          case payment_type.check:
            return "Check";
          case payment_type.cash:
            return "Cash";
          case payment_type.impact_fee_credit:
            return "Impact Fee Credit";
          case payment_type.impact_fee_exemption:
            return "Impact Fee Exemption";
          case payment_type.impact_waiver_school:
            return "School Impact Fee Waiver";
          case payment_type.impact_waiver_road:
            return "Road Impact Fee Waiver";
          default:
            return ""; // this should not ever be the case.
        }
      }
    }
    public decimal Amount { get; set; }
    public decimal AmountTendered
    {
      get
      {
        return Amount;
      }
    }
    public decimal AmountApplied { get; set; } = 0;
    public string Info { get; set; } = "";
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public bool Validated { get; set; } = false;
    public string Error { get; set; } = "";

    public Payment()
    {

    }

    public Payment(payment_type pt)
    {
      this.PaymentType = pt;
    }   

    public Payment(CCPayment ccpayment, payment_type pt)
    {
      PaymentType = pt;
      Amount = ccpayment.Amount;
      AmountApplied = Amount;
      TransactionId = ccpayment.TransactionId;
    }

    public bool Validate()
    {
      // this function is going to return true/false based
      // on if the data in this object confirms to the given payment type
      // if we find an error, we'll update the Error string with information
      // about the error.
      // This function is based on using the Validated property which is
      // populated by the client.  So if this object is not validated, 
      // we should just return false.
      // We will not be updating the Validated property as that is meant to be an indicator
      // from the client to the backend to mean that this payment type should be processed.
      if (Amount == 0) this.Validated = false;
      if (!this.Validated || Amount == 0) return false;
      if (AmountApplied == 0 && Amount > 0) AmountApplied = Amount;
      if (Amount <= 0) // Payment amount should never be 0 or less
      {
        Error = "The Amount Paid cannot be less than or equal to zero.";
        return false;
      }
      if (this.PaymentType == payment_type.check && CheckNumber.Length == 0)
      {
        Error = "The Check Number is required for Check Payments.";
        return false;
      }
      if(this.PaymentTypeValue.Length == 0)
      {
        Error = "A valid Payment Type must be selected.";
        return false;
      }
      return true;
    }

    public static List<Payment> GetPaymentList(int payid, int otid, string cashierId)
    {
      var param = new DynamicParameters();
      param.Add("@otid", otid);
      param.Add("@payid", payid);
      param.Add("@casheirId", cashierId);

      var query = @"
       USE WATSC;


       SELECT 
      ;";

      return Constants.Get_Data<Payment>(query, param);
    }
  }
  
}