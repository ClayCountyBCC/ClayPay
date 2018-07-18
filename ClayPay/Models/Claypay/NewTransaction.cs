﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

using ClayPay.Controllers;
using System.Data;
using System.Data.SqlClient;
using System.Configuration;

namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    public UserAccess CurrentUser { get; set; }
    public string PayerCompanyName { get; set; } = "";
    public string PayerFirstName { get; set; } = ""; // Required
    public string PayerLastName { get; set; } = "";// Required
    public string PayerPhoneNumber { get; set; } = "";// Required
    public string PayerEmailAddress { get; set; } = "";
    public string ipAddress { get; set; } = "";
    public string PayerStreetAddress { get; set; } = ""; // Required
    public string PayerAddress2 // Required, but this is a combination of City State, Zip
    {
      get
      {
        return PayerCity + " " + PayerState + ", " + PayerZip;
      }
    }
    public string PayerCity { get; set; } = "";// Required
    public string PayerState { get; set; } = "";// Required
    public string PayerZip { get; set; } = "";// Required
    public int TransactionOTid { get; set; }
    public string TransactionCashierId { get; set; }
    public List<int> ItemIds { get; set; } = new List<int>();
    public List<Charge> Charges { get; set; }
    public CCPayment CCData { get; set; }
    public Payment CashPayment { get; set; }
    public Payment CheckPayment { get; set; }
    public Payment OtherPayment { get; set; } = new Payment(Payment.payment_type.impact_fee_credit); // for waivers / credits / etc.
    public List<Payment> Payments { get; set; } = new List<Payment>();
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> ProcessingErrors { get; set; } = new List<string>();
    public decimal TotalAmountDue { get; set; } = 0; // provided by the client, this is the amount they used to calculate how much money to accept.
    public decimal ChangeDue { get; set; } = 0;
    private DateTime TransactionDate { get; set; } = DateTime.Now;
    public NewTransaction()
    {
    }

    public bool ValidatePayerData()
    {
      // Required fields:
      // PayerFirstName
      // PayerLastName
      // PayerPhoneNumber
      // PayerStreetAddress
      // PayerCity
      // PayerState
      // PayerZip
      PayerCity = PayerCity.Trim();
      PayerFirstName = PayerFirstName.Trim();
      PayerLastName = PayerLastName.Trim();
      PayerCity = PayerCity.Trim();
      PayerState = PayerState.Trim();
      PayerZip = PayerZip.Trim();
      PayerPhoneNumber = PayerPhoneNumber.Trim();
      PayerEmailAddress = PayerEmailAddress.Trim();
      PayerCompanyName = PayerCompanyName.Trim();

      if(PayerFirstName.Length == 0)
      {
        Errors.Add("The Payer's First name is a required field.");
        return false;
      }
      if (PayerLastName.Length == 0)
      {
        Errors.Add("The Payer's Last name is a required field.");
        return false;
      }
      if (PayerPhoneNumber.Length == 0)
      {
        Errors.Add("The Payer's phone number is a required field.");
        return false;
      }
      if(PayerEmailAddress.Length > 0)
      {
        try
        {
          var email = new System.Net.Mail.MailAddress(PayerEmailAddress);
        }
        catch(FormatException fe)
        {
          Errors.Add("The email address provided does not appear to be in a valid format.");
          return false;
        }
      }
      if(PayerStreetAddress.Length == 0)
      {
        Errors.Add("The Payer's Street Address must be provided.");
        return false;
      }

      if(PayerCity.Length == 0)
      {
        Errors.Add("The Payer's City must be provided.");
        return false;
      }
      if (PayerState.Length == 0)
      {
        Errors.Add("The Payer's State must be provided.");
        return false;
      }
      if(PayerZip.Length == 0)
      {
        Errors.Add("The Payer's Zip Code must be provided.");
        return false;
      }

      return true;
    }

    public ClientResponse ProcessPaymentTransaction()
    {
      // Process credit card payment if there is one. this will be moved to a separate function
      if (CCData.Validated)
      {

        var pr = PaymentResponse.PostPayment(this.CCData, ipAddress);

        if (pr == null)
        {
          Errors.Add("There was an issue with processing the credit card transaction.");
          UnlockChargeItems();
          return new ClientResponse(Errors);
        }
        else
        {
          if (pr.ErrorText.Length > 0)
          {
            Errors.Add(pr.ErrorText);
            UnlockChargeItems();
            return new ClientResponse(Errors);
          }
          else
          {
            CCData.TransactionId = pr.UniqueId;
            CCData.ConvenienceFeeAmount = pr.ConvFeeAmount;
          }
        }
      }

      // Since we're ready to save, let's take the valid payments 
      // and add them to the payments list.
      if (CashPayment.Validated) Payments.Add(CashPayment);
      if (CCData.Validated)
      {
        Payments.Add(
          new Payment(CCData, 
                      Environment.MachineName.ToUpper() == "CLAYBCCIIS01" ? 
                        Payment.payment_type.credit_card_cashier : 
                        Payment.payment_type.credit_card_public));
      }
      if (CheckPayment.Validated) Payments.Add(CheckPayment);
      // OtherPayment will probably only be used in this process to apply
      // the partial impact fee credit when the rest of the fee is paid.
      if (OtherPayment.Validated) Payments.Add(OtherPayment);


      if (SaveTransaction()) // Unlock IDs at the end of this function
      {
        var amountPaid = (from payment in Payments select payment.AmountApplied).Sum();

        return new ClientResponse(TransactionCashierId, 
                                  this.CCData.TransactionId, 
                                  ProcessingErrors, 
                                  amountPaid, 
                                  ChangeDue, 
                                  CCData.Validated ? CCData.ConvenienceFeeAmount : 0);
      }
      else
      {
        if (this.CCData.Validated)
        {
          // getting here is bad
          ProcessingErrors.Add($@"\nPlease do not attempt the transaction again and contact the building department.
                                 Reference Credit Card Transaction Id: {this.CCData.TransactionId}");
          return new ClientResponse("", this.CCData.TransactionId, ProcessingErrors, 0, 0);
        }
        else
        {
          Errors.Add(@"There was an issue saving the transaction.");
          return new ClientResponse(Errors);
        }
      }
    }

    public bool ValidatePaymentTransaction()
    {
      // These rules do not include fields / forms, just how we validate the amount.
      // Payment Items to validate:      
      // 1. The Total charges must match the amount sent from the client.
      // 2. The Total amount paid must be equal to or greater than the total charges.
      //  2a. The total amount paid can only be greater than the amount paid if cash is being used.
      //  2b. The difference between the total amount paid and the total charges cannot be greater
      //      than the amount of cash paid. (TotalAmountPaid - TotalCharges) <= TotalCashPaid

      if (!ValidatePayerData()) // Lock IDs at the end of this function
      {
        return false;
      }

      if(ItemIds.Count() == 0)
      {
        Errors.Add("No charges were found, please refresh this page and add your charges again.");
        return false;
      }

      if (this.CashPayment.PaymentType != Payment.payment_type.cash ||
        this.CheckPayment.PaymentType != Payment.payment_type.check ||
        this.OtherPayment.PaymentType == Payment.payment_type.cash ||
        this.OtherPayment.PaymentType == Payment.payment_type.check || 
        this.OtherPayment.PaymentType == Payment.payment_type.credit_card_cashier ||
        this.OtherPayment.PaymentType == Payment.payment_type.credit_card_public)
      {
        this.Errors.Add("There is an issue with the chosen payment types.  Please refresh this page and try again.");
        return false;
      }

      decimal totalAmountPaid = 0;

      if (this.CCData.Validated)
      { // validate credit card data if exists
        Errors = this.CCData.Validate();

        if (Errors.Count() > 0) return false;

        totalAmountPaid += this.CCData.Amount;
      }


      if (this.CashPayment.Validated)
      {
        if (!this.CashPayment.Validate())
        {
          this.Errors.Add(this.CashPayment.Error);
          return false;
        }

        totalAmountPaid += this.CashPayment.Amount;

      }
      if (this.CheckPayment.Validated)
      {
        if (!this.CheckPayment.Validate())
        {
          this.Errors.Add(this.CheckPayment.Error);
          return false;
        }

        totalAmountPaid += this.CheckPayment.Amount;

      }

      // If not cashier and cash || check, return error
      if (!this.CurrentUser.djournal_access &&
        (this.CashPayment.Validated ||
        this.CheckPayment.Validated))
      {
        Errors.Add("Only cashier can accept cash and check payments");
        return false;
      }

      this.Charges = Charge.GetChargesByItemIds(ItemIds);
      var totalCharges = (from c in this.Charges
                          select c.Total).Sum();

      ChangeDue = totalAmountPaid - totalCharges;

      if (totalCharges != this.TotalAmountDue)
      {
        this.Errors.Add("Please clear your cart and try this payment again. It is likely that some of the charges in your cart have been paid, or their amounts have been changed.");
        return false;
      }

      if (CCData.Amount > totalCharges || CheckPayment.Amount > totalCharges)
      {
        Errors.Add("The Total Charges cannot be less than the amount paid for Checks or Credit Cards.");
        return false;
      }

      if (totalAmountPaid <= 0 || totalAmountPaid < totalCharges)
      {
        this.Errors.Add("Payment amount must be greater than 0 and equal to or greater than the sum of the charges.\n");
        return false;
      }

      // AmountTenderd and Total of charges can be different if cash is involved 
      if (CashPayment.Validated) // do this if there is a cash payment.
      {
        if (ChangeDue >= CashPayment.Amount)
        {
          Errors.Add("The amount returned to the customer cannot be greater than the amount of cash tendered.");
          return false;
        }
        CashPayment.AmountApplied = CashPayment.Amount - ChangeDue;
      }
      else
      {
        if (totalAmountPaid > totalCharges) // this won't include any cash payments.
        {
          Errors.Add("The amount paid cannot be greater than the Total Amount Due.  Please refresh the page and try again.");
          return false;
        }
      }
      if (Errors.Count > 0) return false;
      var lockCheck = LockChargeItems();
      if (!lockCheck)
      {
        Errors.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
        return false;
      }
      return true;
    }

    public bool LockChargeItems()
    {
      var sql = @"
        USE WATSC;
        BEGIN TRAN
          BEGIN TRY

            DELETE ccChargeItemsLocked
            WHERE TransactionDate < DATEADD(MI, -3, GETDATE());

            INSERT INTO ccChargeItemsLocked
            (ItemId)  
            VALUES
            (@ItemId)

            COMMIT;
          END TRY

          BEGIN CATCH
            ROLLBACK TRAN
          END CATCH
      ";
      return Constants.Exec_Query<List<Charge>>(sql, this.Charges) > 0;
      #region dapperProfiling
      // Profiling code to see what Dapper was doing.
      // this code required MiniProfiler (3.2.something, the latest didn't work)
      // and MiniProfiler.Integrations (2.2)
      //try
      //{
      //  var cs = Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"));
      //  var factory = new SqlServerDbConnectionFactory(cs);
      //  using (var connection = DbConnectionFactoryHelper.New(factory, CustomDbProfiler.Current))
      //  {
      //    try
      //    {
      //      //using (IDbConnection db = new SqlConnection(cs))
      //      //{
      //        var i = connection.Execute(sql, this.Charges);
      //        string commands = CustomDbProfiler.Current.ProfilerContext.GetCommands();
      //        return i > 0;
      //      //}
      //    }
      //    catch(Exception ex)
      //    {
      //      string test = CustomDbProfiler.Current.ProfilerContext.GetCommands();
      //      Constants.Log(ex, sql);
      //      return false;
      //    }
      //  }
      //}
      //catch (Exception ex)
      //{
      //  string commands = CustomDbProfiler.Current.ProfilerContext.GetCommands();
      //  Constants.Log(ex, sql);
      //  return false;
      //}

      #endregion
    }

    public void UnlockChargeItems()
    {
      var sql = @"
        USE WATSC;

        BEGIN TRAN
        BEGIN TRY
          DELETE FROM ccChargeItemsLocked
          WHERE TransactionDate < DATEADD(MI, -3, GETDATE())
            OR ItemId IN (@ItemId)
          COMMIT
        END TRY
        BEGIN CATCH
          ROLLBACK TRAN
        END CATCH";
      try
      {
        Constants.Exec_Query(sql, Charges);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
      }
    }

    public bool SaveTransaction()
    {

      if (!StartTransaction())
      {
        rollbackTransaction();
        return false;
      }
      if (!SaveCashierPaymentRows())
      {
        rollbackTransaction();
        return false;
      }
      if (!UpdateCashierItemRows_OTid_CashierId())
      {
        rollbackTransaction();
        return false;
      }
      var updateGU = (from p in Payments
                      where p.PaymentType == Payment.payment_type.cash ||
                            p.PaymentType == Payment.payment_type.check ||
                            p.PaymentType == Payment.payment_type.credit_card_cashier ||
                            p.PaymentType == Payment.payment_type.credit_card_public
                      select p).ToList().Count() > 0;
      if (updateGU)
      {

        if (!InsertGURows())
        {
          rollbackTransaction();
          return false;
        }
      }

      FinalizeTransaction();
      UnlockChargeItems();
      return true;

    }

    public bool StartTransaction()
    {
      var dp = new DynamicParameters();
      dp.Add("@CashierId", size: 12, dbType: DbType.String, direction: ParameterDirection.Output);
      dp.Add("@otId", dbType: DbType.Int32, direction: ParameterDirection.Output);
      dp.Add("@PayerCompanyName", PayerCompanyName);
      dp.Add("@PayerName", PayerFirstName + " " + PayerLastName);
      dp.Add("@UserName", CurrentUser.user_name);
      dp.Add("@TransactionDate", TransactionDate);
      dp.Add("@PayerPhoneNumber", PayerPhoneNumber);
      dp.Add("@PayerStreetAddress", PayerStreetAddress);
      dp.Add("@PayerStreet2", PayerCity + " " + PayerState + ", " + PayerZip);
      dp.Add("@IPAddress", ipAddress);

      string sql = @"
        USE WATSC;
        DECLARE @YR CHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS CHAR(4)), 2);

        EXEC dbo.prc_upd_ClayPay_ccNextAvail_GetNextCashierId 
          @CashierId OUTPUT,
          @YR;

        INSERT INTO ccCashier
          (CoName,CashierId,LstUpdt,[Name],TransDt,Phone,Addr1,Addr2,NTUser, PayerIPAddress)
        VALUES
          (
            @PayerCompanyName,
            @CashierId,
            @TransactionDate,
            @PayerName,
            @TransactionDate,
            @PayerPhoneNumber,
            @PayerStreetAddress,
            @PayerStreet2,
            @UserName, 
            @IPAddress
          );

        SET @otId = @@IDENTITY;";
      try
      {
        TransactionCashierId = "-1";
        TransactionOTid = -1;

        int i = Constants.Exec_Query(sql, dp);
        if(i != -1)
        {
          TransactionOTid = dp.Get<int>("@otId");
          TransactionCashierId = dp.Get<string>("@CashierId");
          return true;
        }
        return false;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return false;
        //TODO: add rollback in SaveTransaction function
      }
    }

    public bool GetNextCashierId()
    {
      // I don't know if the year is supposed to be the fiscal year.
      // the code in  prc_upd_ccNextCashierId sets FY = the @Yr var
      // code for @Yr checks the current year against the FY field and if it is not equal,
      // it updates the FY and next avail fieldfield
      var dp = new DynamicParameters();
      dp.Add("@CashierId", value: "", dbType: DbType.String, direction: ParameterDirection.Output);
      var query = @"
          USE WATSC;
          DECLARE @YR CHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS CHAR(4)), 2);

          EXEC dbo.prc_upd_ClayPay_ccNextAvail_GetNextCashierId 
            @CashierId OUTPUT,
            @YR;
      ";

      try
      {
        var i = Constants.Exec_Query(query,dp);
        if(i > 0)
        {
          TransactionCashierId = dp.Get<string>("@CashierId");
          return true;
        }
        else
        {
          TransactionCashierId = "-1";
          return false;
        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        TransactionCashierId = "-1";
        return false;
        //TODO: add rollback in SaveTransaction function
      }
    }

    public bool SaveCashierRow()
    {
      var dp = new DynamicParameters();
      dp.Add("@otId", dbType: DbType.Int32, direction: ParameterDirection.Output);

      //if(CurrentUser.authenticated) // Wha'ts the point of hardcoding a station number?
      //{
      //  dp.Add("@StationId", 1);
      //}
      dp.Add("@PayerCompanyName", PayerCompanyName);
      dp.Add("@CashierId", TransactionCashierId);
      dp.Add("@PayerName", PayerFirstName + " " + PayerLastName);
      dp.Add("@UserName", CurrentUser.user_name);
      dp.Add("@TransactionDate", TransactionDate);
      dp.Add("@PayerPhoneNumber", PayerPhoneNumber);
      dp.Add("@PayerStreetAddress", PayerStreetAddress);
      dp.Add("@PayerStreet2", PayerCity + " " + PayerState + ", " + PayerZip);
      dp.Add("@IPAddress", ipAddress);


      string query = @"
          USE WATSC;

          EXEC dbo.prc_ins_ClayPay_ccCashier_NewOTid 
            @otId int output, 
            @CoName = @PayerCompanyName,
            @CashierId = @CashierId,
            @Name = @PayerName,            
            @TransDt = @TransactionDate,
            @Phone = @PayerPhoneNumber,
            @Addr1 = @PayerStreetAddress,
            @Addr2 = @PayerCity + ' ' + @PayerState + ', ' + @PayerZip,
            @NTUser = @UserName, 
            @IPAddress = @IPAddress";
      try
      {
        var i = Constants.Exec_Query(query, dp);
        if (i > 0)
        {
           TransactionOTid = dp.Get<int>("@otId");
           return true;
        }
        else
        {
          TransactionOTid = -1;
          return false;
        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        TransactionOTid = -1;
        return false;
        //TODO: add rollback in SaveTransaction function
      }

    }


    private static DataTable CreateCashierPaymentDataTable()
    {
      var dt = new DataTable("CashierPayment");
      dt.Columns.Add("PaymentType", typeof(string));
      dt.Columns.Add("OTid", typeof(int));
      dt.Columns.Add("AmountApplied", typeof(decimal));
      dt.Columns.Add("AmountTendered", typeof(decimal));
      dt.Columns.Add("CheckNumber", typeof(string));
      dt.Columns.Add("TransactionId", typeof(string));
      dt.Columns.Add("Info", typeof(string));
      return dt;
    }

    public bool SaveCashierPaymentRows()
    {
      var dt = CreateCashierPaymentDataTable();
      foreach(Payment p in Payments)
      {
        dt.Rows.Add(
          p.PaymentTypeValue,
          TransactionOTid,
          p.AmountApplied,
          p.AmountTendered,
          p.CheckNumber,
          p.TransactionId, 
          PayerFirstName + " " + PayerLastName);
      }

      string query = $@"
          USE WATSC;
          INSERT INTO ccCashierPayment 
            (OTid, PmtType, AmtApplied, AmtTendered, Info, CkNo, TransactionId)
          SELECT
            OTid,
            PaymentType,
            AmountApplied,
            AmountTendered,
            Info,
            CheckNumber,
            TransactionId
          FROM @CashierPayment;";
      try
      {
        using (IDbConnection db = new SqlConnection(
          Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"))))
        {
          int i = db.Execute(query, new { CashierPayment = dt.AsTableValuedParameter("CashierPayment") }, commandTimeout: 60);
          return i > 0;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    public bool UpdateCashierItemRows_OTid_CashierId()
    {

      
      var query =$@"
        USE WATSC;

        UPDATE ccCashierItem 
        SET OTId = @OTID, CashierId = @CASHIERID
        WHERE itemId IN @ITEMIDS";
      try
      {
        var i = Constants.Exec_Query(query, new
        {
          ITEMIDS = ItemIds,
          OTID = TransactionOTid,
          CASHIERID = TransactionCashierId
        });
        return i > 0;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        TransactionOTid = -1;
        //TODO: add rollback in SaveTransaction function
        return false;
      }

    }

    public bool InsertGURows()
    {
      var dp = new DynamicParameters();
      dp.Add("@otid", TransactionOTid);
      dp.Add("@TransactionDate", this.TransactionDate);

      // I don't know if the year is supposed to be the fiscal year.
      // the code in  prc_upd_ccNextCashierId sets FY = the @Yr var
      // code for @Yr checks the current year against the FY field and if it is not equal,
      // it updates the FY and next avail fieldfield
      var query = @"
        USE WATSC;
        INSERT INTO ccGU 
          (OTId, CashierId, ItemId, PayID, CatCode, TransDt)
        SELECT DISTINCT CCI.OTId, CCI.CashierId, CCI.ItemId, NULL, CCI.CatCode, @TransactionDate
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
        WHERE CCI.OTId = @otid;

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
          INNER JOIN ccCashierPayment CP ON CCI.OTId = CP.OTid
          WHERE CCI.OTId = @otid
          ORDER BY CCI.ItemId, GL.Type";

      try
      {
        var i = Constants.Exec_Query(query, dp);
        return i > 0;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    public bool FinalizeTransaction()
    {
      var query = @"
      USE WATSC;
        USE WATSC;

      --Handle HoldIds
      UPDATE H
        SET HldDate = GETDATE(), 
        HldIntl = @UserName, 
        HldInput = @cashierId
          FROM bpHold H
          INNER JOIN ccCashierItem CI ON CI.HoldID = H.HoldID
          WHERE OTId = @otid



      UPDATE bpASSOC_PERMIT
      SET IssueDate = GETDATE()
      WHERE IssueDate IS NULL AND
        PermitNo IN
        (SELECT DISTINCT AssocKey
          FROM ccCashierItem
          WHERE OTId = @otid AND
          Assoc NOT IN('AP', 'CL') AND
          LEFT(AssocKey, 1) NOT IN('1', '7') AND
          (SELECT ISNULL(SUM(Total), 0) AS Total
            FROM ccCashierItem
            WHERE AssocKey IN(SELECT DISTINCT AssocKey
                              FROM ccCashierItem
                              WHERE OTId = @otid) AND
            CashierId IS NULL AND Total > 0) = 0);


      DECLARE @ExpDt VARCHAR(20) = (SELECT TOP 1 Description
          FROM clCategory_Codes WHERE Code = 'dt' AND Type_Code = '9');

      UPDATE clContractor
        SET IssueDt=GETDATE(), ExpDt=@ExpDt, BlkCrdExpDt=@ExpDt
      WHERE ContractorCd NOT LIKE 'AP%' AND 
            ContractorCd IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otid AND
                Assoc='CL' AND
                CatCode IN ('CLLTF', 'CLFE', 'CIAC', 'LFE') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@otid) AND
                CashierId IS NULL AND Total > 0) = 0);";
      return Constants.Exec_Query(query, new
      {
        otid = TransactionOTid,
        cashierId = TransactionCashierId,
        UserName = CurrentUser.user_name
      }) != -1;
      //if(IssueAssociatedPermits())
      //{
      //  Constants.Log($"There was a problem seeting the permit issue dates for OTID: {TransactionOTid}",
      //                $"Need to set Issue Date for permits based on charges with OTID: {TransactionOTid}.",
      //                "", "", "");

      //  Errors.Add($@"Problem Issuing Permits. Please contact Building department for assistance. Reference 
      //                        Receipt number {TransactionCashierId}.");

      //  return false;
      //}
      //if(!HandleHolds())
      //{
      //  Constants.Log($"There was a problem signing off holds for charges associated with OTID: {TransactionOTid}",
      //                $"Need to sign of holds based on charges with OTID: {TransactionOTid}.",
      //                "", "", "");
      //  Errors.Add($@"There was an issue signing of holds associated with the payment. 
      //                Please contact the building department for assistance.
      //                 Reference receipt number {TransactionCashierId}.");
      //  return false;
      //}
      //if (!UpdateContractorDates())
      //{
      //  Constants.Log($"There was a problem updating the contractors expiraction date. OTID: {TransactionOTid}",
      //                $"Need to update contractor based on paid charges with OTID: {TransactionOTid}.",
      //                "", "", "");
      //  Errors.Add($@"There was a problem updating the contractors expiraction date. 
      //                Please contact the building department for assistance.
      //                 Reference receipt number {TransactionCashierId}.");
      //  return false;
      //}
      //return true;
    }

    public bool rollbackTransaction()
    {
      /**
       * 1. delete ccGUItem where guid in (select guid from ccGU where otid = @TransactionOTId)
       * 2. delete ccGU where OTID = @TransactionOTId
       * 3. delete ccCashierPayment where OTID = @TransactionOTId
       * 4. delete ccCashier where OTID = @TransactionOTId
       * 5. update ccCashierItem set OTID = 0 or null, set CashierId = null
       * 
       * We do not care if FinalizeTransaction fails. Those rows can be updated manually
       * */
      var param = new DynamicParameters();
      param.Add("@otid", TransactionOTid);
      var query = $@"
        USE WATSC;
        BEGIN TRAN
            BEGIN TRY
            DELETE ccGUItem WHERE guid IN (SELECT guid FROM ccGU WHERE otid = @otid)
            DELETE ccGU where OTID = @otid
            DELETE ccCashierPayment where OTID = @otid
            DELETE ccCashier where OTID = @otid
            UPDATE ccCashierItem set OTID = 0,CashierId = null where OTId = @otid
            COMMIT;
          END TRY
        BEGIN CATCH
          ROLLBACK
        END CATCH";
      try
      {
        var i = Constants.Exec_Query(query, param);
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    //public string CreateEmailBody()
    //{
    //  var AssocKeys = GetAssocKeys(ItemIds);
    //  var chargeItems = new List<Charge>();

    //  foreach (var k in AssocKeys)
    //  {
    //    chargeItems.AddRange(Charge.Get(k));
    //  }

    //  var keys = String.Join(", \n", AssocKeys);
    //  string body = $"An online credit card payment of {this.CCData.Amount.ToString("C")}.\n";
    //  body += $"The Charges paid include:\n";
    //  foreach (var c in chargeItems)
    //  {
    //    body += $"{c.Description}\t\t{c.TotalDisplay}\n{keys}";
    //  }
    //  body += "\nThis payment is associated with the following items: \n" + keys;

    //  return body;
    //}

    //public List<string> GetAssocKeys(List<int> ItemIds)
    //{
    //  string query = @"
    //    SELECT DISTINCT LTRIM(RTRIM(AssocKey)) AS AssocKey FROM ccCashierItem
    //    WHERE ItemId IN @ids;";
    //  return Constants.Get_Data<string>(query, ItemIds);
    //}

  }
}
