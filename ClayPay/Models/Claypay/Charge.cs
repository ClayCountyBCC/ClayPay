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
        WHERE ItemId IN @ids
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, itemIds);
      return lc;
    }

    public static List<Charge> GetChargesWithNoGLByDate(DateTime dateToProcess)
    {

      var param = new DynamicParameters();
      param.Add("@DateToProcess", dateToProcess);

      var sql = @"
        USE WATSC;

        WITH CashierIdsWithoutGL (CashierId) AS (
        SELECT DISTINCT LEFT(CI.CashierId,9) CashierId
        FROM ccCASHIER C
        INNER JOIN ccCashierPayment CP ON CP.OTid = C.OTId
        INNER JOIN ccCashierItem CI ON CI.CashierId = C.CashierId AND CI.OTId = CP.OTid
        INNER JOIN ccLookUp L ON LEFT(UPPER(L.CODE),5) = LEFT(UPPER(CP.PmtType),5)
        INNER JOIN ccGL GL ON CI.CatCode = GL.CatCode
        WHERE CAST(C.TransDt AS DATE) = CAST(@DateToProcess AS DATE)
          AND (GL.ACCOUNT IS NULL OR GL.ACCOUNT = '')
        GROUP BY CI.CashierId)

        SELECT DISTINCT
	        vC.ItemId,
	        ISNULL(CONCAT(LTRIM(RTRIM(CI.CatCode)), ' - ' + Description), '') [Description],
	        vC.TimeStamp,
	        vC.Assoc,
	        vC.AssocKey,
	        ISNULL(vC.Total, 0) Total,	
	        Detail
        FROM vwClaypayCharges vC
        INNER JOIN ccCashierItem CI ON CI.ItemId = vC.ItemId
        INNER JOIN ccGL GL ON GL.CatCode = CI.CatCode AND GL.Account IS NULL
        WHERE vC.CashierId in (select CashierId from CashierIdsWithoutGL)
        ORDER BY vC.AssocKey";


      var c = Constants.Get_Data<Charge>(sql, param);
      return c;
    }
  }
}