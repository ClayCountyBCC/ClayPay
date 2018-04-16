using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using ClayPay.Models.ImpactFees;

namespace ClayPay.Controllers.ImpactFees
{
  [RoutePrefix("API/ImpactFees")]
  public class AgreementsController : ApiController
  {
    // GET: api/Agreements
    [HttpGet]
    [Route("GetDeveloperAgreements")]
    public IHttpActionResult GetDeveloperAgreements()
    {
      return Ok(DeveloperAgreement.GetList());
    }

    [HttpGet]
    [Route("GetCombinedAllocations")]
    public IHttpActionResult GetCombinedAllocations()
    {
      return Ok(CombinedAllocation.Get());
    }

    [HttpPost]
    [Route("SaveDeveloperAgreement")]
    public IHttpActionResult SaveDeveloperAgreement(DeveloperAgreement da)
    {
      
      var errors = da.Validate();
      if(errors.Count() > 0)
      {
        return Ok(errors);
      }
      else
      {
        var Username = User.Identity.Name.Replace(@"CLAYBCC\", "").ToUpper();
        return Ok(da.Update(Username));
      }
    }

  }
}
