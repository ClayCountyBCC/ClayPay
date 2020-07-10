using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.ImpactFees
{
  public class CombinedAllocation
  {
    // This class will be used to easily list this data for the website.
    public string Developer_Name { get; set; }
    public string Agreement_Number { get; set; }
    public decimal Agreement_Amount { get; set; }
    public string Agreement_Amount_Formatted
    {
      get
      {
        try
        {
          return Agreement_Amount.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }
      }
    }
    public decimal Developer_Amount_Currently_Allocated { get; set; }
    public string Developer_Amount_Currently_Allocated_Formatted
    {
      get
      {
        try
        {
          return Developer_Amount_Currently_Allocated.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }
      }
    }
    public string Developer_Audit_Log { get; set; }

    public int Builder_Id { get; set; }
    public string Builder_Name { get; set; }
    public decimal Builder_Allocation_Amount { get; set; }
    public string Builder_Allocation_Amount_Formatted
    {
      get
      {
        try
        {
          return Builder_Allocation_Amount.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }

      }
    }
    public decimal Builder_Amount_Currently_Allocated { get; set; }
    public string Builder_Amount_Currently_Allocated_Formatted
    {
      get
      {
        try
        {
          return Builder_Amount_Currently_Allocated.ToString("C2");
        }
        catch (Exception ex)
        {
          new ErrorLog(ex);
          return "";
        }
      }
    }
    public string Builder_Audit_Log { get; set; }

    public string Permit_Number { get; set; }
    public decimal Permit_Amount_Allocated { get; set; }
    public string Permit_Audit_Log { get; set; }

    public CombinedAllocation()
    {

    }

    public static List<CombinedAllocation> Get(string agreementNumber = "", int builderId = -1, string permitNumber = "")
    {
      var dp = new DynamicParameters();

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

        ), NonVoidedPermitAllocations AS (

          SELECT
            P.Permit_Number
            ,P.Builder_Id
            ,P.Amount_Allocated
            ,P.Audit_Log
          FROM ImpactFees_Permit_Allocations P
          INNER JOIN bpMASTER_PERMIT M ON P.Permit_Number = M.PermitNo
          WHERE M.VoidDate IS NULL
        )

        SELECT 
          UPPER(LTRIM(RTRIM(A.ProjName))) Developer_Name,
          LTRIM(RTRIM(A.ApplType)) + '-' + LTRIM(RTRIM(A.ApplNum)) Agreement_Number,
          ISNULL(D.Agreement_Amount, 0) Agreement_Amount,
          ISNULL(CDA.Amount_Currently_Allocated, 0) Developer_Amount_Currently_Allocated,
          ISNULL(D.Audit_Log, '') Developer_Audit_Log,

          ISNULL(B.Amount_Allocated, 0) Builder_Allocation_Amount,
          ISNULL(B.Id, -1) Builder_Id,
          ISNULL(B.Builder_Name, '') Builder_Name,
          ISNULL(CBA.Amount_Currently_Allocated, 0) Builder_Amount_Currently_Allocated,
          ISNULL(B.Audit_Log, '') Builder_Audit_Log,

          ISNULL(P.Amount_Allocated, 0) Permit_Amount_Allocated,
          ISNULL(P.Permit_Number, '') Permit_Number,
          ISNULL(P.Audit_Log, '') Permit_Audit_Log
        
        FROM apApplication A 
        LEFT OUTER JOIN ImpactFees_Developer_Agreements D ON D.Agreement_Number =  A.apAssocKey
        LEFT OUTER JOIN ImpactFees_Builder_Allocations B ON D.Agreement_Number = B.Agreement_Number
        LEFT OUTER JOIN CurrentDeveloperAllocation CDA ON D.Agreement_Number = CDA.Agreement_Number
        LEFT OUTER JOIN NonVoidedPermitAllocations P ON P.Builder_Id = B.Id
        LEFT OUTER JOIN CurrentBuilderAllocation CBA ON B.Id = CBA.Builder_Id
        WHERE 
          A.ApplType IN ('TIMPACT', 'PFS_AGREE')

";
      if(agreementNumber.Length > 0)
      {
        query += "AND LTRIM(RTRIM(A.ApplType)) + '-' + LTRIM(RTRIM(A.ApplNum))=@Agreement_Number" + Environment.NewLine;
        dp.Add("@Agreement_Number", agreementNumber);
      }
      if(builderId != -1)
      {
        query += "AND B.Id=@Builder_Id" + Environment.NewLine;
        dp.Add("@Builder_Id", builderId);
      }
      if(permitNumber.Length > 0)
      {
        query += "AND P.Permit_Number=@Permit_Number" + Environment.NewLine;
        dp.Add("@Permit_Number", permitNumber);
      }
      return Constants.Get_Data<CombinedAllocation>(query, dp);
    }
  }
}