using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class NewTransaction
  {
    public int OTid { get; set; }
    public string CashierId { get; set; }
    public List<int> ItemIds { get; set; }
    public CCData CCPayment { get; set; }
    public List<Payment> Payments { get; set; }
    public List<string> errors { get; set; }
    private string ipAddress { get; set; }

    public NewTransaction(
      //List<long> items,
      //CCData CCPayment = null,
      ////string transactionId = "",
      //List<Payment> payments = null
      )
    {
      //this.OTid = otid;
      //this.ItemIds = items;
      //this.Payments = payments;
      //if(CCPayment != null)
      //{
      //  this.Payments.Add(new Payment(CCPayment.Total, "CCOnline", -1,transactionId));
      //}
    }

    public static List<string> ValidateTransaction(NewTransaction thisTransaction)
    {

      if (thisTransaction.errors != null || thisTransaction.errors.Count() == 0)
      {
        thisTransaction.errors = new List<string>();
      }
      var totalCharges = (from c in Charge.Get(thisTransaction.ItemIds) select c.Total).Sum();
      decimal totalPaymentAmount = (thisTransaction.CCPayment != null ? thisTransaction.CCPayment.Total : 0) + 
                                   (from p in thisTransaction.Payments select p.Amount).Sum();
                                   
      if (totalPaymentAmount <= 0)
      {
        thisTransaction.errors.Add("Payment amount must be greater than 0.\n");
      }

      if (totalPaymentAmount != totalCharges)
      {
        thisTransaction.errors.Add("The total for this transaction has changed.  Please check the charges and try again.");
      }

      // Thist doesn't belong here... this function is to validate, not process payments.

      if (thisTransaction.errors.Count == 0)
      {
        if (LockChargeItems(thisTransaction.ItemIds) == 0)
        {
          thisTransaction.errors.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
        }
      }


      return thisTransaction.errors;
    }


    public static NewTransaction ProcessTranstaction(NewTransaction thisTransaction, string ipAddress )
    {
      
      thisTransaction.errors = ValidateTransaction(thisTransaction);
      if (thisTransaction.errors.Count() > 0) return thisTransaction;

      if(ipAddress.Length == 0)
      {
        Constants.Log("Issue in PayController", "IP Address could not be captured", "", "", "");
      }

      // process cc payments here
      try
      {
        LockChargeItems(thisTransaction.ItemIds);

        List<string> errors = new List<string>();
        var charges = Charge.Get(thisTransaction.ItemIds);
        if (ccd != null)
        {
          e = CCData.ValidateCCData(thisTransaction.CCPayment);
        }

        if (e.Count() == 0)
        {
          e = ValidatePayments(ipAddress,thisTransaction.ItemIds, thisTransaction.CCPayment, thisTransaction.Payments);

          //var numberOfLockedItems = (ActiveTransactions.ChargeItemsLocked(ccd.ItemIds));

          //if (numberOfLockedItems == 0)
          //{
          //  e.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
          //}
          //if (numberOfLockedItems != 0 && ( numberOfLockedItems != ccd.ItemIds.Count() || numberOfLockedItems == -1))
          //{
          //  e.Add("There was an issue starting the transaction.  Please wait a few moments and try again.");
          //}
          // this is the last thing we'll validate.  If this doesn't fail then we'll be able
          // to start sending data.
          //if (e.Count == 0)
          //{
          //  if (!ActiveTransactions.Start(ccd.ItemIds))
          //  {
          //    e.Add("A transaction is already in process for one or more of these charges.  Please wait a few moments and try again.");
          //  }
          //}
        }


        if (e.Count > 0)
        {
          var message = String.Join("\n", e.ToArray());
          return CreateError(message, HttpStatusCode.BadRequest);
        }

        var pr = PaymentResponse.PostPayment(thisTransaction.CCPayment, ipAddress);
        if (pr == null)
        {
          Constants.Log("Error occurred in payment process", "pr did not complete", "", "");
          UnlockIds();
          return Ok(return something here);
        }

        if (pr.ErrorText.Length > 0)
        {
          ccd.UnlockIds();
          return Ok(return something here to show more detailed error)CreateError(pr.ErrorText, HttpStatusCode.BadRequest);
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
            return InternalServerError();
          }
        }

      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        ccd.UnlockIds();
        return InternalServerError();
      }

      // process manual payments here


      // unlock ItemIds
      UnlockChargeItems(thisTransaction.ItemIds);
      return errors;
    }


    public static int LockChargeItems(List<int> items)
    {
      if (items != null && items.Count() > 0)
      {
        var param = new DynamicParameters();
        param.Add("@items", items);
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

    public static void UnlockChargeItems(List<int> itemIdsToUnlock)
    {
      if (itemIdsToUnlock != null && itemIdsToUnlock.Count() > 0)
      {
        var param = new DynamicParameters();
        param.Add("@itemIdsToUnlock", itemIdsToUnlock);
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