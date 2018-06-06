using Dapper;
using System;
using System.Collections.Generic;

namespace ClayPay.Models.Balancing
{
  public class Payment
  {
  public string CashierId { get; set; }
    public long OTid { get; set; }
    public string Name { get; set; }
    public double AmtApplied { get; set; }
    public double Total { get; set; }

  public Payment()
  {

  }
  
    // This is what is generated when they click the research button.
    // Without the ability to void payments, this will become unnecessary
    public static List<CashierTotal> GetPayments(DateTime DateToBalance, string paymentType)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);
      dbArgs.Add("@PaymentType", paymentType);

      var sql = @"
      USE WATSC;

      WITH ALL_CHOSEN (CashierId , OTid, [Name], AmtApplied, payment_type) AS (
      SELECT DISTINCT CI.CashierId ,CP.OTid, C.[Name], AmtApplied, L.Code
      FROM ccCashierPayment CP
      LEFT OUTER JOIN ccLookUp L ON LEFT(CP.PmtType,5) = LEFT(L.Code,5)
      LEFT OUTER JOIN ccCashierItem CI ON CP.OTid = CI.OTId
      LEFT OUTER JOIN ccCatCd CC ON CC.CatCode  = CI.CatCode
      LEFT OUTER JOIN CCCASHIER C ON CI.CashierId = C.CashierId
      WHERE CAST(C.TransDt AS DATE) = CAST(@DateToBalance AS DATE)
        AND Description IS NOT NULL
        AND TOTAL IS NOT NULL)
      ,otidTotals (otid, total) as (
      select otid, sum(amttendered) total
      from ccCashierPayment cp
      GROUP BY OTid)
      
      SELECT 
        AC.CashierId, 
        AC.OTid, 
        AC.[Name],
        AC.AmtApplied, 
        OT.Total 
      FROM ALL_CHOSEN AC
      INNER JOIN otidTotals OT ON OT.otid = AC.OTid
      WHERE @PaymentType = ''
         OR payment_type = @PaymentType
      UNION
      SELECT 
        NULL,
        NULL,
        NULL,
        (SELECT SUM(AmtApplied) 
           FROM ALL_CHOSEN 
           WHERE @PaymentType = '' 
              OR payment_type = @PaymentType),
        NULL
      ORDER BY AmtApplied

       ";
      try
      {
        return Constants.Get_Data<CashierTotal>(sql, dbArgs);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<CashierTotal>();
      }
    }
  }
}