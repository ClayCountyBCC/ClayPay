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
    [Route("GetAgreements")]
    public IHttpActionResult GetAgreements(string agreementNumber = "", int builderId = -1, string permitNumber = "")
    {
      return Ok(CombinedAllocation.Get(agreementNumber, builderId, permitNumber));
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
        if (!da.Update(Username))
        {
          errors.Add("An error occurred while saving this agreement, please try again.  If the error persists, please contact MIS.");
          return Ok(errors);
        }
        return Ok(new List<string>());
      }
    }

    [HttpPost]
    [Route("SaveBuilderAllocation")]
    public IHttpActionResult SaveBuilderAllocation(BuilderAllocation ba)
    {

      var errors = ba.Validate();
      if (errors.Count() > 0)
      {
        return Ok(errors);
      }
      else
      {
        var Username = User.Identity.Name.Replace(@"CLAYBCC\", "").ToUpper();
        if (!ba.Update(Username))
        {
          errors.Add("An error occurred while saving this builder's allocation, please try again.  If the error persists, please contact MIS.");
          return Ok(errors);
        }
        return Ok(new List<string>());
      }
    }

    [HttpPost]
    [Route("SavePermitAllocation")]
    public IHttpActionResult SavePermitAllocation(PermitAllocation pa)
    {

      var errors = pa.Validate();
      if (errors.Count() > 0)
      {
        return Ok(errors);
      }
      else
      {
        var Username = User.Identity.Name.Replace(@"CLAYBCC\", "").ToUpper();
        if (!pa.Update(Username))
        {
          errors.Add("An error occurred while saving this permit's allocation, please try again.  If the error persists, please contact MIS.");
          return Ok(errors);
        }
        return Ok(new List<string>());
      }
    }

    [HttpGet]
    [Route("GetPermit")]
    public IHttpActionResult GetPermit(string Permit_Number, string Agreement_Number = "")
    {
      return Ok(PermitImpactFee.Get(Permit_Number));
    }

  }
}
