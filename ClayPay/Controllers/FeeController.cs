using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayPay.Models;

namespace ClayPay.Controllers
{
  public class FeeController : ApiController
  {
    // GET: api/Fee
    public IHttpActionResult Get()
    {
      string fee = (string)MyCache.GetItem("fee");
      if (fee == null || fee.Length == 0)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(fee);
      }
    }


  }
}
