using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    public long OTid { get; set; }
    public List<long> ItemIds { get; set; }
    public CCData CreditCardPayment { get; set; }
    public ManualPayment CashPayment { get; set; }
    public ManualPayment CheckPayment { get; set; }

    public NewTransaction(
      long otid,
      List<long> items,
      CCData CCPayment = null,
      ManualPayment cashPayment = null,
      ManualPayment checkPayment = null)
    {
      this.OTid = otid;
      this.ItemIds = items;
      this.CreditCardPayment = CCPayment;
      this.CashPayment = cashPayment;
      this.CheckPayment = checkPayment;


    }

    public static List<string> ValidatePayments(string ipAddress, List<Charge> charges, CCData CCPayment, List<ManualPayment> manualPayments)
    {
      
      var errors = new List<string>();
      
      decimal totalPaymentAmount = CCPayment != null ? CCPayment.Total : 0;
      decimal totalCharges = (from c in charges select c.Total).Sum();

      if (manualPayments != null && manualPayments.Count > 0)
      {
        totalPaymentAmount += (from mp in manualPayments select mp.Amount).Sum();
      }
   

      if (totalPaymentAmount <= 0)
      {
        errors.Add("Payment amount must be greater than 0.\n");
      }

      if (totalPaymentAmount != totalCharges)
      {
        errors.Add("The total for this transaction has changed.  Please check the charges and try again.");
      }

      // Thist doesn't belong here... this function is to validate, not process payments.
     
      var itemIds = (from c in charges
                     select c.ItemId).ToList();

      if (errors.Count == 0)
      {
        if (ActiveTransactions.ChargeItemsLocked(itemIds) == 0)
        {
          errors.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
        }
      }
      return errors;
    }

    public static List<string> ProcessPayments(NewTransaction thisTransaction, string ipAddress)
    {
      
      var errors = new List<string>();

      if (thisTransaction.CreditCardPayment != null)
      {
        if (PaymentResponse.PostPayment(thisTransaction.CreditCardPayment, ipAddress) != null)
        {
          ManualPayment.Save(manualPayments);
        }
      }
      // process cc payments here
      

      // process manual payments here


      // unlock ItemIds
      ActiveTransactions.UnlockChargeItems(thisTransaction.ItemIds);
      return errors;
    }

  }


}