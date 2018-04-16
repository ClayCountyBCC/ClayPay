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
    public decimal Developer_Amount_Currently_Allocated { get; set; }

    public int Builder_Id { get; set; }
    public string Builder_Name { get; set; }
    public decimal Builder_Allocation_Amount { get; set; }
    public decimal Builder_Amount_Currently_Allocated { get; set; }

    public string Permit_Number { get; set; }
    public decimal Permit_Amount_Allocated { get; set; }

    public CombinedAllocation()
    {

    }

    public static List<CombinedAllocation> Get()
    {
      string query = @"
        WITH CurrentDeveloperAllocation AS (
          SELECT
            Agreement_Number,
            SUM(Amount_Allocated) Amount_Currently_Allocated    
          FROM ImpactFees_Builder_Allocations
          GROUP BY Agreement_Number
        ), CurrentBuilderAllocation AS (
          SELECT
            Builder_Id,
            SUM(Amount_Allocated) Amount_Currently_Allocated    
          FROM ImpactFees_Permit_Allocations
          GROUP BY Builder_Id
        )

        SELECT 
          UPPER(LTRIM(RTRIM(A.ProjName))) Developer_Name,
          D.Agreement_Number,
          D.Agreement_Amount,
          CDA.Amount_Currently_Allocated Developer_Amount_Currently_Allocated,

          B.Amount_Allocated Builder_Amount_Allocated,
          B.Id Builder_Id,
          B.Builder_Name,
          CBA.Amount_Currently_Allocated Builder_Amount_Currently_Allocated,

          P.Amount_Allocated Permit_Amount_Allocated,
          P.Permit_Number
        FROM ImpactFees_Developer_Agreements D
        INNER JOIN apApplication A ON D.Agreement_Number = A.ApplNum AND A.ApplType = 'TIMPACT'        
        LEFT OUTER JOIN ImpactFees_Builder_Allocations B ON D.Agreement_Number = B.Agreement_Number
        LEFT OUTER JOIN CurrentDeveloperAllocation CDA ON D.Agreement_Number = CDA.Agreement_Number
        LEFT OUTER JOIN ImpactFees_Permit_Allocations P ON P.Builder_Id = B.Id
        LEFT OUTER JOIN CurrentBuilderAllocation CBA ON B.Id = CBA.Builder_Id
        ORDER BY D.Agreement_Number;";
      return Constants.Get_Data<CombinedAllocation>(query);
    }
  }
}