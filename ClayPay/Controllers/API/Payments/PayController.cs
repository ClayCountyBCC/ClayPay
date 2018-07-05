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
  public class PayController : ApiController
  {
    // PUT: api/Pay
    public IHttpActionResult Put(NewTransaction thisTransaction)
    {
      var ip = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
      thisTransaction.ProcessTransaction(ip, new UserAccess(User.Identity.Name));

      return Ok(thisTransaction);
    }
    

    private IHttpActionResult CreateError(string message, HttpStatusCode codeToUse)
    {
      return ResponseMessage(Request.CreateResponse(codeToUse, new HttpError(message)));
    }

  }
}
