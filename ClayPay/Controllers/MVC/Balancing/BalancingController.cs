using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace ClayPay.Controllers.MVC.Balancing
{
  public class BalancingController : Controller
  {
    // GET: Balancing
    public ActionResult Index()
    {
      var ua = Models.UserAccess.GetUserAccess(User.Identity.Name);
      ViewBag.Page = "balancing";
      return View(ua);
    }
  }
}