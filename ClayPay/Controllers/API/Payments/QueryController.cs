using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayPay.Models;

namespace ClayPay.Controllers
{
  public class QueryController : ApiController
  {

    // GET: api/Query/5
    public IHttpActionResult Get(string Key)
    {
      List<Charge> lc = Charge.Get(Key);
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
