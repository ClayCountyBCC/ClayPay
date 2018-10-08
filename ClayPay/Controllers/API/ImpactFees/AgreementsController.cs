using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
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
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.impactfee_access)
      {
        return Unauthorized();
      }
      return Ok(CombinedAllocation.Get(agreementNumber, builderId, permitNumber));
    }

    [HttpPost]
    [Route("SaveDeveloperAgreement")]
    public IHttpActionResult SaveDeveloperAgreement(DeveloperAgreement da)
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.impactfee_access)
      {
        return Unauthorized();
      }
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
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.impactfee_access)
      {
        return Unauthorized();
      }
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
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if(!ua.impactfee_access)
      {
        return Unauthorized();
      }

      var errors = pa.ValidateImpactFeeCredits();
      if (errors.Count() > 0)
      {
        return Ok(errors);
      }
      else
      {
        //var Username = User.Identity.Name.Replace(@"CLAYBCC\", "").ToUpper();
        string IpAddress = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
        if (!pa.Update(ua, IpAddress))
        {
          errors.Add("An error occurred while saving this permit's allocation, please try again.  If the error persists, please contact MIS.");
          return Ok(errors);
        }
        return Ok(new List<string>());
      }
    }

    [HttpPost]
    [Route("SavePermitWaiver")]
    public IHttpActionResult SavePermitWaiver(PermitWaiver pw)
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.impactfee_access)
      {
        return Unauthorized();
      }
      var permit = PermitImpactFee.Get(pw.Permit_Number, pw.Waiver_Type, "");
      var error = pw.Validate(permit);
      if (error.Length > 0) return Ok(error);
      string IpAddress = ((HttpContextWrapper)Request.Properties["MS_HttpContext"]).Request.UserHostAddress;
      if (!pw.ApplyWaiver(permit, IpAddress, ua))
      {
        return Ok("An error occurred while saving this permit's allocation, please try again.  If the error persists, please contact MIS.");
      }

      return Ok("success");
    }


    [HttpGet]
    [Route("GetPermit")]
    public IHttpActionResult GetPermit(string Permit_Number, string Search_Type, string Agreement_Number = "")
    {
      return Ok(PermitImpactFee.Get(Permit_Number, Search_Type, Agreement_Number));
    }

  }
}
