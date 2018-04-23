/// <reference path="../app/xhr.ts" />

namespace ImpactFees
{
  interface IPermitAllocation
  {
    Builder_Id: number;
    Permit_Number: string;
    Amount_Allocated: number;
    Audit_Log: string;
  }

  export class PermitAllocation implements IPermitAllocation
  {
    public Builder_Id: number;
    public Permit_Number: string;
    public Amount_Allocated: number;
    public Audit_Log: string;

    constructor()
    {

    }

    //public GetAll(): Promise<Array<PermitAllocation>>
    //{
    //  var x = XHR.Get("./API/ImpactFees/GetDeveloperAgreements");
    //  return new Promise<Array<PermitAllocation>>(function (resolve, reject)
    //  {
    //    x.then(function (response)
    //    {
    //      let ar: Array<PermitAllocation> = JSON.parse(response.Text);
    //      resolve(ar);
    //    }).catch(function ()
    //    {
    //      console.log("error in Get Builder Allocations");
    //      reject(null);
    //    });
    //  });
    //}

    public Load(): void
    {
      // this function loads the current object into the HTML form 



    }

  }
  
}