using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Balancing
{
  public class CashierDetailData
  {
    public string CashierId { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.MinValue;
    public string Name { get; set; } = "";
    public decimal AmountApplied { get; set; } = decimal.MinusOne;
    public string PaymentType { get; set; } = "";
    public string CheckNumber { get; set; } = "";
    public string TransactionNumber { get; set; } = "";
    public string Info { get; set; } = "";
    public string AssocKey { get; set; } = "";
    public decimal ChargeTotal { get; set; } = decimal.MinusOne;

    public CashierDetailData()
    {
    }

    public static List<CashierDetailData> Get(DateTime TransactionDate)
    {
      // this will need to get fleshed out a bit more. There may need to be a custom model
      // created for this data type.
      // This has been changed from the current Cashier Detail report to add
      // the AssocKey (which is the permit number / contractor number / etc)
      // and the total charges for that AssocKey and Cashier Id.
      var param = new DynamicParameters();
      param.Add("@TransactionDate", TransactionDate);
      string sql = @"
      WITH CashierIds AS (
        SELECT DISTINCT
          C.CashierId
        FROM ccCashier C
        INNER JOIN ccCashierPayment CP ON CP.OTid = C.OTId
        INNER JOIN ccLookUp L ON UPPER(LEFT(L.CODE,5)) = UPPER(LEFT(CP.PMTTYPE,5)) 
          AND (L.CdType='PMTTYPE' OR (L.CdType='SPECIALPT' AND L.Code IN ('cc_cashier', 'cc_online')))
        WHERE 
          CAST(C.TransDt AS DATE) = CAST(@TransactionDate AS DATE)
      )

      SELECT 
        CI.CashierId, 
        CC.TransDt TransactionDate, 
			  CC.Name, 
        CP.AmtApplied AmountApplied,
        CP.PmtType PaymentType, 
        ISNULL(CP.CkNo, '') CheckNumber, 
        ISNULL(CP.TransactionId, '') TransactionNumber,
        CP.Info,
        ISNULL(LTRIM(RTRIM(CI.AssocKey)), '') AssocKey,
        SUM(CI.Total) ChargeTotal
      FROM ccCashier CC
      INNER JOIN CashierIds C ON CC.CashierId = C.CashierId
      INNER JOIN ccCashierItem CI ON CC.cashierId = CI.cashierId 
			LEFT outer JOIN ccCashierPayment CP ON CI.OTId = CP.OTId 
      WHERE 
        CI.Cashierid IS NOT NULL 
        AND CAST(CC.TransDt AS DATE) = CAST(@TransactionDate AS DATE)
			GROUP BY 
        CI.CashierId, 
        CC.TransDt, 
			  CC.Name, 
        CP.AmtApplied,
        CP.PmtType, 
        CP.CkNo, 
        CP.TransactionId,
        CP.Info,
        CI.AssocKey
			ORDER BY CC.TransDt";
      return Constants.Get_Data<CashierDetailData>(sql, param);
    }
  }
}