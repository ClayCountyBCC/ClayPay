/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="claypay.ts" />

namespace clayPay.UI
{
  "use strict"

  let Cart: Array<Charge> = [];
  let CurrentCharges: Array<Charge> = [];  
  export let ExpMonths: Array<string> = ['01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11', '12'];
  export let ExpYears: Array<string> = [];

  export function Submit():boolean
  {
    Disable('btnSubmit');
    Hide('errorList');
    Hide('PaymentPosting');
    let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
    if (!f.checkValidity()) return false;
    let itemIds: Array<number> = Cart.map(function (i)
    {
      return i.ItemId;
    });
    let total: number = Cart.reduce((total: number, b: Charge) =>
    {
      return total + b.Total;
    }, 0);
    total = parseFloat(total.toFixed(2));
    let cc = new clayPay.CCData(
      getValue('ccFirstName'),
      getValue('ccLastName'),
      getValue('cardNumber'),
      getValue('ccTypes'),
      getValue('ccExpMonth'),
      getValue('ccExpYear'),
      getValue('ccCVV'),
      getValue('ccZip'),
      getValue('emailAddress'),
      total,
      itemIds);
    let errors: Array<string> = cc.Validate(); // clientside validation
    if (errors.length === 0)
    {
      Hide('CCForm'); // Hide the form
      Show('PaymentPosting'); // show swirly

      let save = cc.Save();
      save.then(function (response)
      {
        let pr = JSON.parse(response);
        resetApp();
        PopulateReceipt(pr);
        
      },
        function (reject)
        {
          Show('errorList');
          errors = [reject];
          BuildErrors(errors);          
          Show('CCForm');
          Hide('PaymentPosting');
          Enable('btnSubmit');
        });

    } else
    {
      // show errors section
      Show('errorList');
      BuildErrors(errors);
      Enable('btnSubmit');
    }    
    return false;
  }

  function resetApp():void
  {
    CurrentCharges = [];
    Cart = [];
    updateCart();
    updateCartNav();
    // reset paymentForm
    let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
    f.reset();
    Enable('btnSubmit');
    Show('CCForm');
    Hide('PaymentPosting');

  }

  function PopulateReceipt(pr: {CashierId:string, TimeStamp_Display: string, Amount: number}):void
  {
    clayPay.toggleNavDisplay('receipt');
    SetInputValue("receiptUniqueId", pr.CashierId);
    SetInputValue("receiptTimestamp", pr.TimeStamp_Display);
    SetInputValue("receiptAmount", pr.Amount.toFixed(2));
  }

  function ToggleDisabled(id: string, status: boolean): void
  {
    (<HTMLButtonElement>document.getElementById(id)).disabled = status;
  }

  function Disable(id: string): void
  {
    ToggleDisabled(id, true);
  }

  function Enable(id: string): void
  {
    ToggleDisabled(id, false);
  }

  function BuildErrors(errors: Array<string>): void
  {
    let errorList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("errorList"));
    let df = document.createDocumentFragment();
    clearElement(errorList);    
    for (let error of errors)
    {
      let li = document.createElement("li");
      li.textContent = error;
      df.appendChild(li);
    }
    errorList.appendChild(df);
  }

  function getValue(id: string):string
  {
    return (<HTMLInputElement>document.getElementById(id)).value;
  }

  export function BuildAppTypes(appTypes: Array<AppType>):void
  {
    let appSelect: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("ApplicationTypeSelect"));
    clearElement(appSelect);
    appSelect.appendChild(createOption("-1", "Select Application Type"));
    for (let appType of appTypes)
    {
      appSelect.appendChild(createOption(appType.Value, appType.Label));
    }
  }

  export function BuildCardTypes(id: string): void
  {
    let ccTypes: { label: string, value: string }[] = [
      { label: 'American Express', value: 'AMEX' },
      { label: 'Discover', value: 'DISCOVER' },
      { label: 'MasterCard', value: 'MASTERCARD' },
      { label: 'Visa', value: 'VISA' }];
    let selectTypes: HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    clearElement(selectTypes);    
    ccTypes.map(function (ccType)
    {
      selectTypes.appendChild(createOption(ccType.value, ccType.label));
    });
  }

  export function BuildExpMonths(id: string):void
  {
    let expMonth: HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    if (expMonth === undefined) return;
    clearElement(expMonth);        
    ExpMonths.map(function(month)
    {
      expMonth.appendChild(createOption(month, month));
    });
  }

  export function BuildExpYears(id: string): void
  {
    let expYear: HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    clearElement(expYear);    
    var year = new Date().getFullYear();
    for (var i = 0; i < 10; i++)
    {
      let y = (year + i).toString();
      expYear.appendChild(createOption(y, y));
      ExpYears.push(y);
    }
  }

  function createOption(value: string, label: string): Node
  {
    let opt: HTMLOptionElement = document.createElement("option");
    opt.setAttribute("value", value);
    opt.appendChild(document.createTextNode(label));
    return opt;
  }

  export function clearElement(node: HTMLElement): void
  { // this function just emptys an element of all its child nodes.
    while (node.firstChild)
    {
      node.removeChild(node.firstChild);
    }
  }
  
  export function toggleNav(nav: string, element: string): void
  {
    let e = document.getElementById(nav);
    if (e === null) return;
    let activeNodes: NodeListOf<Element> = e.getElementsByClassName("active");

    for (var i = 0; i < activeNodes.length; i++)
    {
      activeNodes[i].classList.remove("active");
    }
    let eNav = document.getElementById("nav-" + element);
    if (eNav === null) return;
    eNav.classList.add("active");
  }

  function Show(id: string): void
  {
    let e = document.getElementById(id);
    e.style.display = "block";
  }

  function Hide(id: string): void
  {
    let e = document.getElementById(id);
    e.style.display = "none";
  }

  export function Search(key: string): boolean
  {
    Hide('InvalidSearch');
    Hide('SearchFailed');
    Hide('SearchSuccessful');
    Show('SearchResults');
    Show('Searching');
    let k: string = key.trim().toUpperCase();
    if (k.length > 0)
    {
      transport.GetCharges(k).then(function (charges: Array<Charge>)
      {
        CurrentCharges = charges;
        Hide('Searching');
        ProcessResults(charges, key);
        return true;
      }, function ()
        {
          console.log('error getting charges');
          // do something with the error here
          // need to figure out how to detect if something wasn't found
          // versus an error.
          Hide('Searching');
          return false;
        });
    } else
    {
      // This message should be "Hey, you need to enter something in order to search!"
      Hide('Searching');
      Show('InvalidSearch');
      return false;
    }
  }

  function ProcessResults(charges: Array<Charge>, key: string): void
  {
    AddCharges(charges);
    if (charges.length == 0)
    {
      UpdateSearchFailed(key);
    }
    else
    {
      Show('SearchSuccessful');
      SetValue('ChargesKey', charges[0].AssocKey);
      SetValue('ChargesDetail', charges[0].Detail);
    }
  }

  function AddCharges(charges: Array<Charge>)
  {
    let container: HTMLElement = (<HTMLElement>document.getElementById('Charges'));
    let df = document.createDocumentFragment();
    clearElement(container);    
    for (let charge of charges)
    {      
      df.appendChild(buildChargeRow(charge));
    }
    df.appendChild(buildChargeFooterRow());
    container.appendChild(df);
  }

  function buildChargeFooterRow(): DocumentFragment
  {
    let df = document.createDocumentFragment();
    let tr1 = document.createElement("tr");
    tr1.appendChild(createTableElement("", "", 3));
    tr1.appendChild(createTableElementButton(
      "Add All to Cart",
      0,
      "",
      true,
      AddAllItemsToCart,
      RemoveItemFromCart));
    df.appendChild(tr1);
    let tr2 = document.createElement("tr");
    tr2.appendChild(createTableElement("", "", 3));
    tr2.appendChild(createViewCartTableElementButton(
      "View Cart",
      clayPay.toggleNavDisplay));
    df.appendChild(tr2);
    return df;
  }

  function buildChargeRow(charge: Charge): HTMLElement
  {
    let tr = document.createElement("tr");
    tr.appendChild(createTableElement(charge.Description, "left"));
    tr.appendChild(createTableElement(charge.TimeStampDisplay));
    tr.appendChild(createTableElement(charge.Total.toFixed(2)));
    tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "", true, AddItemToCart, RemoveItemFromCart));
    return tr;
  }

  function AddItemToCart(ev: Event, itemId: number): void
  {    
    let item: Array<Charge> = CurrentCharges.filter((c: Charge) =>
    {
      return c.ItemId == itemId;
    });
    if (item.length === 1 && Cart.indexOf(item[0]) === -1)
    {
      Cart.push(item[0]);
    }
    ToggleAddRemoveButtons(itemId);
    //let btnAdd: HTMLElement = document.getElementById("btnAdd" + itemId.toString());
    //let btnRem: HTMLElement = document.getElementById("btnRemove" + itemId.toString());
    //btnAdd.style.display = "none";
    //btnRem.style.display = "block";
    updateCart();
  }

  function RemoveItemFromCart(ev: Event, itemId: number, toggle: boolean): void
  {
    let newCart: Array<Charge> = Cart.filter((c: Charge) =>
    {
      return c.ItemId !== itemId;
    });
    Cart = newCart;
    if(toggle) ToggleAddRemoveButtons(itemId);
    updateCart();
  }

  function ToggleAddRemoveButtons(itemId: number):void
  {
    
    let btnAdd: HTMLElement = document.getElementById("btnAdd" + itemId.toString());
    let btnRem: HTMLElement = document.getElementById("btnRemove" + itemId.toString());
    let showAdd: boolean = btnAdd.style.display === "inline-block";
    btnAdd.style.display = showAdd ? "none" : "inline-block";
    btnRem.style.display = showAdd ? "inline-block" : "none";    
  }

  function IsItemInCart(itemId: number): boolean
  {
    let item: Array<Charge> = Cart.filter((c: Charge) =>
    {
      return c.ItemId == itemId;
    });
    return item.length !== 0;
  }

  function AddAllItemsToCart(): void
  {
    for (let charge of CurrentCharges)
    {
      if (!IsItemInCart(charge.ItemId))
      {
        Cart.push(charge);
      }
    }
    updateCart();
    // we're going to rerun the "Create Table" so that it'll 
    // update each row
    AddCharges(CurrentCharges);
  }

  function createTableElement(
    value: string,
    className?: string,
    colspan?: number): HTMLElement
  {
    let d = document.createElement("td");
    if (className !== undefined)
    {
      d.className = className;
    }
    if (colspan !== undefined)
    {
      d.colSpan = colspan;
    }
    d.appendChild(document.createTextNode(value));
    return d;
  }

  function createTableElementButton(
    value: string,
    itemId: number,
    className: string,
    toggle: boolean,
    addOnClickFunction: (ev: Event, i: number) => void,
    removeOnClickFunction: (ev: Event, i: number, t: boolean) => void): HTMLElement
  {
    let IsInCart: boolean = IsItemInCart(itemId);
    let d = document.createElement("td");
    d.className = className;
    let add = document.createElement("button");
    add.style.display = IsInCart ? "none" : "inline-block";
    add.type = "button";
    add.id = "btnAdd" + itemId.toString();
    add.className = "btn btn-primary";
    add.onclick = (ev: Event) =>
    {
      addOnClickFunction(ev, itemId);
    }
    let remove = document.createElement("div");
    remove.id = "btnRemove" + itemId.toString();
    remove.style.display = IsInCart ? "inline-block" : "none";
    remove.appendChild(document.createTextNode('Added ('));
    let removeButton = document.createElement("a");    
    removeButton
    removeButton.style.color = "darkgoldenrod";
    removeButton.style.cursor = "pointer";
    removeButton.appendChild(document.createTextNode('remove'));
    removeButton.onclick = (ev: Event) =>
    {
      removeOnClickFunction(ev, itemId, toggle);
    }
    remove.appendChild(removeButton);
    remove.appendChild(document.createTextNode(')'));
    add.appendChild(document.createTextNode(value));
    d.appendChild(add);
    d.appendChild(remove);
    return d;
  }

  function createAddAllTableElementButton(
    value: string,
    ViewCartClickFunction: (id: string) => void): HTMLElement
  {

    let d = document.createElement("td");
    let add = document.createElement("button");
    add.type = "button";
    add.className = "btn btn-primary";
    add.onclick = (ev: Event) =>
    {
      ViewCartClickFunction('cart');
    }
    add.appendChild(document.createTextNode(value));
    d.appendChild(add);
    return d;
  }


  function createViewCartTableElementButton(
    value: string,            
    ViewCartClickFunction: (id: string) => void): HTMLElement
  {
    
    let d = document.createElement("td");    
    let add = document.createElement("button");    
    add.type = "button";    
    add.className = "btn btn-success";
    add.onclick = (ev: Event) =>
    {
      ViewCartClickFunction('cart');
    }
    add.appendChild(document.createTextNode(value));
    d.appendChild(add);
    return d;
  }

  function SetInputValue(id: string, value: string)
  {
    let e: HTMLInputElement = <HTMLInputElement>document.getElementById(id);
    e.value = value;    
  }

  function SetValue(id: string, value: string)
  {
    let e: HTMLElement = document.getElementById(id);
    clearElement(e);
    e.appendChild(document.createTextNode(value));
  }

  function UpdateSearchFailed(key: string): void
  {
    let e: HTMLElement = document.getElementById('SearchFailed');
    clearElement(e);
    let message: HTMLHeadingElement = (<HTMLHeadingElement>document.createElement("h4"));
    message.appendChild(document.createTextNode("No charges were found for search: " + key));
    e.appendChild(message);
    Show('SearchFailed');
  }

  function updateCartNav():void
  {
    // This function is going to take the contents of the Cart array and 
    // update the CartNav element.
    // it's also going to make some changes to the cart Div, 
    // specifically it's going to hide and unhide the CartEmpty Div
    // based on the size of the array.
    let CartNav: HTMLElement = document.getElementById('CartNav');
    clearElement(CartNav);
    let cartIcon = document.createElement("span");
    cartIcon.classList.add("glyphicon");
    cartIcon.classList.add("glyphicon-shopping-cart");
    CartNav.appendChild(cartIcon);
    if (Cart.length === 0)
    {
      Hide('CartNotEmpty');
      Show('CartEmpty');      

      CartNav.appendChild(document.createTextNode('Cart: ('));
      let span = document.createElement("span");
      span.style.color = "darkgoldenrod";
      span.appendChild(document.createTextNode('empty'));
      CartNav.appendChild(span);
      CartNav.appendChild(document.createTextNode(')'));

    } else
    {
      Show('CartNotEmpty');
      Hide('CartEmpty');
      CartNav.appendChild(document.createTextNode('Cart: ' + Cart.length.toString() + (Cart.length === 1 ? ' item': ' items')));
    }
  }

  function updateCart(): void
  {
    let CartCharges: HTMLElement = document.getElementById('CartCharges');
    let df = document.createDocumentFragment();
    clearElement(CartCharges);
    for (let charge of Cart)
    {
      df.appendChild(buildCartRow(charge));
    }
    df.appendChild(buildCartFooterRow());
    df.appendChild(buildCartConvFeeFooterRow());
    CartCharges.appendChild(df);
    updateCartNav();
  }

  function buildCartFooterRow(): HTMLElement
  {
    let tr = document.createElement("tr");
    tr.style.fontWeight = "bolder";
    tr.appendChild(createTableElement("", "", 2));
    tr.appendChild(createTableElement("Total", "center", 1));
    let TotalAmount: number = Cart.reduce((total:number, b: Charge) =>
    {
      return total + b.Total;
    }, 0);
    tr.appendChild(createTableElement(TotalAmount.toFixed(2), "", 1));
    tr.appendChild(createTableElement("", "", 1));
    return tr;
  }

  function buildCartConvFeeFooterRow(): HTMLElement
  {
    let tr = document.createElement("tr");
    tr.style.fontWeight = "bolder";
    tr.appendChild(createTableElement("Please Note: There is a nonrefundable transaction fee charged by our payment provider. This is charged in addition to the total above.", "", 2));
    tr.appendChild(createTableElement("Conv. Fee", "center", 1));
    tr.appendChild(createTableElement(clayPay.ConvenienceFee, "", 1));
    tr.appendChild(createTableElement("", "", 1));
    return tr;
  }

  function buildCartRow(charge: Charge): HTMLElement
  {
    let tr = document.createElement("tr");
    tr.appendChild(createTableElement(charge.AssocKey));
    tr.appendChild(createTableElement(charge.Description, "left"));
    tr.appendChild(createTableElement(charge.TimeStampDisplay, "center"));
    tr.appendChild(createTableElement(charge.Total.toFixed(2), "center"));
    tr.appendChild(createTableElementButton("Add to Cart", charge.ItemId, "center", true, AddItemToCart, RemoveItemFromCart));
    return tr;
  }

}