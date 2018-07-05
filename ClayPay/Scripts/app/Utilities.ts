
namespace Utilities
{
  export function Hide(e: string)
  export function Hide(e: HTMLElement)
  export function Hide(e: Element)
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
  export function Show(e: Element)
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
  export function Show_Inline(e: Element)
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
  export function Show_Flex(e: Element)
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

  export function Error_Show(e: string, errorText?: string): void
  export function Error_Show(e: HTMLElement, errorText?: string ): void
  export function Error_Show(e: Element, errorText?: string): void
  export function Error_Show(e: any, errorText?: string): void
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    if (errorText)
    {
      Set_Text(e, errorText);
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

  export function Get_Value(e: string): string
  export function Get_Value(e: HTMLSelectElement): string
  export function Get_Value(e: HTMLInputElement): string
  export function Get_Value(e: any): string
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    return (<HTMLInputElement>e).value;
  }

  export function Set_Value(e: string, value: string): void
  export function Set_Value(e: HTMLSelectElement, value: string): void
  export function Set_Value(e: HTMLInputElement, value: string): void
  export function Set_Value(e: any, value: string): void
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    (<HTMLInputElement>e).value = value;
  }

  export function Set_Text(e: string, value: string): void
  export function Set_Text(e: HTMLElement, value: string): void
  export function Set_Text(e: any, value: string): void
  {
    if (typeof e == "string")
    {
      e = document.getElementById(e);
    }
    Clear_Element(e);
    (<HTMLElement>e).appendChild(document.createTextNode(value));
  }

  export function Show_Menu(elementId: string)
  {
    //let element = e.srcElement;
    // we expect the element's id to be in a "nav-XXX" name format, where 
    // XXX is the element we want to show 
    let id = elementId.replace("nav-", "");
    let menuItems = <NodeListOf<HTMLElement>>document.querySelectorAll("#menuTabs > li > a");
    if (menuItems.length > 0)
    {
      for (let i = 0; i < menuItems.length; i++)
      {
        let item = menuItems.item(i);
        if (item.id === elementId)
        {
          item.parentElement.classList.add("is-active");
        }
        else
        {
          item.parentElement.classList.remove("is-active");
        }
      }
    }
    Show_Hide_Selector("#views > section", id);
  }

  export function Show_Hide_Selector(selector: string, id: string)
  {
    let sections = <NodeListOf<HTMLElement>>document.querySelectorAll(selector);
    if (sections.length > 0)
    {
      for (let i = 0; i < sections.length; i++)
      {
        let item = sections.item(i);
        if (item.id === id)
        {
          Show(item);
        }
        else
        {
          Hide(item);
        }
      }
    }
  }

  export function Get<T>(url: string): Promise<T>
  {
    return fetch(url,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Upgrade-Insecure-Requests": "1"
        },
        credentials: "include"
      }
    )
      .then(response =>
      {
        if (!response.ok)
        {
          throw new Error(response.statusText)
        }
        return response.json();
      });
  }

  export function Post<T>(url: string, data: T): Promise<Array<string>>
  {
    return fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json"
      }, 
      credentials: "include"
    }).then(response =>
    {
      if (!response.ok)
      {
        throw new Error(response.statusText)
      }
      return response.json();
    })
  }


}