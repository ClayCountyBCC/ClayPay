using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Results;
using ClayPay.Models.Claypay;
using ClayPay.Models.Balancing;
using ClayPay.Models;


namespace ClayPay.Controllers
{    
  [RoutePrefix("API/Balancing")]
  public class BalancingController : ApiController
  {
    /**************************************************************************************************************
     Both Get and Save routes Return a DJournal

     Parameters: 
        Get: DateToBalance (DateTime.Date)
          1. Can be used to view any DJournal Date.
          2. Can only reprint DJournals that have been finalized

        Post: DateToFinalize (DateTime.Date)
          1. Can only finalize DJournal for payments made before today.
          2. Can only finalize DJournal for single date.
            * If DateToFinalize < today then finalize = true 
            * Else finalize = false
         
     The Printed DJournal example is in Queries\WATSC\ClayPay\Balancing

    ****    DJournal Format  **** 

    Date
    Clay County, BCC

    Total Charges   $000,000.00  // total charges is TotalPayments is Payment.Process.Last()
     _____________ ___________
     display Payment.Process

     =============   ===========
     Total Payments  $000,000.00  Total Deposit   $000,000.00
     ______________ ___________
     display Payment.GetGUTotals

     display Account.GetAccountTotals

    **************************************************************************************************************/
    
    [HttpGet]
    [Route("GetDJournal")]
    public IHttpActionResult Get(DateTime? DateToBalance = null)
    {
      try
      {
        var dj = new DJournal(DateToBalance ?? DJournal.LastDateFinalized().AddDays(1));
        return Ok(dj);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return InternalServerError();
      }
    }

    [HttpGet]
    [Route("GetPayments")]
    public IHttpActionResult Get(DateTime DateToBalance, string PaymentType)
    {
      try
      {
        //var ua = new UserAccess(User.Identity.Name);
        var dj = Models.Balancing.Payment.GetPayments(DateToBalance, PaymentType);
        return Ok(dj);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return InternalServerError();
      }
    }

    [HttpPost]
    [Route("Finalize")]
    public IHttpActionResult Post(DateTime DateToFinalize)
    {
      // This gets the last date finalized, adds 1 day, and checks to make sure that DateToFinalize
      // is that date.
      try
      {
        var ua = UserAccess.GetUserAccess(User.Identity.Name);
        var NextDateToFinalize = DJournal.LastDateFinalized().AddDays(1).Date;
        var finalize = ua.djournal_access && DateToFinalize.Date == NextDateToFinalize;
        var dj = new DJournal(DateToFinalize, finalize, ua.user_name);

        if(!ua.djournal_access)
        {
          dj.Error.Add("DJournal was not finalized. User does not have the correct level of access.");

        }

        if (DateToFinalize.Date != NextDateToFinalize)
        {
          dj.Error.Add("The dates must be finalized in order.  You must finalize " + NextDateToFinalize.ToShortDateString() + "next.");
        }
        return Ok(dj);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return InternalServerError();
      }
    }

    [HttpGet]
    [Route("UnassignedPayments")]
    public IHttpActionResult Get()
    {
      var p = AssignedOnlinePayment.Get();
      if (p != null)
      {
        return Ok(p);
      }
      else
      {
        return Ok(p);
      }
    }

    [HttpPost]
    [Route("AssignPayment")]
    public IHttpActionResult Post(string CashierId)
    {
      return Ok(AssignedOnlinePayment.AssignPaymentToUser(CashierId, User.Identity.Name));
    }

    [HttpPost]
    [Route("UpdateAssignedPayment")]
    public IHttpActionResult Post(string CashierId, bool update)
    {
      if(update)
      {
        return Ok(AssignedOnlinePayment.ChangeAssignedTo(CashierId, User.Identity.Name));
      }
      else
      {
        return Ok("Could not update");
      }
    }

    [HttpGet]
    [Route("NextDateToFinalize")]
    public IHttpActionResult GetNextFinalizeDate()
    {
      try
      {
        return Ok(DJournal.LastDateFinalized().AddDays(1));
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        return Ok(DateTime.MinValue);
      }
    }


    [HttpGet]
    [Route("Receipt")]
    public IHttpActionResult Get(string CashierId)
    {
      // The difference in this receipt end point and the 
      // receipt end point in the payment controller is that this one 
      // will allow for editing the payment types if they have the necessary access.
      // add in somethign that checks the date of this transaction and compares it to the 
      // last date finalized to see if it is editable
      var cr = new ClientResponse(CashierId);
      if (cr == null)
      {
        return InternalServerError();
      }
      else
      {
        bool IsDateFinalized = DJournal.IsDateFinalized(cr.ResponseCashierData.TransactionDate);
        cr.IsEditable = !IsDateFinalized; // update this based on the previous test.
        return Ok(cr);
      }
    }


    [HttpPost]
    [Route("EditPayments")]
    public IHttpActionResult Post(ReceiptPayment editPayment)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.cashier_access) return Unauthorized();

      if (editPayment != null)
      {
        var errors = new List<string>();
        var originalPayment = ReceiptPayment.GetPaymentsByPayId(editPayment.PayId).DefaultIfEmpty(new ReceiptPayment()).First();

        var cashierId = originalPayment.CashierId;
        errors = ReceiptPayment.EditPaymentValidation(editPayment, originalPayment);

        if (errors.Count() == 0)
        {
          errors = ReceiptPayment.UpdatePayments(editPayment, originalPayment, ua.user_name);
        }

        var response = new ClientResponse(cashierId)
        {
          Errors = errors
        };

        return Ok(response);

      }
      else
      {
        return Ok(BadRequest("There are no payments to edit"));
      }

    }

  }
}