using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ClayPay.Controllers.MVC.ImpactFees
{
  public class ImpactFeesController : Controller
  {
    // GET: ImpactFees
    public ActionResult Index()
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      if (!ua.impactfee_access)
      {
        return new HttpUnauthorizedResult();
      }
      ViewBag.Page = "impactfees";
      return View(ua);
    }
  }
}