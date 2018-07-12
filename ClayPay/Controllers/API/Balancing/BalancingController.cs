using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web.Http.Results;
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
    public IHttpActionResult Get(DateTime DateToBalance)
    {
      try
      {
        var dj = new DJournal(DateToBalance);
        return Ok(dj);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return InternalServerError();
      }
    }

    [HttpPost]
    [Route("Save")]
    public IHttpActionResult Save(DateTime DateToFinalize)
    {
      try
      {
        var finalize = DateToFinalize.Date < DateTime.Now.Date;
        var ua = UserAccess.GetUserAccess(User.Identity.Name);

        finalize = ua.in_claypay_djournal_group;
        var dj = new DJournal(DateToFinalize, finalize, User.Identity.Name);

        if(ua.in_claypay_djournal_group == false)
        {
          dj.Error.Add("DJournal was not finalized. User does not have the correct level of access.");

        }

        if (DateToFinalize.Date < DateTime.Now.Date)
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

  }
}