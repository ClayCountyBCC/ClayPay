
namespace Utilities
{
  export function Hide(e: string)
  export function Hide(e: HTMLElement)
  export function Hide(e: any)
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    e.classList.add("hide");
    e.classList.remove("show");
    e.classList.remove("show-inline");
    e.classList.remove("show-flex");
  }

  export function Show(e: string)
  export function Show(e: HTMLElement)
  export function Show(e: any)
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    e.classList.add("show");
    e.classList.remove("hide");
    e.classList.remove("show-inline");
    e.classList.remove("show-flex");
  }

  export function Show_Inline(e: string)
  export function Show_Inline(e: HTMLElement)
  export function Show_Inline(e: any)
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    e.classList.add("show-inline");
    e.classList.remove("hide");
    e.classList.remove("show");
    e.classList.remove("show-flex");
  }

  export function Show_Flex(e: string)
  export function Show_Flex(e: HTMLElement)
  export function Show_Flex(e: any)
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    e.classList.add("show-flex");
    e.classList.remove("hide");
    e.classList.remove("show-inline");
    e.classList.remove("show");
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