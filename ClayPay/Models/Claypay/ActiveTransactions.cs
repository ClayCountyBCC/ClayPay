using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Web;

namespace ClayPay.Models
{
  public static class ActiveTransactions
  {
    public static ConcurrentDictionary<int, int> cd = new ConcurrentDictionary<int, int>();

    public static bool AnyExists(List<int> items)
    {
      foreach(int i in items)
      {
        if (cd.TryGetValue(i, out int t))
        {
          return true;
        }
      }      
      return false; // We return false if none exist.
    }

    public static bool Start(List<int> items)
    {
      List<int> added = new List<int>(); // this will be used in case we need to roll back.
      var itemIds = String.Join(",", items);
      foreach (int i in items)
      {
        if (!cd.TryAdd(i, i))
        {
          // if we find one that already exists, we'll use the added List
          // to loop through the items we already added and remove them.
          var addedIds = String.Join(",", added);
          Constants.Log("Ids found for item in progress, removing", addedIds, "", "");
          foreach (int a in added) 
          {
            cd.TryRemove(a, out int t);
          }
          return false;
        }
        else
        {
          added.Add(i);
        }
      }
      return true;
    }

    public static void Finish(List<int> items)
    {
      var itemIds = String.Join(",", items);
      foreach (int i in items)
      {
        if (cd.TryGetValue(i, out int tmp))
        {
          if (!cd.TryRemove(i, out int t))
          {
            Constants.Log("Unable to remove item", i.ToString(), "", "");
          }
        }
      }
    }
  }
}