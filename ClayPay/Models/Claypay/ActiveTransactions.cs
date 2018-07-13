using System;
using System.Collections.Generic;
using System.Collections.Concurrent;
using System.Linq;
using System.Web;
using Dapper;

//namespace ClayPay.Models
//{
//  public static class ActiveTransactions
//  {
//    public static ConcurrentDictionary<int, int> cd = new ConcurrentDictionary<int, int>();

//    public static bool AnyExists(List<int> items)
//    {
//      foreach(int i in items)
//      {
//        if (cd.TryGetValue(i, out int t))
//        {
//          return true;
//        }
//      }      
//      return false; // We return false if none exist.
//    }
//    public static int ChargeItemsLocked(List<int> items)
//    {
//      if (items != null && items.Count() > 0)
//      {
//        var param = new DynamicParameters();
//        param.Add("@items", items);
//        var sql = @"
//        USE WATSC;

//        DECLARE @LockItems varchar(20) = 'LockingItems';  
//        BEGIN TRAN @LockItems
//          BEGIN TRY
//            DELETE ccChargeItemsLocked
//            WHERE TransactionDate < DATEADD(MI, -3, GETDATE())

//            INSERT INTO ccChargeItemsLocked
//            (ItemId)
//            VALUES
//            (@items)


//            COMMIT
//          END TRY
//          BEGIN CATCH
//            ROLLBACK TRAN @LockItems
//            -- PRINT 'THIS COULD BE A CUSTOM MESSAGE'
//            -- PRINT ERROR_MESSAGE()
//            -- Error can be returned from within the CATCH by using a print statement or 
//            -- the actual error can be raised using 
//            --    RAISERROR (ERROR_MESSAGE() -- Message text.  
//            --      ERROR_SEVERITY(), -- Severity.  
//            --      ERROR_STATE() -- State.  
//            --    );  

//          END CATCH
//      ";

//        try
//        {
//          return Constants.Exec_Query(sql, param);  // return false if no rows affected
//        }
//        catch (Exception ex)
//        {
//          Constants.Log(ex, sql);
//          return -1;
//        }
//      }

//      return -1;
//    }

//    public static bool Start(List<int> items)
//    {
//      List<int> added = new List<int>(); // this will be used in case we need to roll back.
//      foreach (int i in items)
//      {
//        if (!cd.TryAdd(i, i))
//        {
//          // if we find one that already exists, we'll use the added List
//          // to loop through the items we already added and remove them.
//          var addedIds = String.Join(",", added);
//          Constants.Log("Ids found for item in progress, removing", addedIds, "", "");
//          foreach (int a in added) 
//          {
//            cd.TryRemove(a, out int t);
//          }
//          return false;
//        }
//        else
//        {
//          added.Add(i);
//        }
//      }
//      return true;
//    }

//    public static void UnlockChargeItems(List<long> itemIdsToUnlock)
//    {
//      if (itemIdsToUnlock != null && itemIdsToUnlock.Count() > 0)
//      {
//        var param = new DynamicParameters();
//        param.Add("@itemIdsToUnlock", itemIdsToUnlock);
//        var sql = @"
//        USE WATSC;

//        BEGIN TRAN
//        BEGIN TRY
//        DELETE ccChargeItemsLocked
//        WHERE TransactionDate < DATEADD(MI, -3, GETDATE())
//          OR ItemId IN (@itemIdsToUnlock)
//          COMMIT
//        END TRY
//        BEGIN CATCH
//          PRINT ERROR_MESSAGE()
//        END CATCH

      
//      ";
//        try
//        {
//          Constants.Exec_Query(sql, param);
//        }
//        catch (Exception ex)
//        {
//          Constants.Log(ex, sql);
//        }
//      }
//    }

//    public static void Finish(List<int> items)
//    {
//      var itemIds = String.Join(",", items);
//      foreach (int i in items)
//      {
//        if (cd.TryGetValue(i, out int tmp))
//        {
//          if (!cd.TryRemove(i, out int t))
//          {
//            Constants.Log("Unable to remove item", i.ToString(), "", "");
//          }
//        }
//      }
//    }
//  }
//}