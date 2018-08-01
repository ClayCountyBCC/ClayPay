using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ReceiptPayment
  {
    public string CashierId{ get; set; }
    public int PayId { get; set; }
    public int OTId { get; set; }
    public string Info { get; set; }
    public DateTime TransactionDate { get; set; }
    public string PaymentType{ get; set; }
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
    public decimal ChangeDue { get; set; }
    public decimal ConvenienceFeeAmount 
    {
      get
      {
        switch(PaymentType.Trim().ToLower())
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

    public static List<ReceiptPayment> EditPayments(List<ReceiptPayment> paymentsToEdit)
    {
      var cashierId = paymentsToEdit[0].CashierId;
      foreach (var p in paymentsToEdit)
      {
        if (p.PaymentType == "CA" || p.PaymentType == "CK")
        {


          var param = new DynamicParameters();
          param.Add("@PayId", p.PayId);
          param.Add("@PaymentType", p.PaymentType);
          param.Add("@CheckNumber", p.CheckNumber);
          var query = @"
          USE WATSC;

          UPDATE ccCashierPayment
          SET PmtType = @PaymentType, CkNo = @CheckNumber
          WHERE PayId = @PayId;

        ";

          try
          { 
            
            var i = Constants.Exec_Query(query, param); 

          }
          catch(Exception ex)
          {
            Constants.Log(ex, query);
          }
        }
      }

      return Get(cashierId);
    }
  }
}