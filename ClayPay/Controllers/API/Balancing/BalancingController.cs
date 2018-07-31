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
    [Route("Get")]
    public IHttpActionResult Get(DateTime? DateToBalance = null)
    {
      try
      {
        var dj = new DJournal(DateToBalance ?? DJournal.NextDateToFinalize());
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
    public IHttpActionResult Get(DateTime DateToBalance, Models.Claypay.Payment.payment_type PaymentType)
    {
      try
      {
        var dj = Models.Balancing.Payment.GetPayments(DateToBalance, PaymentType, new UserAccess(User.Identity.Name));
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

        var finalize = ua.djournal_access && DateToFinalize.Date < DateTime.Now.Date;
        var dj = new DJournal(DateToFinalize, finalize, ua.user_name);

        if(!ua.djournal_access)
        {
          dj.Error.Add("DJournal was not finalized. User does not have the correct level of access.");

        }

        if (DateToFinalize.Date >= DateTime.Now.Date)
        {
          dj.Error.Add("Cannot finalize payments made on or after today. Please select a previous date.");
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
        return Ok(DJournal.NextDateToFinalize());
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        return Ok(DateTime.MinValue);
      }
    }
  }
}