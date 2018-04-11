using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models.ImpactFees
{
  public class CombinedAllocation
  {
    // This class will be used to easily list this data for the website.
    public string Developer_Name { get; set; }
    public string Agreement_Number { get; set; }
    public decimal Agreement_Amount { get; set; }
    public string Developer_Audit_Log { get; set; }

    public int Builder_Id { get; set; }
    public string Builder_Name { get; set; }
    public decimal Builder_Amount_Allocated { get; set; }
    public string Builder_Audit_Log { get; set; }

    public string Permit_Number { get; set; }
    public decimal Permit_Amount_Allocated { get; set; }
    public string Permit_Audit_Log { get; set; }

    public CombinedAllocation()
    {

    }

    public static List<CombinedAllocation> Get()
    {
      string query = @"
        SELECT 
          '' Developer_Name,
          D.Agreement_Number,
          D.Agreement_Amount,
          D.Audit_Log Developer_Audit_Log,

          B.Amount_Allocated Builder_Amount_Allocated,
          B.Id Builder_Id,
          B.Builder_Name,
          B.Audit_Log Builder_Audit_Log,

          P.Amount_Allocated Permit_Amount_Allocated,
          P.Permit_Number,
          P.Audit_Log Permit_Audit_Log
        FROM ImpactFees_Developer_Agreements D
        INNER JOIN apApplication A ON D.Agreement_Number = A.ApplNum AND A.ApplType = 'TIMPACT'
        LEFT OUTER JOIN ImpactFees_Builder_Allocations B ON D.Agreement_Number = B.Agreement_Number
        LEFT OUTER JOIN ImpactFees_Permit_Allocations P ON P.Builder_Id = B.Id
        ORDER BY D.Agreement_Number";
      return Constants.Get_Data<CombinedAllocation>(query);
    }
  }
}