using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;

namespace ClayPay
{
  public static class WebApiConfig
  {
    public static void Register(HttpConfiguration config)
    {
      // Web API configuration and services

      // Web API routes
      config.MapHttpAttributeRoutes();

      config.Routes.MapHttpRoute(
          name: "DefaultApi",
          routeTemplate: "api/{controller}/{key}",
          defaults: new { key = RouteParameter.Optional }
      );
      config.Routes.MapHttpRoute(
          name: "PaymentApi",
          routeTemplate: "api/pay/{ccd}",
          defaults: new { controller = "pay" }
      );

    }
  }
}
