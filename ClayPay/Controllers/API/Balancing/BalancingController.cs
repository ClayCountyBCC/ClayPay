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
        var ua = UserAccess.GetUserAccess(User.Identity.Name);
        var dj = new DJournal(DateToBalance ?? DJournal.LastDateFinalized().AddDays(1), ua, false);
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
      try
      {
        var ua = UserAccess.GetUserAccess(User.Identity.Name);
        var dj = new DJournal(DateToFinalize, ua, true);
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
      return Ok(AssignedOnlinePayment.Get());
    }

    [HttpPost]
    [Route("AssignPayment")]
    public IHttpActionResult Post(string CashierId)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.cashier_access) return Unauthorized();
      return Ok(AssignedOnlinePayment.AssignPaymentToUser(CashierId, ua.user_name));
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

      if (editPayment == null) return Ok(BadRequest("There are no payments to edit"));

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

  }
}