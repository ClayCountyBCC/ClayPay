using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Text;
using ClayPay.Models.Claypay;
using ClayPay.Models.Balancing;
using ClayPay.Models;



namespace ClayPay.Controllers.API.Payments
{

  [RoutePrefix("API/Payments")]
  public class ReceiptController : ApiController
  {
    [HttpGet]
    [Route("Receipt")]
    public IHttpActionResult Get(string CashierId)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.authenticated) return Unauthorized();

      var cr = new ClientResponse(CashierId, ua);
      
      if (cr == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(cr);
      }
    }

    [HttpGet]
    [Route("VoidPayment")]
    public IHttpActionResult Void(string cashierId)
    {
      var ua = UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.authenticated) return Unauthorized();

      // TODO: ADD THIS TO VALIDATE_VOID FUNCTION
      var cr = ClientResponse.Void(cashierId, ua, ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress, true);

      if (cr == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(cr);
      }

    }
  }
}