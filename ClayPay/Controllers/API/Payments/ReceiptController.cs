﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Text;
using ClayPay.Models;
using ClayPay.Models.Claypay;


namespace ClayPay.Controllers.API.Payments
{

  [RoutePrefix("API/Payments")]
  public class ReceiptController : ApiController
  {
    [HttpGet]
    [Route("Receipt")]
    public IHttpActionResult Get(string CashierId)
    {
      var cr = new ClientResponse(CashierId);
      if (cr == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(cr);
      }
    }

    [HttpPost]
    [Route("EditPayments")]
    public IHttpActionResult Get(List<ReceiptPayment> paymentList)
    {
      // TODO: Check if Payments in list 
      return Ok(new ClientResponse(paymentList[0].CashierId));
    }
  }

}
 