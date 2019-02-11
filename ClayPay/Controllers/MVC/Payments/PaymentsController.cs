using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ClayPay.Controllers.MVC.Payments
{
  [OutputCacheAttribute(VaryByParam = "*", Duration = 0, NoStore = true)]
  public class PaymentsController : Controller
  {
    // GET: Payments
    [OutputCache(NoStore = true, Duration = 0, VaryByParam = "*")]
    public ActionResult Index()
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      ViewBag.Page = "payments";
      ViewBag.Development = ClayPay.Models.Constants.UseProduction() ? "" : "DEVELOPMENT";
      return View(ua);
    }
  }
}