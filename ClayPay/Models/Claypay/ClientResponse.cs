using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;

using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {
    public CashierData ResponseCashierData { get; set; }
    public List<Charge> Charges { get; set; } = new List<Charge>();
    public List<ReceiptPayment> ReceiptPayments { get; set; }
    public bool IsEditable { get; set; } = false;
    public bool CanVoid { get; set; } = false;
    public List<string> Errors { get; set; } = new List<string>();

    // These two are used only when there is an issue saving payments AFTER 
    // the credit card was charged for the amount. Very Bad
    /**
     *  THIS SHOULD NO LONGER BE AN ISSUE AS THE CC PAYMENT IS NOT SETTLED UNLESS WE 
     *  CORRECTLY SAVED ALL OF THE PAYMENT INFORMATION
     **/
    public string TransactionId { get; set; } = "";

    public List<string> PartialErrors { get; set; } = new List<string>();

    private string IpAddress { get; set; } = "";

    private string UserName { get; set; } = "";

    public ClientResponse(string cashierid, List<Charge> charges)
    {
      ResponseCashierData = CashierData.Get(cashierid);
      Charges = charges;
      ReceiptPayments = ReceiptPayment.Get(cashierid);

    }

    public ClientResponse(string cashierid)
    {
      ResponseCashierData = CashierData.Get(cashierid);
      if (ResponseCashierData.CashierId != cashierid)
      {
        Errors.Add($"CashierId: {cashierid} was not found.");
        return;
      }
      Charges = Charge.GetChargesByCashierId(cashierid);
      ReceiptPayments = ReceiptPayment.Get(cashierid);
    }
    
    public ClientResponse(string cashierid, UserAccess ua, bool isVoid = false)
    {
      ResponseCashierData = CashierData.Get(cashierid);
      if (ResponseCashierData.CashierId != cashierid)
      {
        Errors.Add($"CashierId: {cashierid} was not found.");
        return;
      }
      Charges = Charge.GetChargesByCashierId(cashierid);
      ReceiptPayments = ReceiptPayment.Get(cashierid);
      ValidateVoid(ua, isVoid);
    }

    public ClientResponse(List<string> errors)
    {
      Errors = errors;
    }

    public ClientResponse(List<string> partialErrors, string transId)
    {
      TransactionId = transId;
      PartialErrors = partialErrors;
    }

    public void SendPayerEmailReceipt(string EmailAddress)
    {
      if (EmailAddress.Length == 0) return;
      Constants.SaveEmail(EmailAddress, "Clay County Payment Receipt", BuildEmailBody());
    }

    private string BuildEmailBody()
    {
      var sb = new StringBuilder();
      sb.Append(CustomerEmailHeaderString());
      sb.Append(CustomerEmailChargesString());
      sb.Append(CustomerEmailPaymentsString());
      return sb.ToString();
    }

    public string CustomerEmailHeaderString()
    {
      var header = new StringBuilder();
      header.AppendFormat("{0,-40} {1,50}", ResponseCashierData.PayerName, ResponseCashierData.TransactionDate.ToString()).AppendLine()
           .Append(ResponseCashierData.PayerEmailAddress).AppendLine()
           .Append(ResponseCashierData.PayerCompanyName).AppendLine()
           .Append(ResponseCashierData.PayerStreet1).AppendLine()
           .Append(ResponseCashierData.PayerStreet2)
           .AppendLine()
           .AppendLine();
      return header.ToString();
    }

    public string CustomerEmailChargesString()
    {

      var cs = new StringBuilder();
      cs.AppendFormat("{0,-36} {1,-70} {2,12}", "Key", "Description", "Amount")
      .AppendLine()
      .AppendFormat("{0,-32} {1,-60} {2,16}", "-------------", "---------------------------------", "-----------")
      .AppendLine();

      foreach (var c in Charges)
      {
        cs.AppendFormat("{0,-31} {1,-41} {2,30}", c.AssocKey, c.Description, c.TotalDisplay)
        .AppendLine();
      }

      return cs.ToString();

    }

    public string CustomerEmailPaymentsString()
    {

      var ps = new StringBuilder();

      ps.AppendLine()
        .AppendLine()
        .AppendFormat("{0,45} {1,52}\n", "CheckNumber/", "Convenience")
        .AppendFormat("{0,-15} {1,-25} {2,-12} {3,21}\n", "Payment Type", "Transaction ID", "Amount", "Fee(cc only)")
        .AppendFormat("{0,-20} {1,-29} {2,-15} {3,23}\n", "------------------", "-----------------", "-----------", "----------------");

      foreach (var p in ReceiptPayments)
      {
        ps.AppendFormat("{0,-26} {1,-42} {2,-25:$#.00} {3,12:$#.00}", p.PaymentTypeDescription, p.TransactionId, p.AmountApplied, p.ConvenienceFeeAmount)
        .AppendLine();
      }
      return ps.ToString();

    }

    public void ValidateVoid(UserAccess ua, bool isVoid)
    {
      /**
        * 
        * 
        * VOID SAME DAY:
        *   ACCESS: INTERNAL MANAGER, CASHIER (should we include all clerks?)
        *   THE CASHIERID HAS NOT BEEN FINALIZED
        *   NO CREDIT CARD PAYMENT
        *   NOT ALREADY VOIDED
        *   NO PERMITS ASSOCIATED WITH PAYMENTS HAVE BEEN CO'd
        *   NO MEP PERMITS ASSOCIATED WITH PAYMENTS HAVE PASSED THEIR FINAL
        *   TRANSACTION NOT OLDER THAN 6 MONTHS
        *   
        * VOID FINALZIZED AND SAME DAY W/ CREDIT CARD
        *   ACCESS: INTERNAL MANAGER
        *   CASHIERID HAS BEEN FINALIZED
        *   NOT ALREADY VOIDED
        *   NO PERMITS ASSOCIATED WITH PAYMENTS HAVE BEEN CO'd
        *   NO MEP PERMITS ASSOCIATED WITH PAYMENTS HAVE PASSED THEIR FINAL
        *   TRANSACTION NOT OLDER THAN 6 MONTHS
        *   
        *   
        *      
      **/
      
      var er = new List<string>();


      if (!ua.void_manager_access && !ua.cashier_access)
      {
        if (isVoid) Errors.Add("Not Authorized to void payments");
        return;
      }


      if (ResponseCashierData.IsVoided)
      {
        er.Add("Payment is already void.");
      }

      if (ResponseCashierData.TransactionDate.Date < DateTime.Today.Date.AddMonths(-6))
      {
        er.Add("Cannot void transactions older than six months");
      }


      if (CheckForClosedPermits())
      {
        er.Add("Cannot void any transaction which includes permits that have been CO'd or have a passed final inspection");
      }


      if (!er.Any() && !ua.void_manager_access)
      {
        if (ReceiptPayments.Any(p => p.IsFinalized == true))
        {
          er.Add("Cannot void a finalized receipt.");
        }
        else
        {
          if (ReceiptPayments.Any(p => p.TransactionId != ""))
          {
            er.Add("Cannot void a same day transaction with a Credit card payment");
          }
        }
      }

      CanVoid = !er.Any();

      if (isVoid)
      {
        Errors.AddRange(er);
      }

    }

    private ClientResponse VoidPayments()
    {
      var param = new DynamicParameters();
      param.Add("@cashier_id",ResponseCashierData.CashierId);
      param.Add("@username", UserName);
      param.Add("@ip_address", IpAddress);

      var query = @"
        USE WATSC;

        BEGIN TRAN
          BEGIN TRY

            EXEC prc_claypay_void_transaction @cashier_id, @username, @ip_address

            COMMIT

          END TRY
          BEGIN CATCH
            ROLLBACK
          END CATCH

      ";
      int completed = -1;
      try
      {
        completed = Constants.Exec_Query(query, param); 
      }
      catch(Exception ex)
      {
        new ErrorLog("There was an error in VoidPayment", 
                     "Failed to void payment; cashier_id: " + ResponseCashierData.CashierId + "; DateTime: " + DateTime.Now.ToString(), 
                     ex.StackTrace, 
                     "ClayPay.Models.Claypay.ClientResponse.VoidPayment()", 
                     query);
      }

      if (completed > 0)
      {
        return new ClientResponse(ResponseCashierData.CashierId);
      }
      else
      {
        Errors.Add("There was an issue when trying to void the payments. If the issue persists, please reach out to support.");
        return this;
      }

    }

    public static ClientResponse Void(string cashierId, UserAccess ua, string ipAddress, bool isVoid = true)
    {

      var receipt = new ClientResponse(cashierId, ua, isVoid);
      receipt.IpAddress = ipAddress;
      receipt.UserName = ua.user_name;

      if (receipt != null && receipt.ResponseCashierData.CashierId == cashierId && receipt.CanVoid)
      {
        return receipt.VoidPayments();
      }
      else
      {
        return receipt;
      }

    }

    private bool CheckForClosedPermits()
    {

      List<string> assocKeys = (from c in Charges
                                select c.AssocKey).Distinct().ToList();

      var query = @"
        USE WATSC;

        WITH passed_final AS (
          
          SELECT DISTINCT
            BaseId,
            PermitNo permit_number
          FROM bpINS_REQUEST I 
          INNER JOIN bpINS_REF IR ON I.InspectionCode = IR.InspCd AND Final = 1
          WHERE 1=1
            AND ResultADC IN ('A', 'P')

        ), co_permits AS (

          SELECT DISTINCT
            BaseID,
            PermitNo permit_number
          FROM bpMASTER_PERMIT M 
          WHERE 1=1
            AND BaseID IS NOT NULL
            AND CoDate IS NOT NULL

        )

        SELECT
          PF.permit_number
        FROM passed_final PF
        LEFT OUTER JOIN co_permits CO ON CO.BaseID = PF.BaseId
        WHERE PF.permit_number IN @ids
          AND CO.permit_number IS NULL
        UNION
        SELECT 
          CO.permit_number
        FROM co_permits CO
        INNER JOIN passed_final PF ON CO.permit_number = PF.permit_number
        WHERE CO.permit_number IN @ids
      ";

      var permits = Constants.Get_Data<string>(query, assocKeys);

      return permits.Any();
    }


    //unused    
    public void SetUserNameAndIpAddress(string ipAddress = "", string username = "")
    {

      UserName = username;
      IpAddress = ipAddress;
    }
  }
}