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
        USE WATSC;
        
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
        SELECT Narrative, AmtApplied FROM 
          
          (
          -- GET TOTAL AMOUNT OF CHARGES FOR BALANCING 
          -- CHECK THIS TOTAL AGAINST THE SUM(ccCashierPayment.AmtApplied) IN THE LAST SELECT STATEMENT
          SELECT
              00 SortKey,
              NULL Code,
              'Total Charges' Narrative,
              SUM(total) AmtApplied,
              'AA' CdType
            FROM cccashieritem
            WHERE CashierId IN (select cashierid from CashierIdsToBalance)

          UNION

          SELECT L.SortKey,L.Code, L.Narrative,SUM(AmtApplied) AmtApplied, CdType 
           FROM 
           (
             SELECT PmtType, AmtApplied
             FROM  ccCashierPayment CP
             LEFT OUTER join ccCashier C ON C.OTId = CP.OTid
             WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)
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
            inner join ccCashier C ON C.OTId = CP.OTid
            WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)
              AND PmtType IN ('CK', 'CA')
         
            UNION   
         
            SELECT 
              99 SortKey, 
              NULL Code, 
              'Total Deposit' Narrative, 
              SUM(AmtApplied),
              'ZC' CdType
            FROM ccCashierPayment CP
            inner join ccCashier C ON C.OTId = CP.OTid
            WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)  
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
            WHERE CashierId IN (SELECT CashierId FROM CashierIdsToBalance)

        ) AS TMP
        ORDER BY CdType, SortKey; --THIS ALLOWS FOR THE DATA TO BE IN THE SAME ORDER AS IT IS CURRENTLY
                                  -- SOLELY FOR CONTINUITY. THE ACTUAL LAYOUT MAY CHANGE BASED ON MOCKUP

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
      /**
       * THIS FUNCTION RETURNS THE GU Debit AND GU Credit AMOUNTS
       * IN Process AND DJournal, THIS IS DISPLAYED UNDER PROCESS (Payment.Process())
       * AND DISPLAYED ABOVE ACCOUNT TOTALS (Account.GetGLAccountTotals())
       * 
       * FORMAT:
       *  GU Debit          $nn,nnn.nn
       *  GU Credit         $nn,nnn.nn
       *  
       *  
       */
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

    // This is what is generated when they click the research button.
    // Without the ability to void payments, this will become unnecessary
    public static List<Payment> GetAllCashierIdTotals(DateTime DateToBalance)
    {
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@DateToBalance", DateToBalance);

      var sql = @"
      USE WATSC;
      DECLARE @DateToBalance DATE = DATEADD(dd, -1, GETDATE());

      WITH ALL_CHOSEN (CashierId , OTid, [Name], AmtApplied) AS (
      SELECT DISTINCT CI.CashierId ,CP.OTid, C.[Name], AmtApplied
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
      
      SELECT AC.CashierId, AC.OTid, AC.[Name],AC.AmtApplied, OT.total FROM ALL_CHOSEN AC
      INNER JOIN otidTotals OT ON OT.otid = AC.OTid
      UNION
      SELECT NULL,NULL,NULL,(SELECT SUM(AmtApplied) FROM ALL_CHOSEN),NULL
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