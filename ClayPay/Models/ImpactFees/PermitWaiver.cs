using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Data.SqlClient;
using System.Data;
using Dapper;

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
      if(permit.ImpactFee_Amount != Amount)
      {
        // Partial Waiver Process:
        // This process needs to do the following:
        // 1. Reduce the amount of the current impact fee (captured in permit) by the amount in permit.
        // 2. Insert a new charge that has the following properties:
        //    a. Same Catcode as the original impact fee
        //    b. Same amount in permit object
        //    c. Can probably do this easily with a Select Insert.
        // 3. Capture the freshly inserted row's ItemId.
        // 4. Use the waiver/exemption process on the new ItemId
        // So largely, this process will just pre-empt the ApplyWaiver process.
        // We should just be able to update the permit object with the new item id and 
        // proceed as normal.
        var NewItemId = PartialImpactFeeHandling(permit, Amount);
        if (NewItemId == -1)
        {
          Constants.Log("Error Applying Partial Waiver", permit.ItemId.Value.ToString(), permit.Permit_Number, permit.ImpactFee_Amount_Formatted, "");
        }
        permit.ItemId = NewItemId; // Set it to the newly created row
      }
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

    public static int PartialImpactFeeHandling(PermitImpactFee permit, decimal Amount)
    {
      var dp = new DynamicParameters();
      dp.Add("@NewItemId", dbType: DbType.Int32, direction: ParameterDirection.Output);
      dp.Add("@ItemId", permit.ItemId.Value);
      dp.Add("@WaivedAmount", Amount);
      string sql = @"
        SET @WaivedAmount = CAST(@WaivedAmount AS DECIMAL(10, 2));
        UPDATE ccCashierItem
        SET 
          BaseFee = BaseFee - @WaivedAmount,
          Total = Total - @WaivedAmount
        WHERE 
          ItemId=@ItemId;

        INSERT INTO [dbo].[ccCashierItem]
          ([OTId]
          ,[OperId]
          ,[CatCdID]
          ,[CatCode]
          ,[Narrative]
          ,[Assoc]
          ,[AssocKey]
          ,[Variable]
          ,[BaseFee]
          ,[Total]
          ,[TimeStamp]
          ,[Audit]
          ,[Flag]
          ,[Recon]
          ,[ReconInit]
          ,[NTUser]
          ,[UnCollectable])

        SELECT
          0,
          OperId,
          CatCdID,
          CatCode,
          Narrative,
          Assoc,
          AssocKey,
          Variable,
          @WaivedAmount,
          @WaivedAmount,
          GETDATE(),
          Audit,
          Flag,
          Recon,
          ReconInit,
          'claypay',
          UnCollectable
        FROM ccCashierItem
        WHERE ItemId=@ItemId;

        SET @NewItemId = @@IDENTITY;";
      try
      {       
        int i = Constants.Exec_Query(sql, dp);
        if (i != -1)
        {
          int newItemId = dp.Get<int>("@NewItemId");
          return newItemId;
        }
        return -1;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return -1;
        //TODO: add rollback in StartTransaction function
      }
    }

    public string Validate(PermitImpactFee permit)
    {
      Payment_Type = Get_Payment_Type();
      if (Payment_Type == Claypay.Payment.payment_type.impact_fee_credit)
      {
        return "Cannot apply Impact Fee Credits using this process.";
      }
      if(Amount > permit.ImpactFee_Amount)
      {
        return $"You cannot waive an amount greater than the amount of the impact fee.  Amount waived: {Amount.ToString("C2")}, Impact fee Amount: {permit.ImpactFee_Amount_Formatted}";
      }
      //if(permit.ImpactFee_Amount != Amount)
      //{
      //  return "The Impact Fee amount provided does not match. Please check your permit number and try again.  If this issue persists, please contact the helpdesk.";
      //}
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