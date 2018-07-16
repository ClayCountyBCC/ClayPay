﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class Payment
  {

    //public string Info { get; set; }
    public enum payment_type
    {
      cash = 0,
      check = 1,
      credit_card = 2,
      impact_fee_credit = 3,
      impact_fee_exemption = 4,
      impact_waiver_school = 5,
      impact_waiver_road = 6
    }

    public payment_type PaymentType { get; set; }
    // This is to set the payment type string for inserting into db. Client does not need this.
    public string PaymentTypeValue
    {
      get
      {
        switch (PaymentType)
        {

          case payment_type.credit_card:
            switch (Environment.MachineName.ToUpper())
            {
              case "CLAYBCCIIS01":
                return "cc_cashier";
              case "CLAYBCCDMZIIS01":
                return "cc_online";
            }
            return "cc_test";
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
    public decimal Amount { get; set; }
    public decimal AmountTendered
    {
      get
      {
        return Amount;
      }
    }
    public decimal AmountApplied { get; set; } = 0;
    public string Info { get; set; }
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";
    public bool Validated { get; set; } = false;
    public string Error { get; set; } = "";

    public Payment()
    { 
    }

    public Payment(CCPayment ccpayment, UserAccess ua)
    {
      PaymentType = payment_type.credit_card;
      Amount = ccpayment.Amount;
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
      if (!this.Validated) return false;
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

  }

}