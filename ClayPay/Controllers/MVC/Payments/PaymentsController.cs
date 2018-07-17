using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ClayPay.Controllers.MVC.Payments
{
  public class PaymentsController : Controller
  {
    // GET: Payments
    public ActionResult Index()
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      ViewBag.Page = "payments";
      ViewBag.Development = ClayPay.Models.Constants.UseProduction() ? "" : "DEVELOPMENT";
      return View(ua);
    }
  }
}