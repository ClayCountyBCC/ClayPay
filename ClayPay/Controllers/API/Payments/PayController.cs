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
    [HttpPut]
    [Route("Pay")]
    public IHttpActionResult Put(NewTransaction thisTransaction)
    {
      thisTransaction.ipAddress = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
      thisTransaction.useraccess = new UserAccess(User.Identity.Name);
      if (thisTransaction.ValidateTransaction())
      {
        var response = thisTransaction.ProcessTransaction(); 
        return Ok(response);
      }
      else
      {
        return Ok(new ClientResponse("", "", thisTransaction.Errors, thisTransaction.ProcessingErros, 0,0));
      }
    }
    

    private IHttpActionResult CreateError(string message, HttpStatusCode codeToUse)
    {
      return ResponseMessage(Request.CreateResponse(codeToUse, new HttpError(message)));
    }

  }
}
