using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Balancing
{
  public class Payment
  {
    public string OTid { get; set; }
    public string CashierId { get; set; }
    public double AmtApplied { get; set; }
    public double AmtTendered { get; set; }
    public double Total { get; set; }
    public string Type { get; set; }
    public string Code { get; set; }

    public Payment()
    {
      
    }

    public static List<Payment> Process(DateTime DateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
      USE WATSC;

      --SELECT * CashierIds FROM DATE
      WITH CashierIdsToBalance (CashierId) AS (
      SELECT CashierId
      FROM dbo.ccCashier C
      WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE))
      -- SELECT * Payment Types FROM ccLOOKUP TABLE
      ,PaymentTypes (Code, SortKey) AS (
      SELECT DISTINCT Code,SortKey
      FROM ccLookUp L
      WHERE CdType = 'PMTTYPE')

      -- CREATE TMP TABLE TO BE ABLE TO MERGE ALL TOTALS TO ONE WORKABLE TABLE
      SELECT Code, AmtApplied FROM (
      SELECT L.SortKey,L.Code, SUM(AmtApplied) AmtApplied
      FROM (
      SELECT PmtType, AmtApplied
      FROM  ccCashierPayment CP
      LEFT OUTER join ccCashier C ON C.OTId = CP.OTid
      WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)) AS TMP
      RIGHT OUTER JOIN ccLookUp L ON LEFT(TMP.PmtType,5) = LEFT(L.CODE,5)
      WHERE L.CdType = 'PMTTYPE'
      GROUP BY L.SORTKEY, L.Code, PmtType
      UNION
      SELECT 98 SortKey, 'Change' Code, (SUM(AMTAPPLIED) - SUM(AMTTENDERED)) * (-1)
      FROM ccCashierPayment CP
      inner join ccCashier C ON C.OTId = CP.OTid
      WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)
        AND PmtType IN ('CK', 'CA')
      UNION 
      SELECT 99 SortKey, 'Total Deposit' Code, SUM(AmtApplied)
      FROM ccCashierPayment CP
      inner join ccCashier C ON C.OTId = CP.OTid
      WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)
        AND PmtType IN ('CK', 'CA')
      UNION 
      SELECT 100 SortKey, 'Total Payments' Code, SUM(AmtApplied)
      FROM ccCashierPayment CP
      INNER JOIN ccCashier C ON CP.OTid = C.OTid
      WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)
      ) AS TMP
      ORDER BY SortKey;

       ";
      try
      {
        
        return Constants.Get_Data<Payment>(sql, dbArgs);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Payment>();
      }
    }

    public static List<Payment> GetGUTotals(DateTime DateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
      USE WATSC;

      SELECT Case WHEN Type = 'd' THEN 'GU Debit' ELSE 'GU Credit' END [TYPE], sum(amount) amount from (
       SELECT otid, cashierid, cast(transdt AS DATE) transdt, account, amount, type
      FROM dbo.ccGU INNER JOIN dbo.ccGUItem ON dbo.ccGU.GUId = dbo.ccGUItem.GUID
       WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE)) AS tmp
       GROUP BY type
       ORDER BY Type DESC

       ";
      try
      {

        return Constants.Get_Data<Payment>(sql, dbArgs);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Payment>();
      }
    }

    public static List<Payment> GetAllCashierIdTotals(DateTime DateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
      USE WATSC;

      WITH ALL_CHOSEN (CashierId , OTid, AmtApplied) AS (
      SELECT DISTINCT CI.CashierId ,CP.OTid, AmtApplied
      FROM ccCashierPayment CP
      LEFT OUTER JOIN ccLookUp L ON LEFT(CP.PmtType,5) = LEFT(L.Code,5)
      LEFT OUTER JOIN ccCashierItem CI ON CP.OTid = CI.OTId
      LEFT OUTER JOIN ccCatCd CC ON CC.CatCode  = CI.CatCode
      LEFT OUTER JOIN CCCASHIER C ON CI.CashierId = C.CashierId
      WHERE CAST(C.TransDt AS DATE) = CAST(@DateToBalance AS DATE)
        AND Description IS NOT NULL
        AND TOTAL IS NOT NULL 
      ),otidTotals (otid, total) as (
      select otid, sum(amttendered) total
      from ccCashierPayment cp
      GROUP BY OTid)
      
      SELECT AC.CashierId, AC.OTid,AC.AmtApplied, OT.total FROM ALL_CHOSEN AC
      INNER JOIN otidTotals OT ON OT.otid = AC.OTid
      UNION
      SELECT NULL,NULL,(SELECT SUM(AmtApplied) FROM ALL_CHOSEN),NULL
      ORDER BY AmtApplied

       ";
      try
      {

        return Constants.Get_Data<Payment>(sql, dbArgs);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Payment>();
      }
    }
  }
}