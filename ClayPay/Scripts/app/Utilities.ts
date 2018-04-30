
namespace Utilities
{

  export function Hide(e: HTMLElement)
  {
    e.classList.add("hide");
    e.classList.remove("show");
    e.classList.remove("show-inline");
    e.classList.remove("show-flex");
  }

  export function Show(e: HTMLElement)
  {
    e.classList.add("show");
    e.classList.remove("hide");
  }

  export function Show_Inline(e: HTMLElement)
  {
    e.classList.add("show-inline");
    e.classList.remove("hide");
  }

  export function Show_Flex(e: HTMLElement)
  {
    e.classList.add("show-flex");
    e.classList.remove("hide");
  }

  export function Error_Show(e: string):void
  export function Error_Show(e: HTMLElement): void
  export function Error_Show(e: any):void
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    Show(e);
    window.setTimeout(function (j)
    {
      Hide(e);
    }, 10000)
  }

  export function Clear_Element(node: HTMLElement): void
  { // this function just emptys an element of all its child nodes.
    if (node === null || node === undefined) return;
    while (node.firstChild)
    {
      node.removeChild(node.firstChild);
    }
  }

  export function Create_Option(value: string, label: string, selected: boolean = false): HTMLOptionElement
  {
    let o = document.createElement("option");
    o.value = value;
    o.text = label;
    o.selected = selected;
    return o;
  }


}