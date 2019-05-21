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
      ClientResponse cr;
      // In order to allow for voids, we need to know which user is looking at this receipt.
      // If they are on the public server (and thus unauthenticated)
      // or are just unauthenticated, we won't bother to check the user access.
      if (!Constants.IsPublic())
      {
        var ua = UserAccess.GetUserAccess(User.Identity.Name);
        if (!ua.authenticated)
        {
          cr = new ClientResponse(CashierId, ua);
        }
        else
        {
          cr = new ClientResponse(CashierId);
        }
      }
      else
      {
        cr = new ClientResponse(CashierId);
      }
      
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