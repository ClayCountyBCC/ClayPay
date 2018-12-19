using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Text;
using ClayPay.Models;
using ClayPay.Models.Claypay;

namespace ClayPay.Controllers
{
  [RoutePrefix("API/Payments")]
  public class PayController : ApiController
  {
    // PUT: api/Pay
    [HttpPost]
    [Route("Pay")]
    public IHttpActionResult Post(NewTransaction thisTransaction)
    {
      thisTransaction.TransactionCashierData.ipAddress = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
      thisTransaction.TransactionCashierData.CurrentUser = UserAccess.GetUserAccess(User.Identity.Name);
      if (thisTransaction.ValidatePaymentTransaction())
      {
        var response = thisTransaction.ProcessPaymentTransaction();
        return Ok(response);
      }
      else
      {
        return Ok(new ClientResponse(thisTransaction.Errors));
      }
    }


    private IHttpActionResult CreateError(string message, HttpStatusCode codeToUse)
    {
      return ResponseMessage(Request.CreateResponse(codeToUse, new HttpError(message)));
    }

  }
}
