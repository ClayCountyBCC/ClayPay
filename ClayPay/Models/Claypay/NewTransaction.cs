﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Web.Http;
using System.Net;
using System.IO;
using System.Data;
using System.Data.SqlClient;
using Dapper;
using ClayPay.Models.Claypay;
using System.Web.WebPages;


namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    public CashierData TransactionCashierData { get; set; } = new CashierData();
    public List<int> ItemIds { get; set; } = new List<int>();
    public List<Charge> Charges { get; set; } = new List<Charge>();
    public CCPayment CCData { get; set; } = new CCPayment();
    public Payment CashPayment { get; set; } = new Payment(Payment.payment_type.cash);
    public Payment CheckPayment { get; set; } = new Payment(Payment.payment_type.check);
    public Payment OtherPayment { get; set; } = new Payment(Payment.payment_type.impact_fee_credit); // for waivers / credits / etc.
    public List<Payment> Payments { get; set; } = new List<Payment>();
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> ProcessingErrors { get; set; } = new List<string>();
    public decimal TotalAmountDue { get; set; } = 0; // provided by the client, this is the amount they used to calculate how much money to accept.
    public string ConvenienceFeeAmount { get; set; } = "";
    public decimal ChangeDue { get; set; } = 0;
    public DateTime TransactionDate { get; set; } = DateTime.Now;
    public class TransactionTiming
    {
      public string CashierId { get; set; } = "";
      public DateTime Transaction_Start { get; set; } = DateTime.MaxValue;
      public DateTime Get_CashierId_Otid { get; set; } = DateTime.MaxValue;
      public DateTime Send_CCData_Authorize_Transmit { get; set; } = DateTime.MaxValue;
      public DateTime Return_CCData_Authorize_Transmit { get; set; } = DateTime.MaxValue;
      public DateTime Send_CCData_Settle_Transmit { get; set; } = DateTime.MaxValue;
      public DateTime Return_CCData_Settle_Transmit { get; set; } = DateTime.MaxValue;
      public DateTime Save_Cashier_Payment_Start { get; set; } = DateTime.MaxValue;
      public DateTime Update_CashierItem_Start { get; set; } = DateTime.MaxValue;
      public DateTime Insert_Update_GURows_Start { get; set; } = DateTime.MaxValue;
      public DateTime Insert_Update_GURows_End { get; set; } = DateTime.MaxValue;
      public DateTime Finalize_Transaction_Start { get; set; } = DateTime.MaxValue;
      public DateTime Finalize_Transaction_End { get; set; } = DateTime.MaxValue;
      public DateTime Rollback_Transaction { get; set; } = DateTime.MaxValue;


      public TransactionTiming()
      {

      }
    }
    public class bad_guitems
    {
      public int guitem_id { get; set; }
      public decimal amount { get; set; }
      public bad_guitems()
      {

      }

     }


    public static TransactionTiming TimingDates { get; set; }

    public NewTransaction()
    {
      TimingDates = new TransactionTiming();
      TimingDates.Transaction_Start = DateTime.Now;
    }
    public static List<DateTime> ActionDates { get; set; } = new List<DateTime>();

    public ClientResponse ProcessPaymentTransaction()
    {
      // Process credit card payment if there is one. this will be moved to a separate function
      if (CCData.Validated)
      {
        TimingDates.Send_CCData_Authorize_Transmit = DateTime.Now;

        var pr = PaymentResponse.PostPayment(this.CCData, TransactionCashierData.ipAddress);

        TimingDates.Return_CCData_Authorize_Transmit = DateTime.Now;

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
            ConvenienceFeeAmount = GetFee(CCData.Amount);

            CCData.ConvenienceFee = ConvenienceFeeAmount;

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
        //var amountPaid = (from payment in Payments select payment.AmountApplied).Sum();


        if (CCData.Validated && CCData.TransactionId.Length > 0)
        {
          var pr = PaymentResponse.PostPayment(this.CCData, "");
          if (pr == null)
          {
            Errors.Add("There was an issue settling the credit card transaction.");

            rollbackTransaction("ProcessPaymentTransaction: pr is NULL, var pr = PaymentResponse.PostPayment(this.CCData, \"\"");
            UnlockChargeItems();
            InsertTransactionTiming();
            return new ClientResponse(Errors);
          }
          else
          {
            if (pr.ErrorText.Length > 0)
            {
              Errors.Add(pr.ErrorText);
              rollbackTransaction($@"ProcessPaymentTransaction: pr.ErrorText.Length > 0
                                    pr.ErrorText = {pr.ErrorText}");
              UnlockChargeItems();
              InsertTransactionTiming();
              return new ClientResponse(Errors);
            }
          }
        }

        // Change: moved FinalizeTransaction here to prevent finalizing if transaction has been rolled back.
        if (!Payments.Any(p => p.PaymentType == Payment.payment_type.impact_fee_credit
                   || p.PaymentType == Payment.payment_type.impact_fee_exemption
                   || p.PaymentType == Payment.payment_type.impact_waiver_road
                   || p.PaymentType == Payment.payment_type.impact_waiver_school
                   ))

        {
          FinalizeTransaction();
        }
        
        var cr = new ClientResponse(TransactionCashierData.CashierId.Trim(), Charges);
        cr.SendPayerEmailReceipt(TransactionCashierData.PayerEmailAddress.Trim());

        InsertTransactionTiming();
        return cr;

      }
      else
      {
        if (this.CCData.Validated)
        {
          // getting here is bad
          ProcessingErrors.Add($@"\nPlease do not attempt the transaction again and contact the building department.
                                 Reference Credit Card Transaction Id: {this.CCData.TransactionId}");
          return new ClientResponse(ProcessingErrors, this.CCData.TransactionId);
        }
        else
        {
          Errors.Add(@"There was an issue saving the transaction.");
          return new ClientResponse(Errors);
        }
      }
    }

    public static string GetFee(decimal Amount)
    {
      var pr = new PaymentResponse(Amount, Constants.PaymentTypes.Building, true);
      return pr.CalcFee(Amount);
    }

    public bool ValidatePaymentTransaction()
    {
      Errors = TransactionCashierData.ValidatePayerData();
      if (Errors.Count() > 0) // Lock IDs at the end of this function
      {
        return false;
      }

      // TODO: VALIDATE ALL CHARGES IN TRANSACTION ARE VALID AND HAVE ASSOCIATED GL
      

      // These rules do not include fields / forms, just how we validate the amount.
      // Payment Items to validate:      
      // 1. The Total charges must match the amount sent from the client.
      // 2. The Total amount paid must be equal to or greater than the total charges.
      //  2a. The total amount paid can only be greater than the amount paid if cash is being used.
      //  2b. The difference between the total amount paid and the total charges cannot be greater
      //      than the amount of cash paid. (TotalAmountPaid - TotalCharges) <= TotalCashPaid

      if (ItemIds.Count() == 0)
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
      if (!TransactionCashierData.CurrentUser.djournal_access &&
          !TransactionCashierData.CurrentUser.cashier_access &&
         (CashPayment.Validated ||
          CheckPayment.Validated))
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
      if (Charges.Count == 0) return false;
      var sql = @"
        USE WATSC;
        
        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

        BEGIN TRAN
          BEGIN TRY

            DELETE ccChargeItemsLocked
            WHERE TransactionDate < DATEADD(MI, -10, GETDATE());

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
      if (Charges.Count == 0) return;
      var sql = @"
        USE WATSC;

        SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;

        BEGIN TRAN
          BEGIN TRY
            DELETE FROM ccChargeItemsLocked
            WHERE TransactionDate < DATEADD(MI, -10, GETDATE())
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
      // TODO: Update all sub functions to email when expected number of rows are not updated properly
      if (!StartTransaction())
      {
        rollbackTransaction("SaveTransaction: !StartTransaction()");
        return false;
      }
      if (!SaveCashierPaymentRows())
      {
        rollbackTransaction("SaveTransaction: !SaveCashierPaymentRows()");
        return false;
      }
      if (!UpdateCashierItemRows_OTid_CashierId())
      {
        rollbackTransaction("SaveTransaction: !UpdateCashierItemRows_OTid_CashierId()");
        return false;
      }
      bool updateGU = (from p in Payments
                       where p.PaymentType == Payment.payment_type.cash ||
                             p.PaymentType == Payment.payment_type.check ||
                             p.PaymentType == Payment.payment_type.credit_card_cashier ||
                             p.PaymentType == Payment.payment_type.credit_card_public
                       select p).ToList().Count() > 0;
      if (updateGU)
      {

        if (!InsertGURows())
        {
          rollbackTransaction("SaveTransaction: !InsertGURows()");
          return false;
        }

      }

      //if (!Payments.Any(p => p.PaymentType == Payment.payment_type.impact_fee_credit
      //                   || p.PaymentType == Payment.payment_type.impact_fee_exemption
      //                   || p.PaymentType == Payment.payment_type.impact_waiver_road
      //                   || p.PaymentType == Payment.payment_type.impact_waiver_school
      //                   ))

      //{
      //  FinalizeTransaction();
      //}
      
      UnlockChargeItems();
      return true;

    }

    public bool StartTransaction()
    {
      var dp = new DynamicParameters();
      dp.Add("@CashierId", size: 12, dbType: DbType.String, direction: ParameterDirection.Output);
      dp.Add("@otId", dbType: DbType.Int32, direction: ParameterDirection.Output);
      dp.Add("@PayerCompanyName", TransactionCashierData.PayerCompanyName.Trim(), size: 50);
      dp.Add("@PayerName", (TransactionCashierData.PayerFirstName.Trim() + " " + TransactionCashierData.PayerLastName.Trim()), size: 50);
      dp.Add("@UserName", TransactionCashierData.CurrentUser.user_name.Trim(), size: 50);
      dp.Add("@TransactionDate", TransactionDate);
      dp.Add("@PayerPhoneNumber", TransactionCashierData.PayerPhoneNumber.Trim(), size: 12);
      dp.Add("@PayerStreetAddress", TransactionCashierData.PayerStreetAddress.Trim(), size: 50);
      dp.Add("@PayerStreet2", TransactionCashierData.PayerCity.Trim() + " " + TransactionCashierData.PayerState.Trim() + ", " + TransactionCashierData.PayerZip.Trim(), size: 50);
      dp.Add("@IPAddress", TransactionCashierData.ipAddress.Trim(), size: 15);
      dp.Add("@PayerEmailAddress", TransactionCashierData.PayerEmailAddress.Trim(), size: 50);

      string sql = @"
        USE WATSC;
        DECLARE @YR CHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS CHAR(4)), 2);

        EXEC dbo.prc_upd_ClayPay_ccNextAvail_GetNextCashierId 
          @CashierId OUTPUT,
          @YR;

        INSERT INTO ccCashier
          (CoName,CashierId,LstUpdt,[Name],TransDt,Phone,Addr1,Addr2,NTUser, PayerIPAddress, EmailAddress)
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
            @IPAddress,
            @PayerEmailAddress
          );

        SET @otId = @@IDENTITY;";
      try
      {


        TransactionCashierData.CashierId = "-1";
        TransactionCashierData.OTId = -1;

        TimingDates.Get_CashierId_Otid = DateTime.Now;

        int i = Constants.Exec_Query(sql, dp);
        if (i != -1)
        {

          TransactionCashierData.OTId = dp.Get<int>("@otId");
          TransactionCashierData.CashierId = dp.Get<string>("@CashierId");
          return true;
        }
        else
        {
          try
          {
            var sb = new StringBuilder();
            sb.Append("In StartTransaction() ").Append("in " + (Constants.UseProduction() ? "PROD" : "DEVELOPMENT")).AppendLine(" Server")
              .AppendLine(TransactionDate.ToLongDateString())
              .AppendLine("There was an issue saving getting NextAvailable CashierId or inserting new row Into WATSC.dbo.ccCashier")
              .AppendLine(TotalAmountDue.ToString())
              .Append("Payer: ").AppendLine(TransactionCashierData.PayerName)
              .Append("Payer email: ").AppendLine(TransactionCashierData.PayerEmailAddress)
              .Append("Number of payment types: ").AppendLine(Payments.Count().ToString())
              .AppendLine("ItemIds:");
            sb.AppendLine(String.Join(",", (from c in Charges select c.ItemId.ToString()).ToArray()));
            Constants.SaveEmail("daniel.mccartney@claycountygov.com", "Claypay transaction rolled back", sb.ToString());
          }
          catch
          {
            Constants.SaveEmail("daniel.mccartney@claycountygov.com",
                                "Claypay Issue in StartTransaction()",
                                "error getting new CashierId or new OTid.");
          }

          return false;

        }

      }
      catch (Exception ex)
      {

        Constants.Log(ex, sql);
        return false;
      }
    }

    private static DataTable CreateCashierPaymentDataTable()
    {
      var dt = new DataTable("CashierPayment");

      var pt = new DataColumn("PaymentType", typeof(string));
      //pt.MaxLength = 10;

      var info = new DataColumn("Info", typeof(string));
      //info.MaxLength = 50;

      var checkNum = new DataColumn("CheckNumber", typeof(string));
      //checkNum.MaxLength = 12;

      var TransId = new DataColumn("TransactionId", typeof(string));
      //TransId.MaxLength = 50;

      // TODO : Breakout each string and set the maxLength
      dt.Columns.Add(pt);
      dt.Columns.Add("OTid", typeof(int));

      dt.Columns.Add("AmountApplied", typeof(decimal));
      dt.Columns.Add("AmountTendered", typeof(decimal));
      dt.Columns.Add(checkNum);
      dt.Columns.Add(TransId);
      dt.Columns.Add(info);
      return dt;
    }

    public bool SaveCashierPaymentRows()
    {

      var dt = CreateCashierPaymentDataTable();
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
          FROM @CashierPayment
          ";
      try
      {
        foreach (Payment p in Payments)
        {
          var Info = TransactionCashierData.PayerFirstName.Trim() + " " + TransactionCashierData.PayerLastName.Trim();
          dt.Rows.Add(
            p.PaymentTypeValue,
            TransactionCashierData.OTId,
            p.AmountApplied,
            p.AmountTendered,
            p.CheckNumber.Trim().Substring(0, Math.Min(p.CheckNumber.Trim().Length, 12)),
            p.TransactionId.Trim().Substring(0, Math.Min(p.TransactionId.Trim().Length, 50)),
            Info.Substring(0, Math.Min(Info.Length, 50)));
        }



        TimingDates.Save_Cashier_Payment_Start = DateTime.Now; // Save_Cashier_Payment_start

        using (IDbConnection db = new SqlConnection(
          Constants.Get_ConnStr("WATSC" + (Constants.UseProduction() ? "Prod" : "QA"))))
        {
          int i = db.Execute(query, new { CashierPayment = dt.AsTableValuedParameter("CashierPayment") }, commandTimeout: 60);

          if (i != Payments.Count())
          {
            try
            {
              var sb = new StringBuilder();
              sb.Append("In SaveCashierPaymentRows() ")
                .Append("in " + (Constants.UseProduction() ? "PROD" : "DEVELOPMENT")).AppendLine(" Server")
                .AppendLine(TransactionDate.ToLongDateString())
                .AppendLine("There was an issue inserting data for ").Append((Payments.Count() - i).ToString())
                  .AppendLine(" payment types into ccCashierPayment")
                .Append("OTId: ").AppendLine(TransactionCashierData.OTId.ToString())
                .Append("Amount Due: ").AppendLine(TotalAmountDue.ToString())
                .Append("Payer: ").AppendLine(TransactionCashierData.PayerName)
                .Append("Payer email: ").AppendLine(TransactionCashierData.PayerEmailAddress)
                .Append("Number of payment types: ").AppendLine(Payments.Count().ToString())
                .AppendLine("ItemIds:");
              sb.AppendLine(String.Join(",", (from c in Charges select c.ItemId.ToString()).ToArray()));
              Constants.SaveEmail("daniel.mccartney@claycountygov.com", "Claypay transaction has not been rolled back", sb.ToString());
            }
            catch
            {
              Constants.SaveEmail("daniel.mccartney@claycountygov.com",
                                  "Claypay Issue in SaveCashierPaymentRows()",
                                  "error inserting payments");
            }
          }

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

      var query = $@"
        USE WATSC;

        UPDATE ccCashierItem 
        SET OTId = @OTID, CashierId = LTRIM(RTRIM(@CASHIERID)), [TimeStamp] = GETDATE()
        WHERE itemId IN @ITEMIDS
          AND CashierId IS NULL;

        -- THIS IS TO CAPTURE THE DISCOUNT IN THE PAYMENT OF THE BUILDING FEE
        WITH building_fees AS (

          SELECT *
          FROM ccCashierItem CI
          WHERE CI.CatCode IN ('100RE','100C')
            AND CashierId = @CASHIERID
            AND Narrative IS NULL

        )

        UPDATE CI
        SET CashierId = @CASHIERID, OTId = @OTID
        FROM ccCashierItem CI
        INNER JOIN building_fees BF ON BF.AssocKey = CI.AssocKey
        WHERE CI.CatCode IN ('100RE','100C')
          AND CI.Narrative = 'PRIVATE PROVIDER DISC'

";

      try
      {
        TimingDates.Update_CashierItem_Start = DateTime.Now; // update_CashierItem_start

        var i = Constants.Exec_Query(query, new
        {
          ITEMIDS = ItemIds,
          OTID = TransactionCashierData.OTId,
          CASHIERID = TransactionCashierData.CashierId
        });


        // TODO: create email if not all rows are updated
        //if (i != ItemIds.Count())
        //{
        //  if (i != ItemIds.Count())
        //  {
        //    try
        //    {
        //      var sb = new StringBuilder();
        //      sb.Append("In UpdateCashierItemRows_OTid_CashierId() ")
        //        .Append("in " + (Constants.UseProduction() ? "PROD" : "DEVELOPMENT")).AppendLine(" Server")
        //        .AppendLine(TransactionDate.ToLongDateString())
        //        .Append("There was an issue updating ").Append((ItemIds.Count() - i).ToString())
        //          .AppendLine(" charge items ccCashierPayment")
        //        .Append("OTId: ").AppendLine(TransactionCashierData.OTId.ToString())
        //        .Append("Amount Due: ").AppendLine(TotalAmountDue.ToString())
        //        .Append("Payer: ").AppendLine(TransactionCashierData.PayerName)
        //        .Append("Payer email: ").AppendLine(TransactionCashierData.PayerEmailAddress)
        //        .Append("Number of payment types: ").AppendLine(Payments.Count().ToString())
        //        .AppendLine("ItemIds:");
        //      sb.AppendLine(String.Join(",", (from c in Charges select c.ItemId.ToString()).ToArray()));
        //      Constants.SaveEmail("daniel.mccartney@claycountygov.com",
        //                          "Claypay Issue in UpdateCashierItemRows_OTid_CashierId()",
        //                          sb.ToString());
        //    }
        //    catch
        //    {
        //      Constants.SaveEmail("daniel.mccartney@claycountygov.com",
        //                          "Claypay Issue in UpdateCashierItemRows_OTid_CashierId()",
        //                          "error updating cashierItem rows");
        //    }
        //  }

        //}

        return i > 0;


      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        TransactionCashierData.OTId = -1;
        return false;
      }

    }

    public bool InsertGURows()
    {

      Console.WriteLine("All of the Transaction", this);
      var dp = new DynamicParameters();
      dp.Add("@otid", TransactionCashierData.OTId);
      dp.Add("@TransactionDate", this.TransactionDate);

      // I don't know if the year is supposed to be the fiscal year.
      // the code in  prc_upd_ccNextCashierId sets FY = the @Yr var
      // code for @Yr checks the current year against the FY field and if it is not equal,
      // it updates the FY and next avail fieldfield

      // TODO: Add these queries to stored procedures


      List<Payment> pmts = this.Payments;
      
      var query = @"
        USE WATSC;

        INSERT INTO ccGU  (OTId, CashierId, ItemId,CatCode, TransDt)
        SELECT DISTINCT CCI.OTId, CCI.CashierId, CCI.ItemId, CCI.CatCode, @TransactionDate
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          INNER JOIN ccCashierPayment CP ON CP.OTid = CCI.OTId
          INNER JOIN ccLookUp L ON UPPER(LEFT(CP.PmtType,5)) = UPPER(LEFT(L.Code,5))
        WHERE CCI.OTid = @otid 
          AND (CdType = 'PMTTYPE'
          OR (CdType = 'SPECIALPT' 
            AND LEFT(Code, 2) != 'IF' ));

        EXEC prc_claypay_insert_guitem_rows @otid



      ";

      try
      {
        TimingDates.Insert_Update_GURows_Start = DateTime.Now; // Insert_Update_GURows_Start

        var i = Constants.Exec_Query(query, dp);

        TimingDates.Insert_Update_GURows_End = DateTime.Now; // Insert_Update_GURows_End

        // 1. CHECK IF GL ENTRIES BALANCE FOR THIS OTID
        


        // 2. FIND ALL CAT CODES THAT ARE OUT OF BALANCE
        // 3. DECIDE WHICH ROW TO REDUCE BY .01 (NOT GREATER AMOUNT)




        // Leaving this in to publicly shame Jeremy and his decision making process.
        //if (i != ItemIds.Count() * 2)
        //{
        //  try
        //  {
        //    var sb = new StringBuilder();
        //    sb.Append("In SaveCashierPaymentRows() ")
        //      .Append("in " + (Constants.UseProduction() ? "PROD" : "DEVELOPMENT")).AppendLine(" Server")
        //      .AppendLine(TransactionDate.ToLongDateString())
        //      .AppendLine("There was an issue inserting GU data for ").Append(((Payments.Count() / 2) - i).ToString())
        //        .AppendLine(" payments into ccGU or ccGUItem")
        //      .Append("OTId: ").AppendLine(TransactionCashierData.OTId.ToString())
        //      .Append("Amount Due: ").AppendLine(TotalAmountDue.ToString())
        //      .Append("Payer: ").AppendLine(TransactionCashierData.PayerName)
        //      .Append("Payer email: ").AppendLine(TransactionCashierData.PayerEmailAddress)
        //      .Append("Number of payment types: ").AppendLine(Payments.Count().ToString())
        //      .AppendLine("ItemIds:");
        //    sb.AppendLine(String.Join(",", (from c in Charges select c.ItemId.ToString()).ToArray()));
        //    Constants.SaveEmail("daniel.mccartney@claycountygov.com",
        //                        "Claypay Issue in InsertGURows()",
        //                        sb.ToString());
        //  }
        //  catch
        //  {
        //    Constants.SaveEmail("daniel.mccartney@claycountygov.com",
        //                        "Claypay Issue in InsertGURows()",
        //                        "error inserting rows into ccGU or ccGUItem");
        //  }
        //}
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

        /*
        *  THE FOLLOWING WILL UPDATE THE CONTRACTOR EXPIRATION DATE IF THEY 
        *  PAID A LICENSE FEE ('CLLTF', 'CLFE', 'CLREC', 'CLTAR'). 
        */

        DECLARE @ExpDt VARCHAR(20) = (SELECT TOP 1 Description
            FROM clCategory_Codes WHERE Code = 'dt' AND Type_Code = '9');

        WITH [key] AS (

          SELECT DISTINCT 
            AssocKey 
          FROM ccCashierItem CI 
          INNER JOIN clContractor C ON CI.AssocKey = C.ContractorCd AND C.ContractorCd NOT LIKE 'AP%' 
          WHERE OTId=@otid 
            AND Assoc='CL' 
            AND CatCode IN ('CLLTF', 'CLFE', 'CLREC', 'CLTAR')

        ), total AS (

          SELECT 
            ISNULL(SUM(C.TOTAL),0)Total
          FROM ccCashierItem C
          INNER JOIN [key] k ON k.AssocKey = c.AssocKey
          WHERE Total > 0 
            AND CashierId IS NULL

        )

        UPDATE clContractor
        SET
          ExpDt = @ExpDt,
          BlkCrdExpDt = @ExpDt,
          IssueDt = GETDATE()
        FROM clContractor c
        INNER JOIN [key] K ON K.AssocKey = C.ContractorCd
        INNER JOIN total T ON T.Total = 0;

        DECLARE @YR CHAR(2) = RIGHT(CAST(YEAR(GETDATE()) AS CHAR(4)), 2);

        WITH permit_numbers AS (

          SELECT DISTINCT
            AssocKey
          FROM ccCashierItem CI
          INNER JOIN bpMASTER_PERMIT M ON CI.AssocKey = M.PermitNo AND M.Comm = 1
          WHERE CashierId = @cashierId
            AND OTId = @otid
            AND CatCode IN ('IFRD2','IFRD3', 'MFD1', 'MFD2', 'MFD4', 'MFD7', 'MFD10')

        ) 
      
      
        UPDATE CI SET CashierId = @cashierId, OTId = @otid
        FROM ccCashierItem CI
        INNER JOIN permit_numbers P ON P.AssocKey = CI.AssocKey
        WHERE CI.CatCode IN ('IFS2', 'IFS3', 'MFS1', 'MFS2', 'MFS4', 'MFS7', 'MFS10')

        -- This statement adds the payment row for the subsidy. Finalize() is called after the GU and GUItems tables are updated.
        -- TODO: Use the GU update to ignore the subsidies so they are added accidentally to the GL

        INSERT INTO ccCashierPayment (OTid, PmtType, AmtApplied, AmtTendered, Info, AddedBy, UpdatedBy, UpdatedOn)
        SELECT
          @otid
          ,CI.CatCode
          ,CI.Total
          ,0
          ,'ClayPay'
          ,@username
          ,'initial insert'
          ,GETDATE()
        FROM ccCashierItem CI
        WHERE CI.OTId = @otid
          AND CatCode IN ('IFS2', 'IFS3', 'MFS1', 'MFS2', 'MFS4', 'MFS7', 'MFS10')
          AND BaseFee = Total;
                                                               
    ";
      
      TimingDates.Finalize_Transaction_Start = DateTime.Now; // Finalize_Transaction_Start

      var i = Constants.Exec_Query(query, new
      {
        otid = TransactionCashierData.OTId,
        cashierId = TransactionCashierData.CashierId,
        UserName = TransactionCashierData.CurrentUser.user_name
      }) != -1;

      BalanceRoadImpactFees(TransactionCashierData.OTId);
      BalanceSchoolImpactFees(TransactionCashierData.OTId);

      TimingDates.Finalize_Transaction_End = DateTime.Now; // Finalize_Transaction_End

      return i;
    }

    public bool rollbackTransaction(string calliingFunction)
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
      try
      {
        var sb = new StringBuilder();
        sb.AppendLine(calliingFunction)
          .AppendLine(TransactionCashierData.CashierId)
          .AppendLine(TransactionCashierData.OTId.ToString())
          .AppendLine(TotalAmountDue.ToString())
          .AppendLine(CCData.TransactionId);
        sb.AppendLine("ItemIds:");
        sb.AppendLine(String.Join(",", (from c in Charges select c.ItemId.ToString()).ToArray()));
        Constants.SaveEmail("jeremy.west@claycountygov.com", "Claypay transaction rolled back", sb.ToString());
      }
      catch
      {
        Constants.SaveEmail("jeremy.west@claycountygov.com", "Claypay transaction rolled back", "error getting transaction information.");
      }


      var param = new DynamicParameters();
      param.Add("@otid", TransactionCashierData.OTId);
      var query = $@"
        USE WATSC;
        DECLARE @cashierid VARCHAR(9) = (SELECT CashierId FROM ccCashier WHERE OTid = @otid)
        BEGIN TRAN
            BEGIN TRY

            DELETE ccGUItem WHERE guid IN (SELECT guid FROM ccGU WHERE otid = @otid);
            DELETE ccGU where OTID = @otid;

            UPDATE ccCashierItem 
              SET 
                OTID = 0,
                CashierId = null
            WHERE 
              OTId = @otid;

            UPDATE ccCashierPayment
              SET 
                AmtApplied = 0, 
                AmtTendered = 0      
            WHERE 
              OTID = @otid;

            UPDATE ccCashier
              SET
                Name = 'Payment reversed - not applied'
            WHERE
              OTID = @otid;          
            
            UPDATE ClayPay_Transaction_Timing
            SET Rollback_Transaction = GETDATE()
            WHERE CashierId = @cashierid
            
            COMMIT;
          END TRY
        BEGIN CATCH
          ROLLBACK
        END CATCH";
      try
      {
        TimingDates.Rollback_Transaction = DateTime.Now; // Rollback_Transaction
        var i = Constants.Exec_Query(query, param);
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

    public void InsertTransactionTiming()
    {
      TimingDates.CashierId = TransactionCashierData.CashierId;

      var query = @"
      
          USE WATSC;
      
          INSERT INTO ClayPay_Transaction_Timing
          (CashierId, Transaction_Start, Get_CashierId_Otid, Send_CCData_Authorize_Transmit, 
          Return_CCData_Authorize_Transmit, Send_CCData_Settle_Transmit, 
          Return_CCData_Settle_Transmit, Save_Cashier_Payment_Start, 
          Update_CashierItem_Start, Insert_Update_GURows_Start, 
          Insert_Update_GURows_End, Finalize_Transaction_Start, 
          Finalize_Transaction_End, Rollback_Transaction)
          
          VALUES 
          (@CashierId, @Transaction_Start, @Get_CashierId_Otid, @Send_CCData_Authorize_Transmit, 
          @Return_CCData_Authorize_Transmit, @Send_CCData_Settle_Transmit, 
          @Return_CCData_Settle_Transmit, @Save_Cashier_Payment_Start, 
          @Update_CashierItem_Start, @Insert_Update_GURows_Start, 
          @Insert_Update_GURows_End, @Finalize_Transaction_Start, 
          @Finalize_Transaction_End, @Rollback_transaction)";

      var i = Constants.Exec_Query(query, TimingDates);

      if (i == -1)
      {
        new ErrorLog("Issue saving transaction timing for CashierId: " + TransactionCashierData.CashierId, "Did not save transaction times properly", "", "", "");
      }
    }

    private void BalanceRoadImpactFees(int? otid)
    {
      if(otid == null || otid == -1)  return;
      var param = new DynamicParameters();
      param.Add("@otid", otid);

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
            WHERE OTId = @otid)
          AS tmp
          WHERE PmtTtl + EscrowPmt != GUTtl OR ItemTtl != GUTtl
          
          

      ";

      var i = Constants.Get_Data<string>(query, param);

      if (i.Count() == 0)
      {
        return;
      }
      else
      {

        query = @"
          USE WATSC;
          WITH gl_entries AS (

            SELECT
              GU.ItemId
              ,GU.GUId
              ,GUI.Account
              ,GUI.Amount
              ,GUI.Type
              ,CI.CatCode
              ,CI.Total
              ,GUI.GUItemId
            FROM ccGU GU
            INNER JOIN ccGUItem GUI  ON GUI.GUID = GU.GUId
            INNER JOIN ccGL GL ON GL.CatCode = GU.CatCode
            INNER JOIN ccCashierItem CI ON CI.OTId = GU.OTId AND CI.CATCODE IN ('IFRD2', 'IFRD3','MFD1','MFD2','MFD4','MFD7','MFD10')
            WHERE GU.OTId = @otid

          )

          SELECT DISTINCT
            G1.GUItemId [guitem_id]
            ,G1.Amount + (G3.Amount - G1.Amount - G2.Amount) [amount]
          FROM gl_entries G1
          INNER JOIN gl_entries G2 ON G2.ItemId = G1.ItemId AND (G2.Account = '303*324310**' OR G2.Account = '304*324311**' OR G2.Account = '312*324321' OR G2.Account = '312*324322' OR G2.Account = '312*324323' OR G2.Account = '312*324324' OR G2.Account = '312*324325')
          INNER JOIN gl_entries G3 ON G3.ItemId = G1.ItemId AND G3.Type = 'd'
          WHERE G1.Account = '138*369910**'

      
        ";

        var guitems_to_fix = Constants.Get_Data<bad_guitems>(query, param);

        foreach (var g in guitems_to_fix)
        {
          var p = new DynamicParameters();
          p.Add("@guitem_id", g.guitem_id);
          p.Add("@amount", g.amount);

          query = @"
            USE WATSC;

            UPDATE ccGUItem
            SET AMOUNT = @amount
            WHERE GUItemId = @guitem_id

          ";

          var j = Constants.Exec_Query(query, p);

        }

      }
      
    }
    private void BalanceSchoolImpactFees(int? otid)
    {
      if (otid == null || otid == -1) return;
      var param = new DynamicParameters();
      param.Add("@otid", otid);

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
            WHERE OTId = @otid)
          AS tmp
          WHERE PmtTtl + EscrowPmt != GUTtl OR ItemTtl != GUTtl
          
          

      ";

      var i = Constants.Get_Data<string>(query, param);

      if (i.Count() == 0)
      {
        return;
      }
      else
      {

        query = @"
          USE WATSC;
          WITH gl_entries AS (

            SELECT
              GU.ItemId
              ,GU.GUId
              ,GUI.Account
              ,GUI.Amount
              ,GUI.Type
              ,CI.CatCode
              ,CI.Total
              ,GUI.GUItemId
            FROM ccGU GU
            INNER JOIN ccGUItem GUI  ON GUI.GUID = GU.GUId
            INNER JOIN ccGL GL ON GL.CatCode = GU.CatCode
            INNER JOIN ccCashierItem CI ON CI.OTId = GU.OTId AND CI.CATCODE IN ('IFSCH')
            WHERE GU.OTId = @otid

          )

          SELECT DISTINCT
            G1.GUItemId [guitem_id]
            ,ROUND((G1.Amount + (G3.Amount - G1.Amount - G2.Amount)) / 2, 2) [amount]
          FROM gl_entries G1
          INNER JOIN gl_entries G2 ON G2.ItemId = G1.ItemId AND (G2.Account = '130*208110**')
          INNER JOIN gl_entries G3 ON G3.ItemId = G1.ItemId AND G3.Type = 'd'
          WHERE G1.Account = '138*369910**'

      
        ";

        var guitems_to_fix = Constants.Get_Data<bad_guitems>(query, param);

        foreach (var g in guitems_to_fix)
        {
          var p = new DynamicParameters();
          p.Add("@guitem_id", g.guitem_id);
          p.Add("@amount", g.amount);

          query = @"
            USE WATSC;

            UPDATE ccGUItem
            SET AMOUNT = @amount
            WHERE GUItemId = @guitem_id

          ";

          var j = Constants.Exec_Query(query, p);

        }

      }
    }
  }
}
  