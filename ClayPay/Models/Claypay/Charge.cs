using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
namespace ClayPay.Models
{
  public class Charge
  {
    public int ItemId { get; set; } = -1;
    public string Description { get; set; } = "";
    public DateTime TimeStamp { get; set; } = DateTime.MinValue;
    public string Assoc { get; set; } = "";
    public string AssocKey { get; set; } = "";
    public decimal Total { get; set; } = 0;
    public string TotalDisplay
    {
      get
      {
        return Total.ToString("C");
      }
    }
    public string Detail { get; set; } = "";

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
      var dbArgs = new DynamicParameters( );
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
      var dbArgs = new DynamicParameters();
      dbArgs.Add("@CashierId", CashierId);
      string sql = @"
 
           USE WATSC;
           SELECT 
	          ItemId,
	          ISNULL(Description, '') Description,
	          TimeStamp,
	          Assoc,
	          AssocKey,
	          ISNULL(Total, 0) Total,	
	          Detail
          FROM vwClaypayCharges vC
          WHERE CashierId = @CashierId
        ORDER BY TimeStamp ASC";

      var lc = Constants.Get_Data<Charge>(sql, dbArgs);
      return lc;
    }

    public static List<Charge> GetChargesByItemIds(List<int> itemIds)
    {
      var param = new DynamicParameters();
      param.Add("@itemIds", itemIds);
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
        WHERE 
          ItemId IN @ids
          AND CashierId IS NULL
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, itemIds);
      return lc;
    }

  }
}