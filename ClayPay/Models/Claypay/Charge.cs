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

    public static List<Charge> Get(string AssocKey)
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
	        UPPER(LTRIM(RTRIM(ISNULL(COALESCE(Address, CustomerName, ProjName), '')))) AS Detail
        FROM (
	        SELECT
		        CCI.ItemId,
		        CCC.Description, 
		        CCI.TimeStamp,
		        CCI.Assoc,
		        LTRIM(RTRIM(CCI.AssocKey)) AS AssocKey,	
		        CCI.Total,		        
		        COALESCE(BM.ProjAddrCombined, BA.ProjAddrCombined) Address,	
		        C.CustomerName,
		        A.ProjName
	        FROM ccCashierItem CCI
	        LEFT OUTER JOIN ccCatCd CCC ON CCI.CatCode = CCC.CatCode
	        LEFT OUTER JOIN bpMASTER_PERMIT M ON CCI.AssocKey = M.PermitNo AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpBASE_PERMIT BM ON M.BaseID = BM.BaseID AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpAssoc_PERMIT ASSOC ON CCI.AssocKey = ASSOC.PermitNo AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpBASE_PERMIT BA ON ASSOC.BaseID = BA.BaseID AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN clContractor CO ON CCI.AssocKey = CO.ContractorCd AND CCI.Assoc='CL'
	        LEFT OUTER JOIN clCustomer C ON CCI.AssocKey = C.ContractorCd AND CCI.Assoc = 'CL'
	        LEFT OUTER JOIN apApplication A ON CCI.AssocKey = A.apAssocKey AND CCI.Assoc = 'AP'
	        WHERE AssocKey IS NOT NULL 
            AND Total > 0 
            AND CashierId IS NULL 
            AND UnCollectable = 0
            AND UPPER(AssocKey)=@AK
        ) AS TMP        
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, dbArgs);
      return lc;
    }

    public static List<Charge> Get(List<int> itemIds)
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
	        UPPER(LTRIM(RTRIM(ISNULL(COALESCE(Address, CustomerName, ProjName), '')))) AS Detail
        FROM (
	        SELECT
		        CCI.ItemId,
		        CCC.Description, 
		        CCI.TimeStamp,
		        CCI.Assoc,
		        LTRIM(RTRIM(CCI.AssocKey)) AS AssocKey,	
		        CCI.Total,		        
		        COALESCE(BM.ProjAddrCombined, BA.ProjAddrCombined) Address,	
		        C.CustomerName,
		        A.ProjName
	        FROM ccCashierItem CCI
	        LEFT OUTER JOIN ccCatCd CCC ON CCI.CatCode = CCC.CatCode
	        LEFT OUTER JOIN bpMASTER_PERMIT M ON CCI.AssocKey = M.PermitNo AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpBASE_PERMIT BM ON M.BaseID = BM.BaseID AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpAssoc_PERMIT ASSOC ON CCI.AssocKey = ASSOC.PermitNo AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN bpBASE_PERMIT BA ON ASSOC.BaseID = BA.BaseID AND CCI.Assoc NOT IN ('AP', 'CL')
	        LEFT OUTER JOIN clContractor CO ON CCI.AssocKey = CO.ContractorCd AND CCI.Assoc='CL'
	        LEFT OUTER JOIN clCustomer C ON CCI.AssocKey = C.ContractorCd AND CCI.Assoc = 'CL'
	        LEFT OUTER JOIN apApplication A ON CCI.AssocKey = A.apAssocKey AND CCI.Assoc = 'AP'
	        WHERE AssocKey IS NOT NULL 
            AND Total > 0 
            AND CashierId IS NULL 
            AND UnCollectable = 0
            AND CCI.ItemId IN @ids
        ) AS TMP        
        ORDER BY TimeStamp ASC";
      var lc = Constants.Get_Data<Charge>(sql, itemIds);
      return lc;
    }

  }
}