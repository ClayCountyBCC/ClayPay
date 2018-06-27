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

      try
      {
        return Ok(NewTransaction.Process(thisTransaction, ip));
      }
      catch(Exception ex)
      {
        Constants.Log(ex, "Error in PayController.Put.");
        return Ok("Error in processing this transaction");
      }
    }

    private string CreateEmailBody(CCData ccd, string cashierId)
    {
      string keys = String.Join(", \n", ccd.GetAssocKeys());
      string body = $"A payment of { ccd.Total.ToString("C") } was made on the following items: \n";
      return body += keys;
    }

    private IHttpActionResult CreateError(string message, HttpStatusCode codeToUse)
    {
      return ResponseMessage(Request.CreateResponse(codeToUse, new HttpError(message)));
    }

  }
}
