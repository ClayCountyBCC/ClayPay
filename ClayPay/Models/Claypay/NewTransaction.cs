using System;
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
    public int OTid { get; set; }
    public string CashierId { get; set; }
    public List<int> ItemIds { get; set; }
    public List<Charge> Charges { get; set; }
    public CCPayment CCData { get; set; }
    public Payment CashPayment { get; set; }
    public Payment CheckPayment { get; set; }
    public Payment OtherPayment { get; set; } = new Payment(Payment.payment_type.impact_fee_credit); // for waivers / credits / etc.
    public List<Payment> Payments { get; set; } = new List<Payment>();
    public List<string> Errors { get; set; } = new List<string>();
    public List<string> ProcessingErrors { get; set; } = new List<string>();
    public decimal Change { get; set; } = 0;
    public decimal TotalAmountDue { get; set; } = 0; // provided by the client, this is the amount they used to calculate how much money to accept.
    public decimal ChangeDue { get; set; } = 0;
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

      return false;
    }

    public ClientResponse ProcessPaymentTransaction()
    {
      if (!ValidatePaymentTransaction())
      {
        return new ClientResponse(Errors);
      }
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
      if (CCData.Validated) Payments.Add(new Payment(CCData, CurrentUser));
      if (CheckPayment.Validated) Payments.Add(CheckPayment);
      // OtherPayment will probably only be used in this process to apply
      // the partial impact fee credit when the rest of the fee is paid.
      if (OtherPayment.Validated) Payments.Add(OtherPayment);


      if (SaveTransaction()) // Unlock IDs at the end of this function
      {
        var amountPaid = (from payment in Payments select payment.AmountApplied).Sum();

        return new ClientResponse(CashierId, this.CCData.TransactionId, ProcessingErrors, amountPaid, Change, CCData.Validated ? CCData.ConvenienceFeeAmount : 0);
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

      if (this.CashPayment.PaymentType != Payment.payment_type.cash ||
        this.CheckPayment.PaymentType != Payment.payment_type.check ||
        this.OtherPayment.PaymentType == Payment.payment_type.cash ||
        this.OtherPayment.PaymentType == Payment.payment_type.check)
      {
        this.Errors.Add("There is an issue with the chosen payment types.  Please refresh this page and try again.");
        return false;
      }

      decimal totalAmountPaid = 0;

      if (this.CCData.Validated)
      { // validate credit card data if exists
        Errors = this.CCData.ValidateCCData();

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
      // if we get here, our check/cash/credit card payment should all be valid.

      //if ((from p in Payments
      //   where p.PaymentTypeValue == ""
      //   select p).ToList().Count() > 0)
      //{

      //  this.Errors.Add($"There is an issue recording one or more payment types in this transaction.");
      //  ProcessingErrors.Add($@"\nPlease do not attempt the transaction again and contact the building department.
      //                           Reference Credit Card Transaction Id: {this.CCData.TransactionId}");
      //  Constants.Log("issue with recording payment type.",
      //                "Error setting payment type.",
      //                Payments.ToString(),
      //                $"Number of payment types: {Payments.Count()}, function call: Payment.SetPaymentTypeString().");
      //  return false;
      //}

      // If not cashier and cash || check, return error
      if (!this.CurrentUser.djournal_access &&
        (this.CashPayment.Validated ||
        this.CheckPayment.Validated))
      {
        Errors.Add("Only cashier can accept cash and check payments");
        return false;
      }
      //if (!this.CurrentUser.djournal_access &&
      //   !this.CurrentUser.impactfee_access &&
      //   (from p in Payments
      //    where p.PaymentTypeValue == "CK" ||
      //    p.PaymentTypeValue == "CA"
      //    select p).ToList().Count() > 0
      //   )
      //{
      //  Errors.Add("Only cashier can accept cash and check payments");
      //  return false;
      //}

      this.Charges = Charge.Get(ItemIds);
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
        if(ChangeDue > 0)
        {
          CashPayment.AmountApplied = CashPayment.Amount - ChangeDue;
        }
        //else
        //{
          
        //  var cashpayment = (from p in Payments
        //                     where p.PaymentType == Payment.payment_type.cash
        //                     select p).First();
        //  int cashindex = Payments.IndexOf(cashpayment);

        //  Payments[cashindex].AmountApplied = cashpayment.AmountTendered - Change;

        //}
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
        DELETE FROM ccChargeItemsLocked
        WHERE TransactionDate < DATEADD(MI, -3, GETDATE())
          OR ItemId IN (@itemIdsToUnlock)
          COMMIT
        END TRY
        BEGIN CATCH
          ROLLBACK
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

    public bool SaveTransaction()
    {
      //var transId = (from p in Payments 
      //               where p.GetPaymentTypeString() != "CA" 
      //                  && p.GetPaymentTypeString() != "CK" 
      //               select p.TransactionId).FirstOrDefault();
      var dbArgs = new DynamicParameters();
      //dbArgs.Add("@Payments", Payments);
      //dbArgs.Add("@PayerName", PayerName);
      //dbArgs.Add("@Total", CCPayment.Total);
      //dbArgs.Add("@TransactionId", CCPayment.TransactionId);
      //dbArgs.Add("@ItemIds", ItemIds);
      //dbArgs.Add("@TransDt", DateTime.Now);

      
      string query = @"
        USE WATSC;
        DECLARE @CashierId VARCHAR(9) = NULL;
        DECLARE @otId int = NULL;
        DECLARE @TransDt = GETDATE();

        BEGIN TRANSACTION;

        BEGIN TRY
          EXEC dbo.prc_upd_ClayPay_ccNextAvail_GetNextCashierId @CashierId OUTPUT;
          
          EXEC dbo.prc_ins_ClayPay_ccCashier_NewOTid 
            @otId int output, 
            @CoName = @CompanyName,
            @CashierId,
            @Name = @PayerFirstName + ' ' + @PayerLastName,
            @OperId = NULL,
            @TransDt,
            @Phone,
            @Addr1,
            @Addr2 = @PayerCity + ' ' + @PayerState + ', ' + @PayerZip,
            @NTUser


          INSERT INTO ccCashierPayment 
            (OTid, PmtType, AmtApplied, AmtTendered, Info, CkNo, TransactionId)
          VALUES (
            @otId, 
            @PaymentTypeValue, 
            @AmountApplied, 
            @Amount, 
            @PayerFirstName + ' ' + @PayerLastName, 
            @CheckNumber, 
            @TransactionId
          )
          
          -- EXEC dbo.prc_ins_ClayPay_ccCashierPayment_NewPayment
          --  @OTId = @otId, 
          --  @PmtType = @PaymentTypeString,
          --  @AmtApplied = @AmountApplied,
          --  @AmtTendered = @Amount, 
          --  @PmtInfo = @PayerFirstName + ' ' + @PayerLastName,
          --  @CkNo = @CheckNo,
          --  @TransId = @TransactionId


          UPDATE ccCashierItem 
            SET OTId = @otId, CashierId = @CashierId
            WHERE itemId IN (@ItemIds)

          -- Add the ccGU rows
          EXEC dbo.prc_ins_ClayPay_ccGU_NewGU
            @OTId = @otId

          -- Add the ccGUItem rows
          EXEC dbo.prc_ins_ClayPay_ccGUItem_NewGUItemAccountRows
            @OTId = @otId
          
          END TRY
          BEGIN CATCH
            IF @@TRANCOUNT > 0
              ROLLBACK TRANSACTION;
          END CATCH;
        
          IF @@TRANCOUNT > 0
            COMMIT TRANSACTION;";
      try
      {
        var i = Constants.Save_Data(query, this);
        CashierId = dbArgs.Get<string>("@CashierId");
        OTid = dbArgs.Get<Int32>("@otId");
        return (i);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
      finally
      {
        UnlockChargeItems(); //always runs
      }
    }

    public bool Finalize()
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@cId", CashierId);
      dbArgs.Add("@otId", OTid);
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

    public string CreateEmailBody()
    {
      var AssocKeys = GetAssocKeys(ItemIds);
      var chargeItems = new List<Charge>();

      foreach (var k in AssocKeys)
      {
        chargeItems.AddRange(Charge.Get(k));
      }

      var keys = String.Join(", \n", AssocKeys);
      string body = $"An online credit card payment of {this.CCData.Amount.ToString("C")}.\n";
      body += $"The Charges paid include:\n";
      foreach (var c in chargeItems)
      {
        body += $"{c.Description}\t\t{c.TotalDisplay}\n{keys}";
      }
      body += "\nThis payment is asoociated with the following items: \n" + keys;

      return body;
    }

    public List<string> GetAssocKeys(List<int> ItemIds)
    {
      string query = @"
        SELECT DISTINCT LTRIM(RTRIM(AssocKey)) AS AssocKey FROM ccCashierItem
        WHERE ItemId IN @ids;";
      return Constants.Get_Data<string>(query, ItemIds);
    }

  }
}
// email