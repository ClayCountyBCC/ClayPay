using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models
{
  public class Charge
  {
    public int ItemId { get; set; }
    public string Description { get; set; }
    public DateTime TimeStamp { get; set; } = DateTime.MinValue;
    public string Assoc { get; set; }
    public string AssocKey { get; set; }
    public decimal Total { get; set; } = 0;
    public string TotalDisplay
    {
      get
      {
        return Total.ToString("C");
      }
    }
    public string Detail { get; set; }

    public string TimeStampDisplay
    {
      get
      {
        return TimeStamp == DateTime.MinValue ? "" : TimeStamp.ToShortDateString();
      }
    }
    public Charge()
    {

    }

    public static List<Charge> GetChargesByAssocKey(string AssocKey)
    {
      var dbArgs = new Dapper.DynamicParameters( );
      dbArgs.Add("@AK", AssocKey);
      string sql = @"
        USE WATSC;
          SELECT 
	          ItemId,
	          Description,
	          TimeStamp,
	          Assoc,
	          AssocKey,
	          Total,	
	          Detail
          FROM vwClaypayCharges 
	        WHERE Total > 0 
            AND CashierId IS NULL 
            AND UPPER(AssocKey)=@AK
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, dbArgs);
      return lc;
    }

    public static List<Charge> GetChargesByCashierId(string CashierId)
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@CashierId", CashierId);
      string sql = @"
 
           USE WATSC;
           SELECT 
	          ItemId,
	          Description,
	          TimeStamp,
	          Assoc,
	          AssocKey,
	          Total,	
	          Detail
          FROM vwClaypayCharges vC
          --INNER JOIN ccCashierItem CI ON CI.ItemId = vC.ItemId
          WHERE CashierId = @CashierId
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, dbArgs);
      return lc;
    }

    public static List<Charge> GetChargesByItemIds(List<int> itemIds)
    {
      string sql = @"
        USE WATSC;
        SELECT 
	        ItemId,
	        Description,
	        TimeStamp,
	        Assoc,
	        AssocKey,
	        Total,	
	        Detail
        FROM vwClaypayCharges
           WHERE CCI.ItemId IN @itemIds
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, itemIds);
      return lc;
    }

  }
}