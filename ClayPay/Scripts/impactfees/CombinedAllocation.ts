/// <reference path="../app/xhr.ts" />


namespace ImpactFees
{
  interface ICombinedAllocation
  {
    Developer_Name: string;
    Agreement_Number: string;
    Agreement_Amount: number;
    Agreement_Amount_Formatted: string;
    Developer_Amount_Currently_Allocated: number;
    Developer_Amount_Currently_Allocated_Formatted: string;
    Developer_Audit_Log: string;

    Builder_Id: number;
    Builder_Name: string;
    Builder_Allocation_Amount: number;
    Builder_Allocation_Amount_Formatted: string;
    Builder_Amount_Currently_Allocated: number;
    Builder_Amount_Currently_Allocated_Formatted: string;
    Builder_Audit_Log: string;

    Permit_Number: string;
    Permit_Amount_Allocated: number;
    Permit_Audit_Log: string;
  }

  export class CombinedAllocation implements ICombinedAllocation
  {
    public Developer_Name: string;
    public Agreement_Number: string;
    public Agreement_Amount: number;
    public Agreement_Amount_Formatted: string;
    public Developer_Amount_Currently_Allocated: number;
    public Developer_Amount_Currently_Allocated_Formatted: string;
    public Developer_Audit_Log: string;
    public Builder_Id: number;
    public Builder_Name: string;
    public Builder_Allocation_Amount: number;
    public Builder_Allocation_Amount_Formatted: string;
    public Builder_Amount_Currently_Allocated: number;
    public Builder_Amount_Currently_Allocated_Formatted: string;
    public Builder_Audit_Log: string;
    public Permit_Number: string;
    public Permit_Amount_Allocated: number;
    public Permit_Audit_Log: string;

    constructor()
    {

    }

    public static GetAll(agreementNumber: string, builderId: number, permitNumber: string): Promise<Array<CombinedAllocation>>
    {
      let qs: string = "";
      if (agreementNumber.length > 0)
      {
        qs = "&agreementNumber=" + agreementNumber;
      }
      if (builderId != -1)
      {
        qs = "&builderId=" + builderId.toString();
      }
      if (permitNumber.length > 0)
      {
        qs = "&permitNumber=" + permitNumber;
      }
      if (qs.length > 0)
      {
        qs = "?" + qs.substr(1); // no matter which arguments we used, we'll always remove the leading & and add a ?
      }
      return Utilities.Get("./API/ImpactFees/GetAgreements" + qs);
      //return fetch("./API/ImpactFees/GetAgreements" + qs) : Promise<Array<CombinedAllocation>>;
      //return XHR.GetArray<CombinedAllocation>("./API/ImpactFees/GetAgreements", qs);
    }

  }



}