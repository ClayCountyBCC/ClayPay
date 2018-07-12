using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Text;
using ClayPay.Models;

namespace ClayPay.Controllers
{
  [RoutePrefix("API/Payments")]
  public class PayController : ApiController
  {
    // PUT: api/Pay
    [HttpPut]
    [Route("Pay")]
    public IHttpActionResult Put(CCData ccd)
    {
      try
      {
        var ip = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
        List<string> e = new List<string>();
        var charges = Charge.Get(ccd.ItemIds);
        e = ccd.Validate(charges);
        if (e.Count > 0)
        {
          var message = String.Join("\n", e.ToArray());
          return CreateError(message, HttpStatusCode.BadRequest);
        }
        var pr = PaymentResponse.PostPayment(ccd, ip);
        if(pr == null)
        {
          Constants.Log("Error occurred in payment process", "pr did not complete", "", "");
          ccd.UnlockIds();
          return InternalServerError();
        }
        if (pr.ErrorText.Length > 0)
        {
          ccd.UnlockIds();
          return CreateError(pr.ErrorText, HttpStatusCode.BadRequest);
        }
        else
        {
          if (pr.Save(ccd, ip))
          {
            pr.Finalize();
            ccd.UnlockIds();
            if (Constants.UseProduction())
            {
              Constants.SaveEmail("OnlinePermits@claycountygov.com",
                $"Payment made - Receipt # {pr.CashierId}, Transaction # {pr.UniqueId} ",
                CreateEmailBody(ccd, pr.CashierId));
            }
            else
            {
              Constants.SaveEmail("daniel.mccartney@claycountygov.com",
                $"TEST Payment made - Receipt # {pr.CashierId}, Transaction # {pr.UniqueId} -- TEST SERVER",
                CreateEmailBody(ccd, pr.CashierId));
            }
            return Ok(pr);
          }
          else
          {
            // If we hit this, we're going to have a real problem.
            var items = String.Join(",", ccd.ItemIds);
            Constants.Log("Error attempting to save transaction.",
              items,
              pr.UniqueId,
              ccd.EmailAddress);
            return InternalServerError();
          }
        }
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        ccd.UnlockIds();
        return InternalServerError();
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
