using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Optimization;

namespace ClayPay
{
  public class BundleConfig
  {
    public static void RegisterBundles(BundleCollection bundles)
    {
      //BundleTable.EnableOptimizations = true;      
      bundles.IgnoreList.Clear();
      bundles.FileSetOrderList.Clear();

      bundles.Add(new ScriptBundle("~/Scripts/claypay/claypay-bundle.js")
        .Include(
        "~/bower_components/promise-polyfill/dist/polyfill.js",
        "~/bower_components/fetch/fetch.js",
        "~/Scripts/app/Utilities.js",
        "~/Scripts/claypay/Charge.js",
        "~/Scripts/claypay/AppTypes.js",
        "~/Scripts/claypay/Payment.js",
        "~/Scripts/claypay/CCPayment.js",
        "~/Scripts/claypay/NewTransaction.js",
        "~/Scripts/claypay/UI.js",
        "~/Scripts/claypay/claypay.js"));     
      
    }
  }
}
