/// <reference path="../app/utilities.ts" />
/// <reference path="../app/xhr.ts" />


namespace ImpactFees
{
  export let CombinedAllocations: Array<CombinedAllocation> = [];


  export function Start()
  {
    LoadAgreements();
  }

  export function Menu(id: string)
  {
    let sections = <NodeListOf<HTMLElement>>document.querySelectorAll("body > section");
    if (sections.length > 0)
    {
      for (let i = 0; i < sections.length; i++)
      {
        let item = sections.item(i);
        if (sections.item(i).id === id)
        {
          item.classList.remove("hide");
          item.classList.add("show");
        }
        else
        {
          item.classList.remove("show");
          item.classList.add("hide");
        }
      }
    }
  }

  function LoadAgreements()
  {
    CombinedAllocation.GetAll("", -1, "").then(
      function (a)
    {
      CombinedAllocations = a;
      PopulateAgreementDropdowns(a);
    });
  }

  function PopulateAgreementDropdowns(agreements: Array<CombinedAllocation>): void
  {
    let added = [];
    let developer = <HTMLSelectElement>document.getElementById("developerAgreementAdd");
    let builder = <HTMLSelectElement>document.getElementById("builderAllocationAgreementAdd");
    let permit = <HTMLSelectElement>document.getElementById("permitAllocationAgreementAdd");
    for (let a of agreements)
    {
      if (added.indexOf(a.Agreement_Number) === -1)
      {
        added.push(a.Agreement_Number)
        let label = a.Agreement_Number + ' - ' + a.Developer_Name;
        developer.add(Utilities.Create_Option(a.Agreement_Number, label));
        if (a.Agreement_Amount > 0)
        { // we don't need to make them selectable if there is no money allocated to this developer.
          builder.add(Utilities.Create_Option(a.Agreement_Number, label));
          permit.add(Utilities.Create_Option(a.Agreement_Number, label));
        }

      }

    }
  }

  export function GetArray<T>(url: string, queryString: string = ""): Promise<Array<T>>
  {
    var x = XHR.Get(url + queryString);
    return new Promise<Array<T>>(function (resolve, reject)
    {
      x.then(function (response)
      {
        let ar: Array<T> = JSON.parse(response.Text);
        resolve(ar);
      }).catch(function ()
      {
        console.log("error in Get " + url);
        reject(null);
      });
    });
  }

  export function SaveObject<T>(url: string, object: T):Promise<Array<string>>
  {
    var x = XHR.Post(url, JSON.stringify(object));
    return new Promise<Array<string>>(function (resolve, reject)
    {
      x.then(function (response)
      {
        if (response.Text.length === 0)
        {
          resolve([]);
        }
        else
        {
          let ar: Array<string> = JSON.parse(response.Text);
          resolve(ar);
        }
      }).catch(function (e)
      {
        console.log('save object error ' + url + ' ' + e);
        reject(null);
      });
    });
  }


}