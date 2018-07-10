using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

using ClayPay.Controllers;
using System.Data;

namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    private UserAccess useraccess { get; set; }

    public string PayerName { get; set; }
    public string PayerPhone { get; set; }
    public string PayerEmail { get; set; }
    private string ipAddress { get; set; }
    public string PayerAddress1 { get; set; }
    public string PayerAddress2 { get; set; }

    public string PayerCity { get; set; }
    public string PayerState { get; set; }
    public string PayerZip { get; set; }

    public int OTid { get; set; }
    public string CashierId { get; set; }
    public List<int> ItemIds { get; set; }
    private CCData CCPayment { get; set; }
    public List<Payment> Payments { get; set; }
    public List<string> Errors { get; set; }
    public decimal Change { get; set; }

    public NewTransaction()
    {

    }

    public NewTransaction ProcessTransaction(string ip, UserAccess ua)
    {
      ipAddress = ip;
      useraccess = ua;
      Errors = new List<string>();

      // process cc payments here
      if (ValidateTransaction())
      {
        // LockChargeItems();
        var charges = Charge.Get(ItemIds);

        // Process credit card payment if there is one. this will be moved to a separate function
        if (CCPayment.CardNumber != null && CCPayment.CardType != null && CCPayment.CardType != "" && CCPayment.CardNumber != "")
        {

          var pr = PaymentResponse.PostPayment(CCPayment, ipAddress);

          if (pr == null)
          {
            Errors.Add("There was an issue with processing the credit card transaction.");
            UnlockChargeItems();
            return this;
          }
          else
          {
            if (pr.ErrorText.Length > 0)
            {
              Errors.Add(pr.ErrorText);
              UnlockChargeItems();
              return this;
            }
            else
            {
              CCPayment.TransactionId = pr.UniqueId;
              try
              {
                Payments.Add(new Payment(CCPayment, ua));
              }
              catch (Exception ex)
              {
                Constants.Log(ex);
                Errors.Add("Issue adding credit card payment to Payment List");
                return this;
              }

            }
          }
        }


        // Validate, Save, and Finalize all payment types here

        // Inside pr.Save take all payments and process them.
        if (Errors.Count() == 0)
        {
          if (SavePayments())
          {
            FinalizePayments();
          }
          else
          {
            // getting here is bad
            Errors.Add("There was an issue saving the transaction.");
            // This may be where we put the transaction to attempt it again.
          }

          // This will be moved to new function
          if (Constants.UseProduction())
          {
            if (ua.authenticated)
            {

            }
            else
            {
              Constants.SaveEmail("OnlinePermits@claycountygov.com",
                $"Payment made - Receipt # {CashierId}, Transaction # {CCPayment.TransactionId} ",
                CreateEmailBody());
            }
          }
          else
          {
            if (ua.authenticated)
            {

            }
            else
            {
              Constants.SaveEmail("daniel.mccartney@claycountygov.com",
              $"TEST Payment made - Receipt # {CashierId}, Transaction # {CCPayment.TransactionId} -- TEST SERVER",
              CreateEmailBody());
            }
          }
        }
      }
      UnlockChargeItems();
      return this;
    }

    public bool ValidateTransaction()
    {
      if (ipAddress.Length == 0)
      {
        Constants.Log("Issue in PayController", "IP Address could not be captured", "", "", "");
        //Errors.Add("IP Address could not be captured");
      }

      Errors = CCPayment.ValidateCCData(CCPayment);
      if (Errors.Count() > 0) return false;


      if ((from p in Payments
         where p.GetPaymentTypeString() == ""
         select p).ToList().Count() > 0)
      {

        Errors.Add($"There is an issue recording one or more payment types in this transaction.");
        Constants.Log("issue with recording payment type.",
                      "Error setting payment type.",
                      "",
                      $"Number of payment types: {Payments.Count()}, function call: Payment.SetPaymentTypeString().", "");
        return false;
      }

      // If not cashier and cash || check, return error
      if (!useraccess.in_claycashier_djournal_group &&
         !useraccess.in_claycashier_admin_group &&
         (from p in Payments
          where p.GetPaymentTypeString() == "CK" ||
          p.GetPaymentTypeString() == "CA"
          select p).ToList().Count() > 0
         )
      {
        Errors.Add("Only cashier can accept cash and check payments");
        return false;
      }

      // validate credit card data



      var totalCharges = (from c in Charge.Get(ItemIds) select c.Total).Sum();
      decimal totalPaymentAmount = (from p in Payments select p.Amount).Sum();

      if (totalPaymentAmount <= 0 || totalPaymentAmount < totalCharges)
      {
        Errors.Add("Payment amount must be greater than 0 and equal to or greater than the sum of the charges.\n");
        return false;
      }


      // AmountTenderd and Total of charges can be different if cash is involved 
      var hasCash = (from p in Payments
                     where p.PaymentType == Payment.payment_type_enum.cash
                     select p).ToList().Count() > 0;

      if ((!hasCash && totalPaymentAmount != totalCharges))
      {
        Errors.Add("The total for this transaction has changed.  Please check the charges and try again.");
        return false;
      }

      if (hasCash)
      {
        if (Change > totalPaymentAmount)
        {
          Change = 0;
          Errors.Add("The amount returned to the customer cannot be greater than the amount of cash tendered.");
          return false;
        }
        else
        {
          Change = totalPaymentAmount - totalCharges;
        }
      }

      if (Errors.Count == 0)
      {
        if (LockChargeItems() == 0)
        {
          Errors.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
          return false;
        }
      }
      return true;
    }

    IMPACT FEE WAIVER FUNCTION

    public int LockChargeItems()
    {
      if (ItemIds != null && ItemIds.Count() > 0)
      {
        var param = new DynamicParameters();
        param.Add("@items", ItemIds);
        var sql = @"
        USE WATSC;

        DECLARE @LockItems varchar(20) = 'LockingItems';  
        BEGIN TRAN @LockItems
          BEGIN TRY
            DELETE ccChargeItemsLocked
            WHERE TransactionDate < DATEADD(MI, -3, GETDATE())

            INSERT INTO ccChargeItemsLocked
            (ItemId)
            VALUES
            (@items)


            COMMIT
          END TRY
          BEGIN CATCH
            ROLLBACK TRAN @LockItems
            -- PRINT 'THIS COULD BE A CUSTOM MESSAGE'
            -- PRINT ERROR_MESSAGE()
            -- Error can be returned from within the CATCH by using a print statement or 
            -- the actual error can be raised using 
            --    RAISERROR (ERROR_MESSAGE() -- Message text.  
            --      ERROR_SEVERITY(), -- Severity.  
            --      ERROR_STATE() -- State.  
            --    );  

          END CATCH
      ";

        try
        {
          return Constants.Exec_Query(sql, param);  // return false if no rows affected
        }
        catch (Exception ex)
        {
          Constants.Log(ex, sql);
          return -1;
        }
      }

      return -1;
    }

    public void UnlockChargeItems()
    {
      if (ItemIds != null && ItemIds.Count() > 0)
      {
        var param = new DynamicParameters();
        param.Add("@itemIdsToUnlock", ItemIds);
        var sql = @"
        USE WATSC;

        BEGIN TRAN
        BEGIN TRY
        DELETE ccChargeItemsLocked
        WHERE TransactionDate < DATEADD(MI, -3, GETDATE())
          OR ItemId IN (@itemIdsToUnlock)
          COMMIT
        END TRY
        BEGIN CATCH
          PRINT ERROR_MESSAGE()
        END CATCH
      
      ";
        try
        {
          Constants.Exec_Query(sql, param);
        }
        catch (Exception ex)
        {
          Constants.Log(ex, sql);
        }
      }
    }

    public bool SavePayments()
    {
      var transId = (from p in Payments 
                     where p.GetPaymentTypeString() != "CA" 
                        && p.GetPaymentTypeString() != "CK" 
                     select p.TransactionId).FirstOrDefault();
      var dbArgs = new DynamicParameters();

      dbArgs.Add("@PayerName", PayerName);
      dbArgs.Add("@Total", CCPayment.Total);
      dbArgs.Add("@TransId", transId);
      dbArgs.Add("@ItemIds", ItemIds);
      dbArgs.Add("@TransDt", DateTime.Now);


      string query = @"
        DECLARE @CashierId VARCHAR(9) = NULL;
        DECLARE @otId int = NULL;

        BEGIN TRANSACTION;

        BEGIN TRY
          EXEC dbo.prc_upd_ClayPay_ccNextAvail_GetNextCashierId @CashierId OUTPUT;
          
          EXEC dbo.prc_ins_ClayPay_ccCashier_NewOTid 
            @otId int output, 
            @CoName varchar(50),
            @CashierId varchar(10) = null,
            @Name varchar(50),
            @OperId varchar(4),
            @TransDt DateTime = null,
            @StationId Int = null,
            @Phone varchar(12),
            @Addr1 varchar(50),
            @Addr2 varchar(50),
            @NTUser varchar(50)

          EXEC dbo.prc_ins_ClayPay_ccCashierPayment_NewPayment
            @PayId = 0,
            @OTId = @otId, 
            @PmtType ='CC On',
            @AmtApplied = @Total,
            @AmtTendered = @Total, 
            @PmtInfo = @PayerName,
            @CkNo = @TransId
            

          UPDATE ccCashierItem 
            SET OTId = @otId, CashierId = @CashierId
            WHERE itemId IN (@ItemIds)

          -- Add the ccGU rows
            EXEC dbo.prc_ins_ClayPay_ccGU_NewGU
              @OTId = @otId

          -- Add the ccGUItem rows
          INSERT INTO ccGUItem (GUID, Account, Amount, Type)
          SELECT 
            GU.GUId,
            GL.Fund + '*' + GL.Account + '**' AS Account,
          FORMAT(
          CASE GL.[Percent] 
            WHEN 0.05 THEN
              CASE WHEN CAST(ROUND((Total * 99.9) / 100, 2) + (ROUND((Total * 0.05) / 100, 2)*2) AS MONEY) > CCI.Total THEN
                CASE WHEN Fund <> '001' THEN 
                  ROUND((Total * GL.[Percent]) / 100, 2) - .01
                ELSE 
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            WHEN 50 THEN
              CASE WHEN (ROUND((Total * GL.[Percent]) / 100, 2)*2) <> CCI.Total THEN
                CASE WHEN GL.Account = '322100' THEN
                    ROUND((Total * GL.[Percent]) / 100, 2) + (CCI.Total -  (ROUND((Total * GL.[Percent]) / 100, 2)*2))
                ELSE
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            ELSE
              ROUND(Total / (100 / GL.[Percent]), 2) 
            END
          , 'N2') AS Amount,
            GL.Type
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          INNER JOIN ccGU GU ON CCI.OTId = GU.OTId AND CCI.ItemId = GU.ItemId
          WHERE CCI.OTId = @OTId
          ORDER BY CCI.ItemId, GL.Type
      
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        END CATCH;
        
        IF @@TRANCOUNT > 0
          COMMIT TRANSACTION;";
      try
      {
        var i = Constants.Exec_Query(query, dbArgs);
        CashierId = dbArgs.Get<string>("@CashierId");
        OTid = dbArgs.Get<Int32>("@otId");
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    public bool Finalize()
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@cId", CashierId);
      dbArgs.Add("@otId", OTId);
      //DECLARE @cId VARCHAR(9) = NULL;
      //DECLARE @otId int = NULL;

      string query = @"
          -- Handle Clearance Sheet Holds
          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          INNER JOIN (
          SELECT DISTINCT 
            CASE CCI.Assoc
              WHEN 'IF' THEN '1IMP'
            ELSE 
              CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
                CASE CCI.CatCode
                  WHEN 'REV' THEN '1REV'
                  WHEN 'REVF' THEN '0REV'
                  WHEN 'CLA' THEN '1SWF'
                ELSE ''
                  END
              ELSE
                ''
              END
            END AS HldCd,
            CASE WHEN CCI.Assoc = 'IF' THEN ''
            ELSE CCI.AssocKey
            END AS PermitNo,
            CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
            ELSE ''
            END AS Clrsht
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          WHERE CCI.OTId = 0
          AND CCI.Assoc='IF'
          ) AS C ON H.Clrsht=C.Clrsht AND H.HldCd = C.HldCd
          WHERE C.HldCd <> '' AND C.Clrsht <> '';

          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          INNER JOIN (
          SELECT DISTINCT 
            CASE CCI.Assoc
              WHEN 'IF' THEN '1IMP'
            ELSE 
              CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
                CASE CCI.CatCode
                  WHEN 'REV' THEN '1REV'
                  WHEN 'REVF' THEN '0REV'
                  WHEN 'CLA' THEN '1SWF'
                ELSE ''
                  END
              ELSE
                ''
              END
            END AS HldCd,
            CASE WHEN CCI.Assoc = 'IF' THEN ''
            ELSE CCI.AssocKey
            END AS PermitNo,
            CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
            ELSE ''
            END AS Clrsht
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          WHERE CCI.OTId = @otId
          AND CCI.Assoc='IF'
          ) AS C ON H.PermitNo=C.PermitNo AND H.HldCd = C.HldCd
          WHERE C.HldCd <> '' AND C.PermitNo <> '';

          -- Handle HoldIds
          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          WHERE HoldId IN 
            (SELECT DISTINCT HoldId 
              FROM ccCashierItem 
              WHERE HoldId > 0 AND OTId=@otId);

          -- Issue Associated Permits
          UPDATE bpASSOC_PERMIT
          SET IssueDate=GETDATE()
          WHERE IssueDate IS NULL AND
            PermitNo IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otId AND
              Assoc NOT IN ('AP', 'CL') AND
              LEFT(AssocKey, 1) NOT IN ('1', '7') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@otId) AND
                CashierId IS NULL AND Total > 0) = 0);

          -- Update Contractor Payments
          DECLARE @ExpDt VARCHAR(20) = (SELECT TOP 1 Description
          FROM clCategory_Codes WHERE Code = 'dt' AND Type_Code = '9');
          
          UPDATE clContractor
          SET IssueDt=GETDATE(), ExpDt=@ExpDt, BlkCrdExpDt=@ExpDt
          WHERE ContractorCd NOT LIKE 'AP%' AND 
            ContractorCd IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otId AND
                Assoc='CL' AND
                CatCode IN ('CLLTF', 'CLFE', 'CIAC', 'LFE') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@OTId) AND
                CashierId IS NULL AND Total > 0) = 0);";
      try
      {
        var i = Constants.Exec_Query(query, dbArgs);
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    public string Save_GetNextCashierId_Query()
    {
      //var param = new DynamicParameters();
      //param.Add("@YR", DateTime.Now.Year.ToString("yy"));


      // I don't know if the year is supposed to be the fiscal year.
      // the code in  prc_upd_ccNextCashierId sets FY = the @Yr var
      // code for @Yr checks the current year against the FY field and if it is not equal,
      // it updates the FY and next avail fieldfield
      var sql = @"
      DECLARE @YR VARCHAR(2) = RIGHT(CAST(DATEPART(YEAR,GETDATE()) AS VARCHAR), 2)

      SELECT RTRIM(CAST(FY AS CHAR(2))) + '-' +  
        REPLICATE('0', 6-LEN(LTRIM(CAST(NextAvail AS VARCHAR(6)))))  + 
        CAST(NextAvail AS VARCHAR(6)) CashierId 
      INTO #Next_Id
      FROM ccNextAvail 
      WHERE NAKey = 'Cashier'
       
      UPDATE ccNextAvail
      SET
        NextAvail = CASE WHEN FY != @YR THEN 1 ELSE NextAvail + 1 END,
        FY = CASE WHEN FY != @YR THEN @YR ELSE FY END
      WHERE NAKey = 'Cashier'

      SELECT CashierId FROM #Next_Id
      DROP TABLE #Next_Id
      ";

      return sql;
    }

    public string Save_InsertNewCashierRow_Query(string cashierId, string name, string NTUser, int stationId)
    {
      //var param = new DynamicParameters();
      //param.Add("@CashierId", cashierId);
      //param.Add("@name", name);
      //param.Add("@NTUser", NTUser);
      //param.Add("@StationId", stationId);
      return @"
      DECLARE @OTid INT;

      INSERT INTO ccCashier
        (Name, CashierId, LstUpdt, OperId, TransDt, StationId)
      VALUES     
        (@Name, @CashierId, @NTUser, @OperId, GETDATE(), @StationId)
      set @OTId = @@IDENTITY
      ";

    }

    public string Save_UpdateCashierRow_Query(int OTid, string phone, string address1, string address2, string name, string NTUser, int stationId)
    {
      //var param = new DynamicParameters();
      //param.Add("@OTid", OTid);
      //param.Add("@name", name);
      //param.Add("@phone", phone);
      //param.Add("@address1", address1);
      //param.Add("@address2", address2);
      //param.Add("@NTUser", NTUser);
      //param.Add("@StationId", stationId);
      return @"

      UPDATE ccCashier
      SET Name =@Name, CoName =@CoName, Phone =@Phone, Addr1 =@Addr1, Addr2 =@Addr2, 
                  NTUser =@NTUser, StationId =@StationId, TimeStamp =GETDATE()
      WHERE   (OTId = @OTId)
      ";

    }

    public string Save_UpdateCashierItemRows_Query(List<int> itemIds)
    {
      //var param = new DynamicParameters();
      //param.Add("@OTid", OTId);
      //param.Add("@ItemIds", itemIds);
      return @"
      UPDATE ccCashierItem 
      SET OTId = @otId, CashierId = @cId
      WHERE itemId IN @ItemIds
      ";

    }

    public string Save_AddGURows_Query(int OTid)
    {
      //var param = new DynamicParameters();
      //param.Add("@OTid", OTId);
      return @"
        INSERT INTO ccGU (OTId, CashierId, ItemId, PayID, CatCode, TransDt)
        SELECT DISTINCT CCI.OTId, CCI.CashierId, CCI.ItemId, NULL, CCI.CatCode, GETDATE()
        FROM ccCashierItem CCI
        INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
        WHERE CCI.OTId = @OTId

      ";
    }

    public string Save_AddGUIItemRows_Query(int OTid)
    {
      //var param = new DynamicParameters();
      //param.Add("@OTid", OTId);
      return @"
          INSERT INTO ccGUItem (GUID, Account, Amount, Type)
          SELECT 
            GU.GUId,
            GL.Fund + '*' + GL.Account + '**' AS Account,
          FORMAT(
          CASE GL.[Percent] 
            WHEN 0.05 THEN
              CASE WHEN CAST(ROUND((Total * 99.9) / 100, 2) + (ROUND((Total * 0.05) / 100, 2)*2) AS MONEY) > CCI.Total THEN
                CASE WHEN Fund <> '001' THEN 
                  ROUND((Total * GL.[Percent]) / 100, 2) - .01
                ELSE 
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            WHEN 50 THEN
              CASE WHEN (ROUND((Total * GL.[Percent]) / 100, 2)*2) <> CCI.Total THEN
                CASE WHEN GL.Account = '322100' THEN
                    ROUND((Total * GL.[Percent]) / 100, 2) + (CCI.Total -  (ROUND((Total * GL.[Percent]) / 100, 2)*2))
                ELSE
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            ELSE
              ROUND(Total / (100 / GL.[Percent]), 2) 
            END
          , 'N2') AS Amount,
            GL.Type
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          INNER JOIN ccGU GU ON CCI.OTId = GU.OTId AND CCI.ItemId = GU.ItemId
          WHERE CCI.OTId = @OTId
          ORDER BY CCI.ItemId, GL.Type

      ";

    }

    public string Finalize_UpdateClearanceSheetHolds_Query(string cashierId, string username)
    {
      return @"
      -- Handle Clearance Sheet Holds
      UPDATE H
        SET HldDate = GETDATE(), 
          HldIntl ='claypay', 
          HldInput =@cId
      FROM bpHold H
      INNER JOIN (
      SELECT DISTINCT 
        CASE CCI.Assoc
          WHEN 'IF' THEN '1IMP'
        ELSE 
          CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
            CASE CCI.CatCode
              WHEN 'REV' THEN '1REV'
              WHEN 'REVF' THEN '0REV'
              WHEN 'CLA' THEN '1SWF'
            ELSE ''
              END
          ELSE
            ''
          END
        END AS HldCd,
        CASE WHEN CCI.Assoc = 'IF' THEN ''
        ELSE CCI.AssocKey
        END AS PermitNo,
        CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
        ELSE ''
        END AS Clrsht
      FROM ccCashierItem CCI
      INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
      WHERE CCI.OTId = 0
      AND CCI.Assoc='IF'
      ) AS C ON H.Clrsht=C.Clrsht AND H.HldCd = C.HldCd
      WHERE C.HldCd <> '' AND C.Clrsht <> '';

      UPDATE H
        SET HldDate = GETDATE(), 
          HldIntl ='claypay', 
          HldInput =@cId
      FROM bpHold H
      INNER JOIN (
      SELECT DISTINCT 
        CASE CCI.Assoc
          WHEN 'IF' THEN '1IMP'
        ELSE 
          CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
            CASE CCI.CatCode
              WHEN 'REV' THEN '1REV'
              WHEN 'REVF' THEN '0REV'
              WHEN 'CLA' THEN '1SWF'
            ELSE ''
              END
          ELSE
            ''
          END
        END AS HldCd,
        CASE WHEN CCI.Assoc = 'IF' THEN ''
        ELSE CCI.AssocKey
        END AS PermitNo,
        CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
        ELSE ''
        END AS Clrsht
      FROM ccCashierItem CCI
      INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
      WHERE CCI.OTId = @otId
      AND CCI.Assoc='IF'
      ) AS C ON H.PermitNo=C.PermitNo AND H.HldCd = C.HldCd
      WHERE C.HldCd <> '' AND C.PermitNo <> '';
      ";

    }

    public string Finalize_HandleHolds_Query()
    {
      return @"
      --Handle HoldIds
        USE WATSC;
        WITH HoldIds (HoldId) AS (
          SELECT HoldId FROM ccCashierItem
          WHERE HoldId > 0
            AND OTid = @OTid)
        UPDATE H
         SET HldDate = GETDATE(), 
             HldIntl = 'claypay', 
             HldInput = @cId
         FROM bpHold H
         INNER JOIN HoldIds HI ON H";


    }

    public string Finalize_IssueAssociatedPermits_Query()
    {
      return @"
        

      --Issue Associated Permits
          UPDATE bpASSOC_PERMIT
          SET IssueDate = GETDATE()
          WHERE IssueDate IS NULL AND
            PermitNo IN
            (SELECT DISTINCT AssocKey
              FROM ccCashierItem
              WHERE OTId = @otId AND
              Assoc NOT IN('AP', 'CL') AND
              LEFT(AssocKey, 1) NOT IN('1', '7') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total
                FROM ccCashierItem
                WHERE AssocKey IN(SELECT DISTINCT AssocKey
                                  FROM ccCashierItem
                                  WHERE OTId = @otId) AND
                CashierId IS NULL AND Total > 0) = 0);
                ";
    }

    public string Finalize_UpdateContractorPayments_Query()
    {
      return @"         
          -- Update Contractor Payments
          DECLARE @ExpDt VARCHAR(20) = (SELECT TOP 1 Description
          FROM clCategory_Codes WHERE Code = 'dt' AND Type_Code = '9');";


    }

    public string Finalize_UpdateContractor_Query()
    {
      return @"          UPDATE clContractor
          SET IssueDt=GETDATE(), ExpDt=@ExpDt, BlkCrdExpDt=@ExpDt
          WHERE ContractorCd NOT LIKE 'AP%' AND 
            ContractorCd IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otId AND
                Assoc='CL' AND
                CatCode IN ('CLLTF', 'CLFE', 'CIAC', 'LFE') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@OTId) AND
                CashierId IS NULL AND Total > 0) = 0);";
    }

    //public void GenerateEmail()
    //{

    //}

    public string CreateEmailBody()
    {
      string keys = String.Join(", \n", GetAssocKeys(ItemIds));
      string body = $"A payment was made totalling { ((from c in Charge.Get(ItemIds) select c.Total).Sum()).ToString("C") }\n";
      body += $"consisting of {Payments.Count()} payment types:\n";
      foreach (var p in Payments)
      {
        if(p.GetPaymentTypeString() == "CC On")
        body += $@"Payment {(Payments.IndexOf(p) + 1)}: {GetPayType(p.PaymentType)} payment of {p.Amount.ToString("C")}.\n";
      }
      return body += "This payment was for the following items: \n" + keys;
    }

    public List<string> GetAssocKeys(List<int> ItemIds)
    {
      string query = @"
        SELECT DISTINCT LTRIM(RTRIM(AssocKey)) AS AssocKey FROM ccCashierItem
        WHERE ItemId IN @ids;";
      return Constants.Get_Data<string>(query, ItemIds);
    }

    public string GetPayType(Payment.payment_type_enum paytype)
    {
      switch (paytype)
      {
        case Payment.payment_type_enum.check:
          return "A check";
        case Payment.payment_type_enum.cash:
          return "A cash";
        case Payment.payment_type_enum.cc_online:
          return "An online credit card";
        case Payment.payment_type_enum.visa:
          return "A Visa";
        case Payment.payment_type_enum.mastercard:
          return "MasterCard";
        case Payment.payment_type_enum.discover:
          return "A Discover Card";
        case Payment.payment_type_enum.amex:
          return "An American Express";
        case Payment.payment_type_enum.impact_fee_credit:
          return "An impactfee credit";
        case Payment.payment_type_enum.impact_waiver_road:
          return "A road impact fee waiver";
        case Payment.payment_type_enum.impact_waiver_school:
          return "A school impact fee waiver";
        case Payment.payment_type_enum.impact_fee_exemption:
          return "An impact fee exemption";
        default:
          return "An unknown";
      }
    }

  }
}
// email