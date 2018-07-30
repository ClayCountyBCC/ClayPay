using Dapper;
using System.Linq;
using System;
using System.Collections.Generic;
using ClayPay.Models;

namespace ClayPay.Models.Balancing
{
  public class Payment
  {
    public DateTime TransactionDate { get; set; }
    public string CashierId { get; set; }
    public long OTid { get; set; }
    public string Name { get; set; }
    public decimal Total { get; set; }
    public bool Editable { get; set; } = false;
    public string Error { get; set; } = "";

  public Payment()
  {

  }
  public Payment(string er)
  {
      Error = er;
  }
    // Without the ability to void payments, this will become unnecessary after a time
    public static List<Payment> GetPayments(
      DateTime DateToBalance, 
      Claypay.Payment.payment_type payment_type, 
      UserAccess ua)
    {
      string PaymentType = "";
      string error = "";

      switch(payment_type)
      {
        case Claypay.Payment.payment_type.cash:
          PaymentType = "'CA'";
          break;
        case Claypay.Payment.payment_type.check:
          PaymentType = "'CK'";
          break;
        case Claypay.Payment.payment_type.credit_card_public:
          PaymentType ="'CC_ONLINE', 'CC ON'";
          break;
        case Claypay.Payment.payment_type.credit_card_cashier:
          PaymentType ="'CC_CASHIER','VISA','MC','AMEX','DISC'";
          break;
        case Claypay.Payment.payment_type.impact_fee_credit:
          PaymentType = "'IFCR'";
          break;
        case Claypay.Payment.payment_type.impact_fee_exemption:
          PaymentType = "'IFEX'";
          break;
        case Claypay.Payment.payment_type.impact_waiver_school:
          PaymentType = "'IFWS'";
          break;
        case Claypay.Payment.payment_type.impact_waiver_road:
          PaymentType = "'IFWR'";
          break;
        default:
          error = "Invalid Payment Type.";
          break;
      }
      var param = new DynamicParameters();
      param.Add("@DateToBalance", DateToBalance);
      //param.Add("@PaymentType", PaymentType);

      var sql = $@"
      USE WATSC;

      WITH ALL_CHOSEN (TransactionDate,CashierId, name,OTid, Total,CKNO, Editable) AS (
      SELECT DISTINCT 
        C.TransDt,
        C.CashierId ,
        name,
        CP.OTid, 
        AmtApplied, 
        CkNo, 
        CASE WHEN CP.PmtType = 'CA' OR CP.PmtType = 'CK' THEN 1 ELSE 0 END Editable
      FROM ccCashierPayment CP
      LEFT OUTER JOIN ccLookUp L ON LEFT(UPPER(CP.PmtType),5) = LEFT(UPPER(L.Code),5)
      --LEFT OUTER JOIN ccCashierItem CI ON CP.OTid = CI.OTId
      LEFT OUTER JOIN ccCatCd CC ON CC.CatCode  = CI.CatCode
      LEFT OUTER JOIN CCCASHIER C ON CP.OTId = C.OTId
      WHERE CAST(C.TransDt AS DATE) = CAST(@DateToBalance AS DATE)
        AND Description IS NOT NULL
        AND TOTAL IS NOT NULL 
        AND LEFT(UPPER(L.CODE),5) IN ({PaymentType})
      ),otidTotals (otid, total) as (
      select otid, sum(AmtApplied) total
      from ccCashierPayment cp
      GROUP BY OTid)


      SELECT 
        Editable,
        TransactionDate, 
        AC.CashierId, 
        AC.OTid,
        name, 
        OT.Total
      FROM ALL_CHOSEN AC
      INNER JOIN otidTotals OT ON OT.otid = AC.OTid
      UNION
      SELECT 
        NULL,
        NULL, 
        NULL, 
        NULL, 
        'Total Amount', 
        (SELECT SUM(Total)
        FROM ALL_CHOSEN)
      ORDER BY Total
       ";
      try
      {

        if (error.Length == 0)
        {
          var payments = Constants.Get_Data<Payment>(sql, param);
          if (!ua.djournal_access || DateFinalized(DateToBalance))
          {
            foreach (var p in payments)
            {
              p.Editable = false;
            }
          }
          return payments;
        }
        else
        {
          return new List<Payment>{new Payment(error)};
        }
        
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Payment>();
      }
    }

    public static bool DateFinalized(DateTime DateToCheck)
    {
      var param = new DynamicParameters();
      param.Add("@DateToCheck", DateToCheck);
      var sql = @"
        SELECT djournal_date
        FROM ccDjournalTransactionLog
        WHERE CAST(djournal_date AS DATE) = CAST(@DateToCheck AS DATE)
      ";
      
      var i = Constants.Exec_Query(sql, param);
      
      return i > 0;
    }


  }
}