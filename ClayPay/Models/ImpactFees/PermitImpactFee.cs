using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
using System.Data.SqlClient;
using System.Data;

namespace ClayPay.Models.ImpactFees
{
  public class PermitImpactFee
  {
    public string Permit_Number { get; set; } = "";
    private DateTime? Issue_Date { get; set; }
    private DateTime? Void_Date { get; set; }
    public int? ItemId { get; set; }
    public decimal? ImpactFee_Amount { get; set; }
    public string ImpactFee_Amount_Formatted
    {
      get
      {
        if (ImpactFee_Amount.HasValue)
        {
          return ImpactFee_Amount.Value.ToString("C2");
        }
        return "Not Found";
      }
    }
    public string Contractor_Id { get; set; }
    public string Contractor_Name { get; set; }
    private decimal? X { get; set; }
    private decimal? Y { get; set; }
    public string Cashier_Id { get; set; } = "";
    public string Error_Text { get; set; } = "";
    public decimal? Amount_Allocated { get; set; }

    public PermitImpactFee()
    {

    }

    private bool Validate_Permit_Agreement_Boundary(string Agreement_Number)
    {
      if (Agreement_Number.Length == 0) return true;
      // 2881 is the SRID for our local state plane projection
      var dp = new DynamicParameters();
      if (!X.HasValue || !Y.HasValue) return false;
      dp.Add("@Agreement_Number", "TIMPACT-" + Agreement_Number);
      dp.Add("@X", X.Value);
      dp.Add("@Y", Y.Value);
      string query = @"
        DECLARE @Point geometry = geometry::STPointFromText('POINT (' + 
          CONVERT(VARCHAR(20), @X) + ' ' + 
          CONVERT(VARCHAR(20), @Y) + ')', 2881);
        SELECT 
          SHAPE.STIntersects(@Point) Inside
        FROM IMS_APPLICATIONS
        WHERE 
          Appl_Number=@Agreement_Number";
      try
      {
        using (IDbConnection db =
          new SqlConnection(
            Constants.Get_ConnStr("GIS")))
        {
          int? i = (int?)db.ExecuteScalar(query, dp);
          return (i.HasValue && i.Value == 1);
        }
      }
      catch (Exception ex)
      {
        new ErrorLog(ex, query);
        return false;
      }
    }

    public static PermitImpactFee Get(
      string Permit_Number,
      string Search_Type,
      string Agreement_Number = "")
    {
      var dp = new DynamicParameters();
      dp.Add("@Permit_Number", Permit_Number);
      List<string> catCodes = new List<string>();
      if (Search_Type == "IFWS")
      {
        catCodes.Add("IFSCH"); // School Impact Fee
      }
      else
      {
        catCodes.Add("IFRD2");
        catCodes.Add("IFRD3");
      }
      dp.Add("@CatCodes", catCodes);
      string query = @"
        SELECT
          M.PermitNo Permit_Number,
          M.IssueDate Issue_Date,
          M.VoidDate Void_Date,
          B.ContractorId Contractor_Id,
          ISNULL(LTRIM(RTRIM(C.CompanyName)), '') Contractor_Name,
          B.X,
          B.Y,
          CI.ItemId ItemId,
          CI.Total ImpactFee_Amount,
          LTRIM(RTRIM(CI.CashierId)) Cashier_Id,
          PA.Amount_Allocated
        FROM bpMASTER_PERMIT M
        INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
        LEFT OUTER JOIN clContractor C ON B.ContractorId = C.ContractorCd
        LEFT OUTER JOIN ccCashierItem CI ON M.PermitNo = CI.AssocKey AND CI.CatCode IN @CatCodes
        LEFT OUTER JOIN ccCashier CC ON CI.CashierId = CC.CashierId AND CC.IsVoided = 0
        LEFT OUTER JOIN ImpactFees_Permit_Allocations PA ON M.PermitNo = PA.Permit_Number
        WHERE M.PermitNo=@Permit_Number;";
      var permits = Constants.Get_Data<PermitImpactFee>(query, dp);
      // if we get multiple permits back for one permit number, we've most likely got multiple impact fees on the permit.
      if(permits.Count() >= 1)
      {
        var permit = permits.First();
        if(permits.Count > 1)
        {
          permit.Error_Text = "This permit has multiple Impact fees.  If this is not the case, please contact MIS with this permit number and error message.";
          return permit;
        }
        permit.Validate(Agreement_Number);
        return permit;
      }
      var p = new PermitImpactFee
      {
        Error_Text = $"Permit Number {Permit_Number} was not found."
      };
      return p;
    }

    private void Validate(string Agreement_Number)
    {
      if(Cashier_Id.Length > 0)
      {
        if (!Amount_Allocated.HasValue)
        {
          Error_Text = "This fee has already been paid, so it is not eligible for the impact fee credit process.";
        }
      }
      //if (!Issue_Date.HasValue)
      //{
      //  Error_Text = "This permit has not yet been issued.";
      //  return;
      //}
      if (Void_Date.HasValue)
      {
        Error_Text = "This permit has been voided.";
        return;
      }
      if(!X.HasValue || !Y.HasValue)
      {
        Error_Text = "This permit has an invalid X/Y so we cannot procede.";
        return;
      }
      if(X.Value == 0 || Y.Value == 0)
      {
        Error_Text = "This permit has an invalid X/Y so we cannot procede.";
        return;
      }
      if (!ImpactFee_Amount.HasValue)
      {
        Error_Text = "This permit does not have a recognized Impact Fee that can be credited via this process.  Only charges with Cat Code IFRD2 or IFRD3 can be credited.";
        return;
      }
      if(ImpactFee_Amount.Value <= 0)
      {
        Error_Text = "This permit's Impact Fee is 0 or less.";
        return;
      }
      if (!Validate_Permit_Agreement_Boundary(Agreement_Number))
      {
        Error_Text = "This permit is not inside this agreement's assigned land area.";
        return;
      }


    }
  }
}