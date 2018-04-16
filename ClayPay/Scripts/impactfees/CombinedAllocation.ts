/// <reference path="../app/xhr.ts" />


namespace ImpactFees
{
  interface ICombinedAllocation
  {
    Developer_Name: string;
    Agreement_Number: number;
    Agreement_Amount: number;
    Developer_Amount_Currently_Allocated: number;

    Builder_Id: number;
    Builder_Name: string;
    Builder_Amount_Allocated: number;
    Builder_Amount_Currently_Allocated: number;

    Permit_Number: string;
    Permit_Amount_Allocated: number;

    GetAll(): Promise<Array<CombinedAllocation>>;

  }

  export class CombinedAllocation implements ICombinedAllocation
  {
    public Developer_Name: string;
    public Agreement_Number: number;
    public Agreement_Amount: number;
    public Developer_Amount_Currently_Allocated: number;
    public Builder_Id: number;
    public Builder_Name: string;
    public Builder_Amount_Allocated: number;
    public Builder_Amount_Currently_Allocated: number;
    public Permit_Number: string;
    public Permit_Amount_Allocated: number;

    constructor()
    {

    }

    public GetAll(): Promise<Array<CombinedAllocation>>
    {
      var x = XHR.Get("./API/ImpactFees/GetCombinedAllocations");
      return new Promise<Array<CombinedAllocation>>(function (resolve, reject)
      {
        x.then(function (response)
        {
          let ar: Array<CombinedAllocation> = JSON.parse(response.Text);
          resolve(ar);
        }).catch(function ()
        {
          console.log("error in Get Combined Allocation");
          reject(null);
        });
      });
    }

  }



}