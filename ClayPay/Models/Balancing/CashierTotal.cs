using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Balancing
{
  public class CashierTotal
  {
    public string Type { get; set; } = "";
    public string Code { get; set; } = "";
    public decimal TotalAmount { get; set; } = 0;

    public CashierTotal()
    {

    }

    public static List<CashierTotal> ProcessPaymentTypeTotals(DateTime DateToBalance)
    {
      /**
       * PROCESS:
       * 
       *  GET DATA TO USE FOR PROCESSING:
       *  1. INPUT: DATE TO BALANCE
       *  2. GET ALL CashierIds THAT NEED TO BE BALANCED
       *  3. GET PAYMENT TYPES FROM ccLookUp
       *  
       *  PROCESS TABLE OF AMOUNTS:
       *  1. GET TOTAL AMOUNT FOR ALL CHARGES WITH CashierIds FROM STEP 2
       *  2. GET PAYMENT TYPES AND AMOUNT APPLIED FROM ccCashierPayment, ccLookUp 
       *     (THIS INCLUDES IMPACT FEE WAIVERS, CREDITS, AND EXEMPTIONS)
       *  3. GET AMOUNT OF CHANGE
       *  4. GET TOTAL DEPOSIT AMOUNTS TO BALANCE (CASH AND CHECKS) FROM ccCashierPayment, ccCashier 
       *  5. GET TOTAL AMOUNT OF ALL APPLIED PAYMENTS (CASH, CHECK, AND CREDIT/DEBIT.
       *     THIS USED WITH STEP 1 TO CHECK THE BALANCE;
       *     IF TOTAL OF ALL CHARGES IS EQUAL TO TOTAL OF ALL APPLIED PAYMENTS, THEN ALL IS WELL
       *     REMOVING THE VOID PROCESS SHOULD SIGNIFICANTLY REDUCE THE CHANCE IT WILL BE OUT OF BALANCE.
       *     
       *  TABLE IS RETURNED PRE-FORMATTED
       *  Removed this from this function, it did nothing.
       * ,PaymentTypes (Code, SortKey,Narrative,CdType) AS 
        (
          SELECT DISTINCT Code,SortKey, Narrative, CdType
          FROM ccLookUp L
          WHERE CdType IN ('SPECIALPT','PMTTYPE')
        )

       * 
       */
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
        USE WATSC;
        /*
          ValidPaymentTypes is a list of the payment types that don't include
          the impact fee waivers / exemptions / credits.
          We are using ValidPaymentTypes to impact the CashierIdsToBalance
          CTE so that we won't have to filter for them everywhere.
        */
        WITH ValidPaymentTypes AS (
          SELECT Code FROM ccLookUp
          WHERE Cdtype IN ('PMTTYPE')
          OR (CdType = 'SPECIALPT'
          AND Code IN ('cc_cashier', 'cc_online'))
        ), CashierIdsToBalance (CashierId) AS (
          SELECT CashierId
          FROM dbo.ccCashier C          
          WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE)
          AND OTId IN (
            SELECT DISTINCT
              OTId
            FROM ccCashierPayment CP
            INNER JOIN ValidPaymentTypes V ON CP.PmtType = V.Code            
          )
        )

        SELECT 
        ISNULL(Code, '') Code, 
        Narrative Type, 
        AmtApplied TotalAmount 
        FROM 
          (
          -- GET TOTAL AMOUNT OF CHARGES FOR BALANCING 
          -- CHECK THIS TOTAL AGAINST THE SUM(ccCashierPayment.AmtApplied) IN THE LAST SELECT STATEMENT
          SELECT
              00 SortKey,
              NULL Code,
              'Total Charges' Narrative,
              SUM(total) AmtApplied,
              'AA' CdType
            FROM cccashieritem C
            INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
            --INNER JOIN ccCashierPayment CP ON CP.OTid = C.OTId
            --INNER JOIN ccLookUp L ON UPPER(LEFT(L.Code,5)) = UPPER(LEFT(CP.PmtType,5))
            --WHERE L.CdType = 'PMTTYPE' OR LOWER(L.Code) IN ('cc_online', 'cc_cashier')

          UNION

          SELECT 
            L.SortKey,
            L.Code, 
            L.Narrative,
            SUM(AmtApplied) AmtApplied, 
            CdType 
           FROM 
           (
             SELECT PmtType, AmtApplied
             FROM  ccCashierPayment CP
             LEFT OUTER join ccCashier C ON C.OTId = CP.OTid
             INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
           ) AS TempAllPayments
           RIGHT OUTER JOIN ccLookUp L ON LEFT(TempAllPayments.PmtType,5) = LEFT(L.CODE,5)
           WHERE L.CdType IN ('PMTTYPE') OR LOWER(L.Code) IN ('cc_online', 'cc_cashier')
           GROUP BY L.SORTKEY, L.Code, L.Narrative, CdType, PmtType

           UNION  
         
           SELECT 
              98 SortKey, 
              NULL Code, 
              'Change' Narrative, 
              (SUM(AMTAPPLIED) - SUM(AMTTENDERED)) * (-1),
              'ZB'CdType
            FROM ccCashierPayment CP
            INNER JOIN ccCashier C ON C.OTId = CP.OTid
            INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
              AND PmtType IN ('CK', 'CA')
         
            UNION   
         
            SELECT 
              99 SortKey, 
              NULL Code, 
              'Total Deposit' Narrative, 
              SUM(AmtApplied),
              'ZC' CdType
            FROM ccCashierPayment CP
            INNER JOIN ccCashier C ON C.OTId = CP.OTid
            INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
              AND PmtType IN ('CK', 'CA')
         
            UNION   
         
            SELECT 
              100 SortKey,
              NULL Code, 
              'Total Payments' Narrative, 
              SUM(AmtApplied),
              'ZD' CdType
            FROM ccCashierPayment CP
            INNER JOIN ccCashier C ON CP.OTid = C.OTid
            INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
            --INNER JOIN ccLookUp L ON UPPER(LEFT(L.Code,5)) = UPPER(LEFT(CP.PmtType,5))
            --WHERE L.CdType = 'PMTTYPE' OR LOWER(L.Code) IN ('cc_online', 'cc_cashier')

        ) AS TMP
        WHERE AmtApplied > 0 AND AmtApplied IS NOT NULL
        ORDER BY CdType, SortKey; --THIS ALLOWS FOR THE DATA TO BE IN THE SAME ORDER AS IT IS CURRENTLY
                                  -- SOLELY FOR CONTINUITY. THE ACTUAL LAYOUT MAY CHANGE BASED ON MOCKUP
       ";
      try
      {
        var casheirtotals = Constants.Get_Data<CashierTotal>(sql, dbArgs);
        return casheirtotals;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<CashierTotal>();
      }
    }

    public static List<CashierTotal> GetGUTotals(DateTime DateToBalance)
    {
      /**
       * THIS FUNCTION RETURNS THE GU Debit AND GU Credit AMOUNTS
       * IN Process AND DJournal, THIS IS DISPLAYED UNDER PROCESS (Payment.Process())
       * AND DISPLAYED ABOVE ACCOUNT TOTALS (Account.GetGLAccountTotals())
       * 
       * FORMAT:
       *  GU Debit          $nnn,nnn.nn
       *  GU Credit         $nnn,nnn.nn
       *  
       *  
       */
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
      USE WATSC;

      SELECT Case WHEN Type = 'd' THEN 'GU Debit' ELSE 'GU Credit' END [Type], sum(amount) TotalAmount from (
       SELECT otid, cashierid, cast(transdt AS DATE) transdt, account, amount, type
      FROM dbo.ccGU INNER JOIN dbo.ccGUItem ON dbo.ccGU.GUId = dbo.ccGUItem.GUID
       WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE)) AS tmp
       GROUP BY type
       ORDER BY Type DESC

       ";
      try
      {

        var guTotals = Constants.Get_Data<CashierTotal>(sql, dbArgs);
        return guTotals;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<CashierTotal>();
      }
    }

    public static List<string> GetOutOfBalanceCashierIds(DateTime dateToBalance)
    {

      var param = new DynamicParameters();
      param.Add("@DateToBalance", dateToBalance);

      var query = @"
        USE WATSC;
          SELECT DISTINCT * FROM (
            SELECT   CashierId,OTId,NTUser,
              (SELECT     SUM(Total) AS ItemTtl
              FROM         dbo.ccCashierItem
              WHERE     (dbo.ccCashierItem.OTId = dbo.ccCashier.OTId)) AS ItemTtl,

              (SELECT SUM(AmtApplied) AS PmtTtl
              FROM dbo.ccCashierPayment
              WHERE (dbo.ccCashierPayment.OTId = dbo.ccCashier.OTId)) AS PmtTtl,

              (SELECT ISNULL(COUNT(*),0)
              FROM dbo.ccCashierPayment
              WHERE (dbo.ccCashierPayment.OTId = dbo.ccCashier.OTId) AND 
              (dbo.ccCashierPayment.PmtType = 'ESP')) AS EscrowPmt,
            
              (SELECT SUM(dbo.ccGUItem.Amount) AS GUTtl
              FROM dbo.ccGU INNER JOIN
              dbo.ccGUItem ON dbo.ccGU.GUId = dbo.ccGUItem.GUID
              WHERE (dbo.ccGU.OTId = dbo.ccCashier.OTId) and (dbo.ccGUItem.Type = 'c')) AS GUTtl

            FROM dbo.ccCashier
            WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE))
          AS tmp
          WHERE PmtTtl + EscrowPmt != GUTtl OR ItemTtl != GUTtl
          ORDER BY CashierId
      
      ";

      var i = Constants.Get_Data<string>(query, param);
      return i;
    }

    public static bool IsDjournalBalanced(List<CashierTotal> cs, List<CashierTotal> guTotals, List<Account> glTotals)
    {


      var totalCharges = (from t in cs
                          where t.Type.ToLower() == "total charges"
                          select t.TotalAmount).DefaultIfEmpty(0).First();

      var totalPayments = (from t in cs
                           where t.Type.ToLower() == "total payments"
                           select t.TotalAmount).DefaultIfEmpty(0).First();

      var totalGU = (from t in guTotals
                     select t.TotalAmount).DefaultIfEmpty(0).First();

      var totalGL = (from t in glTotals
                     select t.TotalAmount).Sum();

      if (totalCharges != totalPayments ||
          totalGU != totalCharges ||
          totalGU != totalGL)
      {
        return false;
      }


      return true;

      //var param = new DynamicParameters();


      //var query = @"

      //";

      //var i = Constants.Get_Data<string>(query, param).DefaultIfEmpty("").First();

      //return i;
    }
  }
}