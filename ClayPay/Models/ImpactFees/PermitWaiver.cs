using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.ImpactFees
{
  public class PermitWaiver
  {
    public string Waiver_Type { get; set; } = "";
    public string Permit_Number { get; set; } = "";
    public decimal Amount { get; set; } = 0; // used for validation
    private Claypay.Payment.payment_type Payment_Type { get; set; } = Claypay.Payment.payment_type.impact_fee_credit;
    public PermitWaiver()
    {

    }

    public bool ApplyWaiver(PermitImpactFee permit, string IpAddress, UserAccess ua)
    {
      var nt = new Claypay.NewTransaction();
      nt.ItemIds.Add(permit.ItemId.Value);

      var ifPayment = new Claypay.Payment(Payment_Type)
      {
        Amount = permit.ImpactFee_Amount.Value,
        AmountTendered = 0,
        AmountApplied = permit.ImpactFee_Amount.Value,
        Validated = true
      };
      nt.TransactionCashierData.PayerCompanyName = permit.Contractor_Name;
      nt.Payments.Add(ifPayment);
      nt.TransactionCashierData.ipAddress = IpAddress;
      nt.TransactionCashierData.CurrentUser = ua;
      return nt.SaveTransaction();
    }

    public string Validate(PermitImpactFee permit)
    {
      Payment_Type = Get_Payment_Type();
      if (Payment_Type == Claypay.Payment.payment_type.impact_fee_credit)
      {
        return "Cannot apply Impact Fee Credits using this process.";
      }
      
      if(permit.ImpactFee_Amount != Amount)
      {
        return "The Impact Fee amount provided does not match. Please check your permit number and try again.  If this issue persists, please contact the helpdesk.";
      }
      if(permit.ImpactFee_Amount <= 0)
      {
        return "The Impact Fee Amount cannot be less than or equal to zero.";
      }

      return "";
    }

    private Claypay.Payment.payment_type Get_Payment_Type()
    {
      switch (Waiver_Type)
      {
        case "IFWS": // School Impact Fee Waiver
          return Claypay.Payment.payment_type.impact_waiver_school;

        case "IFWR": // Impact Fee Waiver
          return Claypay.Payment.payment_type.impact_waiver_road;

        case "IFEX": // Impact fee Exemption
          return Claypay.Payment.payment_type.impact_fee_exemption;

        default: // this is an error
          return Claypay.Payment.payment_type.impact_fee_credit;
        //case "IFCR": // Impact Fee Credit
          //return Claypay.Payment.payment_type.impact_fee_credit; // error, we don't do credit here.


      }
    }


  }
}