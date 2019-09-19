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
        WHERE 
          CAST(C.TransDt AS DATE) = CAST(@TransactionDate AS DATE)
      )

      SELECT 
        CC.CashierId, 
        CC.TransDt TransactionDate, 
			  CC.Name, 
        CP.AmtApplied AmountApplied,
        CP.PmtType PaymentType, 
        ISNULL(CP.CkNo, '') CheckNumber, 
        ISNULL(CP.TransactionId, '') TransactionNumber,
        CP.Info,
        ISNULL(LTRIM(RTRIM(CI.AssocKey)), '') AssocKey,
        SUM(ISNULL(CI.Total, 0)) ChargeTotal
      FROM ccCashier CC
      INNER JOIN CashierIds C ON CC.CashierId = C.CashierId
      LEFT OUTER JOIN ccCashierItem CI ON CC.cashierId = CI.cashierId 
			LEFT OUTER JOIN ccCashierPayment CP ON CC.OTId = CP.OTId 
      WHERE         
        CAST(CC.TransDt AS DATE) = CAST(@TransactionDate AS DATE)
			GROUP BY 
        CC.CashierId, 
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