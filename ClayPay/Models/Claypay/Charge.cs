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

    private bool IsVoided { get; set; } = false;
    private bool IsOriginal { get; set; } = true;
    public Charge()
    {

    }

    public static List<Charge> GetChargesByAssocKey(string AssocKey)
    {
      var dbArgs = new DynamicParameters( );
      dbArgs.Add("@AK", AssocKey.ToUpper());
      string sql = @"
        USE WATSC;
        WITH discounted_permits AS (
  
          SELECT AssocKey, CatCode, SUM(Total) Total
          FROM ccCashierItem
          WHERE CatCode IN ('100RE','100C')
            AND CashierId IS NULL
            AND AssocKey = @AK
          GROUP BY AssocKey, CatCode


        ), unpaid_building_fees AS (

          SELECT CI.ItemId, CC.Description, CI.TimeStamp, CI.Assoc, CI.AssocKey, CI.CatCode, D.Total
          FROM ccCashierItem CI
          INNER JOIN ccCatCd CC ON CC.CatCode = CI.CatCode
          INNER JOIN discounted_permits D ON D.AssocKey = CI.AssocKey
          WHERE CI.CATCODE IN ('100RE','100C')
            AND CashierId IS NULL
            AND CI.Narrative IS NULL

        )

        SELECT 
	        ItemId,
	        C.Description,
	        C.TimeStamp,
	        Assoc,
	        AssocKey,
          TOTAL,	
	        Detail  
        FROM vwClaypayCharges C
        INNER JOIN ccCatCd CC ON CC.CatCode = C.CatCode
        WHERE Total > 0
          AND CashierId IS NULL 
          AND UPPER(AssocKey)=@AK
          AND C.CatCode NOT IN ('100RE', '100C')

        UNION

        SELECT
	        C.ItemId,
	        C.Description,
	        C.TimeStamp,
	        C.Assoc,
	        C.AssocKey,
	        UPF.TOTAL,	
	        C.Detail
        FROM vwClaypayCharges C
        INNER JOIN unpaid_building_fees UPF ON UPF.ItemId = C.ItemId
        ORDER BY TimeStamp ASC

      ";

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
	        vc.TimeStamp,
	        Assoc,
	        AssocKey,
	        ISNULL(Total, 0) Total,	
	        Detail,
          C.IsVoided,
          CASE WHEN RIGHT(LTRIM(RTRIM(@CashierId)), 1) = 'V'
            THEN 0 ELSE 1 END IsOriginal
        FROM vwClaypayCharges vC
        INNER JOIN ccCashier C ON C.CashierId = vc.CashierId
        WHERE vc.CashierId = @CashierId
        ORDER BY vc.TimeStamp ASC";

      var lc = Constants.Get_Data<Charge>(sql, dbArgs);

      foreach(var l in lc)
      {
        if (l.Total < 0 &&
          l.IsOriginal &&
          (l.Description.ToUpper() == "RESIDENTIAL BUILDINGS" 
          || l.Description.ToUpper() == "COMMERCIAL BUILDING PERMIT FEE"))
        {
          l.Description += " (PPI DISCOUNT)";
        }

        if (l.Total > 0 && 
        l.IsVoided &&
        !l.IsOriginal &&
        (l.Description.ToUpper() == "RESIDENTIAL BUILDINGS" || l.Description.ToUpper() == "COMMERCIAL BUILDING PERMIT FEE"))
        {
          l.Description += " (PPI DISCOUNT)";
        }

      }
      return lc;
    }

    public static List<Charge> GetChargesByItemIds(List<int> itemIds)
    {
      var param = new DynamicParameters();
      param.Add("@itemIds", itemIds);
      string sql = @"

        DECLARE @AK VARCHAR(8);
        SET @AK = (SELECT TOP 1 AssocKey FROM ccCashierItem WHERE ItemId IN @ids);

        WITH discounted_permits AS (
  
          SELECT AssocKey, CatCode, SUM(Total) Total
          FROM ccCashierItem
          WHERE CatCode IN ('100RE','100C')
            AND CashierId IS NULL
            AND AssocKey = @AK
          GROUP BY AssocKey, CatCode


        ), unpaid_building_fees AS (

          SELECT CI.ItemId, CC.Description, CI.TimeStamp, CI.Assoc, CI.AssocKey, CI.CatCode, D.Total
          FROM ccCashierItem CI
          INNER JOIN ccCatCd CC ON CC.CatCode = CI.CatCode
          INNER JOIN discounted_permits D ON D.AssocKey = CI.AssocKey
          WHERE CI.CATCODE IN ('100RE','100C')
            AND CashierId IS NULL
            AND CI.Narrative IS NULL


        )

        SELECT 
	        ItemId,
	        C.Description,
	        C.TimeStamp,
	        Assoc,
	        AssocKey,
	        Total,	
	        Detail
        FROM vwClaypayCharges C
        INNER JOIN ccCatCd CC ON CC.CatCode = C.CatCode
        WHERE 
          ItemId IN @ids
          AND CashierId IS NULL
          AND C.CatCode NOT IN ('100RE', '100C')

        UNION

        SELECT
	        C.ItemId,
	        C.Description,
	        C.TimeStamp,
	        C.Assoc,
	        C.AssocKey,
	        UPF.TOTAL,	
	        C.Detail
        FROM vwClaypayCharges C
        INNER JOIN unpaid_building_fees UPF ON UPF.ItemId = C.ItemId

        ORDER BY TimeStamp ASC";

      var lc = Constants.Get_Data<Charge,int>(sql, itemIds);
      return lc;
    }


  }
}