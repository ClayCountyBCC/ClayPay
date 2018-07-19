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
    }
  }
}
