using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ReceiptPayment
  {
    public string CashierId { get; set; } = "";
    public int PayId { get; set; } = -1;
    public int OTId { get; set; } = -1;
    public string Info { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.MinValue;
    public string PaymentType { get; set; } = "";
    public string PaymentTypeDescription
    {
      get; set;
      //{
      //  switch(PaymentType.Trim())
      //  {
      //    case "cc_online":
      //    case "cc_cashier":
      //    case "CC Online":
      //    case "CC On":
      //      return "Credit Card";
      //    case "CA":
      //      return "Cash";
      //    case "CK":
      //      return "Check";
      //    case "IFCR":
      //      return "Impact Fee Credit";
      //    case "IFEX":
      //      return "Impact Fee Exemption";
      //    case "IFWS":
      //      return "School Impact Fee Waiver";
      //    case "IFWR":
      //      return "Road Impact Fee Waiver";
      //    // should never get here
      //    default:
      //      return "";
      //  }

      //}
    }
    public decimal AmountApplied { get; set; } = -1;
    public decimal AmountTendered { get; set; } = -1;
    public decimal ChangeDue { get; set; } = -1;
    public decimal ConvenienceFeeAmount
    {
      get
      {
        switch (PaymentType.Trim().ToLower())
        {
          case "cc_online":
          case "cc_cashier":
          case "cc on":
          case "cc online":
            return Convert.ToDecimal(PaymentResponse.GetFee(AmountTendered));
          default:
            return 0;
        }
      }
    }
    public string CheckNumber { get; set; } = "";
    public string TransactionId { get; set; } = "";

    public bool IsFinalized { get; set; } = false;


    public ReceiptPayment()
    {

    }

    public static List<ReceiptPayment> Get(string CashierId)
    {
      var param = new DynamicParameters();
      param.Add("@cashierId", CashierId);
      var query = @"
        USE WATSC;
        SELECT DISTINCT
          LTRIM(RTRIM(C.CashierId)) CashierId,
          CP.OTId,
          PayId, 
          TRANSDT [TransactionDate], 
          INFO,
          L.CODE [PaymentType],
          CASE WHEN UPPER(LEFT(L.Narrative,2)) = 'CC' 
               THEN LTRIM(RTRIM(SUBSTRING(L.Narrative,4,LEN(L.Narrative)))) 
               ELSE L.Narrative END PaymentTypeDescription,
          AmtTendered [AmountTendered], 
          AmtApplied [AmountApplied], 
          (AmtTendered - AmtApplied) ChangeDue, 
          CkNo [CheckNumber],
          ISNULL(TransactionId, '') TransactionId
        FROM ccCashierPayment CP
        INNER JOIN ccCashier C ON C.OTId = CP.OTid
        INNER JOIN ccLookUp L ON LEFT(L.CODE,5) = LEFT(CP.PmtType,5)
        WHERE CdType IN ('SPECIALPT', 'PMTTYPE')
          AND C.CashierId = @cashierId
        ORDER BY CashierId DESC";

      var i = Constants.Get_Data<ReceiptPayment>(query, param);
      return i;

    }

    public static List<ReceiptPayment> GetPaymentsByPayId(List<int> payIds)
    {

      //var param = new DynamicParameters();
      //param.Add("@PayId", payIds);
      var query = @"
        USE WATSC;
        SELECT DISTINCT
          LTRIM(RTRIM(C.CashierId)) CashierId,
          CP.OTId,
          PayId, 
          TRANSDT [TransactionDate], 
          INFO,
          L.CODE [PaymentType],
          CASE WHEN UPPER(LEFT(L.Narrative,2)) = 'CC' 
               THEN LTRIM(RTRIM(SUBSTRING(L.Narrative,4,LEN(L.Narrative)))) 
               ELSE L.Narrative END PaymentTypeDescription,
          AmtTendered [AmountTendered], 
          AmtApplied [AmountApplied], 
          (AmtTendered - AmtApplied) ChangeDue, 
          CkNo [CheckNumber],
          ISNULL(TransactionId, '') TransactionId
        FROM ccCashierPayment CP
        INNER JOIN ccCashier C ON C.OTId = CP.OTid
        INNER JOIN ccLookUp L ON LEFT(L.CODE,5) = LEFT(CP.PmtType,5)
        WHERE CdType IN ('SPECIALPT', 'PMTTYPE')
          AND CP.PayId in (@payIds)
        ORDER BY CashierId DESC";

      var i = Constants.Get_Data<ReceiptPayment>(query, payIds);
      return i;
    }

    public static List<string> UpdatePayments(
      List<ReceiptPayment> paymentsToEdit,
      List<ReceiptPayment> originalPayments, // do i need this to rollback the transaction if not doing it using SQL?
      string username)
    {
      var errors = new List<string>();
      foreach (var p in paymentsToEdit)
      {
        if (p.PaymentType == "CA" || p.PaymentType == "CK")
        {


          var param = new DynamicParameters();
          param.Add("@PayId", p.PayId);
          param.Add("@otid", p.OTId);
          param.Add("@PaymentType", p.PaymentType);
          param.Add("@CheckNumber", p.CheckNumber);
          param.Add("@username", username.Replace("CLAYBCC\\", ""));
          var query = @"
          USE WATSC;

          UPDATE ccCashierPayment
          SET 
            PmtType = @PaymentType, 
            CkNo = @CheckNumber, 
            UpdatedBy = @username, 
            UpdatedOn = GETDATE()
          WHERE PayId = @PayId 
            AND OTid = @otid;

        ";

          try
          {
            if (!Constants.Save_Data(query, param))
            {

              errors.Add($@"The {Payment.GetPaymentType(p.PaymentType).ToLower()} 
                            payment with payId {p.PayId} was not updated");
            }

          }
          catch (Exception ex)
          {
            Constants.Log(ex, query);
            errors.Add($@"The {Payment.GetPaymentType(p.PaymentType).ToLower()} 
                            payment with payId {p.PayId} did not update properly");
          }
        }
      }
      return errors;
    }

    public static List<string> EditPaymentValidation(List<ReceiptPayment> paymentsToEdit, List<ReceiptPayment> originalPayments)
    {
      var errors = new List<string>();
      foreach(var p in paymentsToEdit)
      {
        bool hasMatch = false;
        foreach(var o in originalPayments)
        {
          if(HasMatchingPayment(p, o))
          {
            hasMatch = true;
            break;
          }
        }

        if(!hasMatch)
        {
          errors.Add($@"The {Payment.GetPaymentType(p.PaymentType)} payment with payId {p.PayId} is not a valid payment.");
        }
      }
      if (NotEditablePaymentTypes(paymentsToEdit, originalPayments))
      {
        errors.Add("You can only edit cash or check payments");
      }

      if (DateFinalized(originalPayments))
      {
        errors.Add("These payments have been finalized and can no longer be edited");
      }
        

      return errors;
    }


    public static bool NotEditablePaymentTypes(List<ReceiptPayment> paymentTypesToEdit, List<ReceiptPayment> originalPaymentTypes)
    {
      if ((from p in paymentTypesToEdit
           where p.PaymentType != "CA" &&
                 p.PaymentType != "CK"
           select p).ToList().Count() > 0 ||
        (from p in originalPaymentTypes
         where p.PaymentType != "CA" &&
               p.PaymentType != "CK"
         select p).ToList().Count() > 0)
      {
        return true;
      }

      return false;
    }

    public static bool DateFinalized(List<ReceiptPayment> originalPayments)
    {
      return Models.Balancing.DJournal.LastDateFinalized().AddDays(1).Date >= originalPayments[0].TransactionDate.Date;
    }

    public static bool HasMatchingPayment(ReceiptPayment paymentToCheck, ReceiptPayment originalPayment)
    {
      if(paymentToCheck.PayId == originalPayment.PayId && paymentToCheck.OTId == originalPayment.OTId)
      {
        return true;
      }
      return false;
    }
  }
}