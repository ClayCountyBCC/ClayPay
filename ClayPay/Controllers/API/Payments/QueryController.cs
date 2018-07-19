using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayPay.Models;

namespace ClayPay.Controllers
{
  [RoutePrefix("API/Payments")]
  public class QueryController : ApiController
  {

    [HttpGet]
    [Route("Query")]
    public IHttpActionResult Get(string Key)
    {
      List<Charge> lc = Charge.GetChargesByAssocKey(Key);
      if (lc == null)
      {        
        return InternalServerError();
      }
      else
      {
        return Ok(lc);
      }
    }

  }
}
