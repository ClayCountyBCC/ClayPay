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
    let permit = <HTMLSelectElement>document.getElementById("permitSelectAgreement");
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
          if (a.Builder_Allocation_Amount > 0) // same for the permit and the builder.
          {
            permit.add(Utilities.Create_Option(a.Agreement_Number, label));
          }
        }
      }

    }
  }




}