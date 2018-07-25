using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Balancing
{
  public class CashierTotal
  {
    public string Type { get; set; }
    public double TotalAmount { get; set; }

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
       * 
       */
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
       --SELECT * CashierIds FROM DATE
        WITH CashierIdsToBalance (CashierId) AS (
        SELECT CashierId
        FROM dbo.ccCashier C
        WHERE CAST(TransDt AS DATE) = CAST(@DateToBalance AS DATE))
        
        -- SELECT * Payment Types FROM ccLOOKUP TABLE
        ,PaymentTypes (Code, SortKey,Narrative,CdType) AS 
        (
          SELECT DISTINCT Code,SortKey, Narrative, CdType
          FROM ccLookUp L
          WHERE CdType IN ('SPECIALPT','PMTTYPE')
        )

        -- CREATE TMP TABLE TO BE ABLE TO MERGE ALL TOTALS TO ONE WORKABLE TABLE
        SELECT Narrative Type, AmtApplied TotalAmount FROM 
          
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

          UNION

          SELECT L.SortKey,L.Code, L.Narrative,SUM(AmtApplied) AmtApplied, CdType 
           FROM 
           (
             SELECT PmtType, AmtApplied
             FROM  ccCashierPayment CP
             LEFT OUTER join ccCashier C ON C.OTId = CP.OTid
             INNER JOIN CashierIdsToBalance CIB ON C.CashierId = CIB.CashierId
           ) AS TempAllPayments
           RIGHT OUTER JOIN ccLookUp L ON LEFT(TempAllPayments.PmtType,5) = LEFT(L.CODE,5)
           WHERE L.CdType IN ('SPECIALPT','PMTTYPE')
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

  }
}