using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.ImpactFees
{
  public class PermitImpactFee
  {
    public string Permit_Number { get; set; }
    private DateTime? Issue_Date { get; set; }
    private DateTime? Void_Date { get; set; }
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

    public PermitImpactFee()
    {

    }

    private bool Validate_Permit_Agreement_Boundary(string Agreement_Number)
    {
      return true;
    }

    public static PermitImpactFee Get(string Permit_Number, string Agreement_Number = "")
    {
      var dp = new DynamicParameters();
      dp.Add("@Permit_Number", Permit_Number);
      string query = @"
        SELECT
          M.PermitNo Permit_Number,
          M.IssueDate Issue_Date,
          M.VoidDate Void_Date,
          B.ContractorId Contractor_Id,
          ISNULL(C.CompanyName, '') Contractor_Name,
          B.X,
          B.Y,
          CI.Total ImpactFee_Amount,
          CI.CashierId Cashier_Id
        FROM bpMASTER_PERMIT M
        INNER JOIN bpBASE_PERMIT B ON M.BaseID = B.BaseID
        LEFT OUTER JOIN clContractor C ON B.ContractorId = C.ContractorCd
        LEFT OUTER JOIN ccCashierItem CI ON M.PermitNo = CI.AssocKey AND CI.CatCode IN ('IFRD2', 'IFRD3')
        LEFT OUTER JOIN ccCashier CC ON CI.CashierId = CC.CashierId AND CC.IsVoided = 0
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
      var p = new PermitImpactFee();
      p.Error_Text = $"Permit Number {Permit_Number} was not found.";
      return p;
    }

    private void Validate(string Agreement_Number)
    {
      if (!Issue_Date.HasValue)
      {
        Error_Text = "This permit has not yet been issued.";
        return;
      }
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