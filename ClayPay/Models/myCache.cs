using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Runtime.Caching;

namespace ClayPay.Models
{
  public class MyCache
  {
    private static MemoryCache _cache = new MemoryCache("myCache");

    public static object GetItem(string key)
    {
      return GetOrAddExisting(key, () => InitItem(key));
    }

    public static object GetItem(string key, CacheItemPolicy CIP)
    {
      return GetOrAddExisting(key, () => InitItem(key), CIP);
    }

    private static T GetOrAddExisting<T>(string key, Func<T> valueFactory, CacheItemPolicy CIP)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, CIP) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static T GetOrAddExisting<T>(string key, Func<T> valueFactory)
    {

      Lazy<T> newValue = new Lazy<T>(valueFactory);
      var oldValue = _cache.AddOrGetExisting(key, newValue, GetCIP()) as Lazy<T>;
      try
      {
        return (oldValue ?? newValue).Value;
      }
      catch
      {
        // Handle cached lazy exception by evicting from cache. Thanks to Denis Borovnev for pointing this out!
        _cache.Remove(key);
        throw;
      }
    }

    private static CacheItemPolicy GetCIP()
    {
      return new CacheItemPolicy()
      {
        AbsoluteExpiration = DateTime.Now.AddHours(12)
      };
    }

    private static object InitItem(string key)
    {
      switch (key)
      {
        case "fee":
          return PaymentResponse.GetFee();

        case "apptypes":
          return AppType.Get();

        default:
          return null;
      }
    }


  }
}