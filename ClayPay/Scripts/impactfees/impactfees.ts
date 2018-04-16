/// <reference path="../app/utilities.ts" />
/// <reference path="../app/xhr.ts" />


namespace ImpactFees
{

  export function Start()
  {
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

}