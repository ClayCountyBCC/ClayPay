using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
using ClayPay.Controllers;
namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    public string PayerName { get; set; }
    public string PayerPhone{ get; set; }
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
    public List<string> errors { get; set; }
    private string ipAddress { get; set; } 
    private UserAccess UserAccess {get; set; }

    public NewTransaction()
    {

    }
    
    public NewTransaction ProcessTransaction( string ip, UserAccess ua)
    {
      ipAddress = ip;
      errors = new List<string>();

      if (ipAddress.Length == 0)
      {
        Constants.Log("Issue in PayController", "IP Address could not be captured", "", "", "");
        errors.Add("IP Address could not be captured");


        // process cc payments here
        try
        {
          LockChargeItems();

          var charges = Charge.Get(ItemIds);
          if (this.CCPayment != null)
          {
            errors = CCPayment.ValidateCCData(CCPayment);
          }

          if (errors.Count() > 0)
          {
            return this;
          }

          if(CCPayment.)
          var pr = PaymentResponse.PostPayment(CCPayment, ipAddress);
          if (pr == null)
          {
            errors.Add(pr.ErrorText);
            UnlockChargeItems();
            return this;
          }
          else
          {
            // Inside pr.Save take all payments and process them.
            if (pr.Save(ip, ccd))
            {
              pr.Finalize();
              ccd.UnlockIds();
              if (Constants.UseProduction())
              {
                Constants.SaveEmail("OnlinePermits@claycountygov.com",
                  $"Payment made - Receipt # {pr.CashierId}, Transaction # {pr.UniqueId} ",
                  CreateEmailBody(ccd, pr.CashierId));
              }
              else
              {
                Constants.SaveEmail("daniel.mccartney@claycountygov.com",
                  $"TEST Payment made - Receipt # {pr.CashierId}, Transaction # {pr.UniqueId} -- TEST SERVER",
                  CreateEmailBody(ccd, pr.CashierId));
              }
              return Ok(pr);
            }
            else
            {
              // If we hit this, we're going to have a real problem.
              var items = String.Join(",", ccd.ItemIds);
              Constants.Log("Error attempting to save transaction.",
                items,
                pr.UniqueId,
                ccd.EmailAddress);
              return this;
            }
          }

        }
        catch (Exception ex)
        {
          Constants.Log(ex);
          UnlockChargeItems();
          errors.Add("There was an issue processing the transaction");
          return this;
        }

        // process manual payments here


        // unlock ItemIds
        UnlockChargeItems();
        return errors;
      }

    public void ValidateTransaction()
    {

      if (errors != null && errors.Count() >= 0)
      {
        errors = new List<string>();
      }

      var totalCharges = (from c in Charge.Get(ItemIds) select c.Total).Sum();
      decimal totalPaymentAmount = (CCPayment != null ? CCPayment.Total : 0) +
                                   (from p in Payments select p.Amount).Sum();

      // amount can be different if cashi is involved
      if (totalPaymentAmount <= 0)
      {
        errors.Add("Payment amount must be greater than 0.\n");
      }

      if (totalPaymentAmount != totalCharges)
      {
        errors.Add("The total for this transaction has changed.  Please check the charges and try again.");
      }

      // Thist doesn't belong here... this function is to validate, not process payments.

      if (errors.Count == 0)
      {
        if (LockChargeItems(ItemIds) == 0)
        {
          errors.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
        }
      }
    }


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
  }


}

// email