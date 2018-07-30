
namespace ImpactFees
{
  interface IPermitImpactFee
  {
    Permit_Number: string;
    ImpactFee_Amount: number;
    ImpactFee_Amount_Formatted: string;
    Contractor_Id: string;
    Contractor_Name: string;
    Cashier_Id: string;
    Error_Text: string;
    Amount_Allocated: number;
  }
  export class PermitImpactFee implements IPermitImpactFee
  {
    public Permit_Number: string;
    public ImpactFee_Amount: number;
    public ImpactFee_Amount_Formatted: string;
    public Contractor_Id: string;
    public Contractor_Name: string;
    public Cashier_Id: string;
    public Error_Text: string;
    public Amount_Allocated: number;
    constructor()
    {

    }

    public static Get(
      Permit_Number: string,
      Agreement_Number: string = "",
      Search_Type: string): Promise<PermitImpactFee>
    {
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }

      let qs = "?permit_number=" + Permit_Number.trim();
      qs += "&search_type=" + Search_Type;
      if (Agreement_Number.length > 0)
      {
        qs += "&agreement_number=" + Agreement_Number;
      }
      return Utilities.Get<PermitImpactFee>(path + "API/ImpactFees/GetPermit" + qs);
    }

  }


}