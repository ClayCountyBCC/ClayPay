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
     returns from functions Account.GetGLAccountTotalsGetDJournal, payment.process, payment.getgutotals, 
     and payment.getallpayments() are all Pre-Formatted.
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
        var dj = new DJournal(DateToFinalize, (DateToFinalize.Date < DateTime.Now.Date ? true : false), User.Identity.Name);
        dj.Error.Add("Cannot finalize payments made on or after today. Please select a previous date.");
        return Ok(dj);
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return InternalServerError();
      }
    }

    //public IHttpActionResult GetDJournal(DateTime DateToBalance)
    //{
    //  // TODO: Link getting djournal to UserAccess when it is applied
    //  var dj = new DJournal(DateToBalance);
    //  if (newDjournal == null)
    //  {
    //    return BadRequest("Error returning DJournal. Please contact the help desk if this issue persists.");
    //  }
    //  else
    //  {
    //    return Ok(newDjournal);
    //  }
    //}

    //// Return All Payments made on DateToBalance
    //// Use client side to filter if needed.
    //public IHttpActionResult GetAllPayments(DateTime DateToBalance, string paymentType = "")
    //{
    //  List<CashierTotal> Payments = Payment.GetPayments(DateToBalance, paymentType);
    //  if (Payments == null)
    //  {
    //    return BadRequest("Error returning payments. Please contact the help desk if this issue persists.");
    //  }
    //  else
    //  {
    //    return Ok(Payments);
    //  }
    //}


    //public IHttpActionResult Process(DateTime DateToBalance)
    //{
    //  List<CashierTotal> paymentTypeTotals = CashierTotal.Process(DateToBalance);
    //  if (paymentTypeTotals == null)
    //  {
    //    return BadRequest("Error processing payment data. Please contact the help desk if this issue persists.");
    //  }
    //  else
    //  {
    //    return Ok(paymentTypeTotals);
    //  }
    //}

    //public IHttpActionResult GetGUTotals(DateTime DateToBalance)
    //{
    //  List<CashierTotal> GUTotals = CashierTotal.GetGUTotals(DateToBalance);
    //  if (GUTotals == null)
    //  {
    //    return BadRequest("Error returning GU totals. Please contact the help desk if this issue persists.");
    //  }
    //  else
    //  {
    //    return Ok(GUTotals);
    //  }
    //}


  }
}