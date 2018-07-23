/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="claypay.ts" />

namespace clayPay.UI
{
  "use strict"


  
  export const ExpMonths: Array<string> = ['01', '02', '03', '04', '05',
    '06', '07', '08', '09', '10', '11', '12'];
  export const AllStates: Array<{ state: string, abv: string }> =
    [
      {state: "Select", abv: ""},
      { state: "ALABAMA", abv: "AL" },
      { state: "ALASKA", abv: "AK" },
      { state: "ARIZONA", abv: "AZ" },
      { state: "ARKANSAS", abv: "AR" },
      { state: "CALIFORNIA", abv: "CA" },
      { state: "COLORADO", abv: "CO" },
      { state: "CONNECTICUT", abv: "CT" },
      { state: "DELAWARE", abv: "DE" },
      { state: "FLORIDA", abv: "FL" },
      { state: "GEORGIA", abv: "GA" },
      { state: "HAWAII", abv: "HI" },
      { state: "IDAHO", abv: "ID" },
      { state: "ILLINOIS", abv: "IL" },
      { state: "INDIANA", abv: "IN" },
      { state: "IOWA", abv: "IA" },
      { state: "KANSAS", abv: "KS" },
      { state: "KENTUCKY", abv: "KY" },
      { state: "LOUISIANA", abv: "LA" },
      { state: "MAINE", abv: "ME" },
      { state: "MARYLAND", abv: "MD" },
      { state: "MASSACHUSETTS", abv: "MA" },
      { state: "MICHIGAN", abv: "MI" },
      { state: "MINNESOTA", abv: "MN" },
      { state: "MISSISSIPPI", abv: "MS" },
      { state: "MISSOURI", abv: "MO" },
      { state: "MONTANA", abv: "MT" },
      { state: "NEBRASKA", abv: "NE" },
      { state: "NEVADA", abv: "NV" },
      { state: "NEW HAMPSHIRE", abv: "NH" },
      { state: "NEW JERSEY", abv: "NJ" },
      { state: "NEW MEXICO", abv: "NM" },
      { state: "NEW YORK", abv: "NY" },
      { state: "NORTH CAROLINA", abv: "NC" },
      { state: "NORTH DAKOTA", abv: "ND" },
      { state: "OHIO", abv: "OH" },
      { state: "OKLAHOMA", abv: "OK" },
      { state: "OREGON", abv: "OR" },
      { state: "PENNSYLVANIA", abv: "PA" },
      { state: "RHODE ISLAND", abv: "RI" },
      { state: "SOUTH CAROLINA", abv: "SC" },
      { state: "SOUTH DAKOTA", abv: "SD" },
      { state: "TENNESSEE", abv: "TN" },
      { state: "TEXAS", abv: "TX" },
      { state: "UTAH", abv: "UT" },
      { state: "VERMONT", abv: "VT" },
      { state: "VIRGINIA", abv: "VA" },
      { state: "WASHINGTON", abv: "WA" },
      { state: "WEST VIRGINIA", abv: "WV" },
      { state: "WISCONSIN", abv: "WI" },
      { state: "WYOMING", abv: "WY" }
  ];
  export let ExpYears: Array<string> = [];
  export let Menus: Array<{ id: string, title: string, subTitle: string, icon: string, label: string, selected: boolean }> =  [
    {
      id: "nav-Home",
      title: "Welcome!",
      subTitle: "You can use this application to easily find and pay Clay County fees.",
      icon: "fas fa-home",
      label: "Home",
      selected: true
    },
    {
      id: "nav-permitFees",
      title: "Search by Permit Number",
      subTitle: "Searching by Permit number will show you all of the unpaid fees for a given permit number.",
      icon: "fas fa-file",
      label: "Permit Fees",
      selected: false
    },
    {
      id: "nav-contractorFees",
      title: "Search by Contractor ID number",
      subTitle: "Searching by Contractor ID will list any unpaid fees for a given contractor.",
      icon: "fas fa-user",
      label: "Contractor Fees",
      selected: false
    },
    {
      id: "nav-applicationFees",
      title: "Search by Application Type and Application Number",
      subTitle: "Pick an application type and then enter an application number to see any unpaid fees associated with that application.",
      icon: "fas fa-clipboard",
      label: "Application Fees",
      selected: false
    },
    {
      id: "nav-cart",
      title: "Your Shopping Cart",
      subTitle: "Shows the charges you have added to your shopping cart. You can pay for them here.",
      icon: "fas fa-shopping-cart",
      label: "Cart",
      selected: false
    }
  ];

  //export function Submit():boolean
  //{
  //  Disable('btnSubmit');
  //  Utilities.Hide('errorList');
  //  Utilities.Hide('PaymentPosting');
  //  let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
  //  if (!f.checkValidity()) return false;
  //  let itemIds: Array<number> = Cart.map(function (i)
  //  {
  //    return i.ItemId;
  //  });
  //  let total: number = Cart.reduce((total: number, b: Charge) =>
  //  {
  //    return total + b.Total;
  //  }, 0);
  //  total = parseFloat(total.toFixed(2));
  //  let cc = new clayPay.CCPayment();
  //  let errors: Array<string> = cc.Validate(); // clientside validation
  //  if (errors.length === 0)
  //  {
  //    Utilities.Hide('CCForm'); // Hide the form
  //    Utilities.Show('PaymentPosting'); // show swirly

  //    //let save = cc.Save();
  //    //save.then(function (response)
  //    //{
  //    //  let pr = JSON.parse(response);
  //    //  resetApp();
  //    //  PopulateReceipt(pr);
        
  //    //},
  //    //  function (reject)
  //    //  {
  //    //    Utilities.Show('errorList');
  //    //    errors = [reject];
  //    //    BuildErrors(errors);          
  //    //    Utilities.Show('CCForm');
  //    //    Utilities.Hide('PaymentPosting');
  //    //    Enable('btnSubmit');
  //    //  });

  //  } else
  //  {
  //    // show errors section
  //    Utilities.Show('errorList');
  //    BuildErrors(errors);
  //    Enable('btnSubmit');
  //  }    
  //  return false;
  //}

  //function resetApp():void
  //{
  //  CurrentCharges = [];
  //  Cart = [];
  //  updateCart();
  //  updateCartNav();
  //  // reset paymentForm
  //  let f: HTMLFormElement = <HTMLFormElement>document.getElementById('paymentForm');
  //  f.reset();
  //  Enable('btnSubmit');
  //  Utilities.Show('CCForm');
  //  Utilities.Hide('PaymentPosting');

  //}

  //function PopulateReceipt(pr: {CashierId:string, TimeStamp_Display: string, Amount: number}):void
  //{
  //  //clayPay.toggleNavDisplay('receipt');
  //  Utilities.Set_Value("receiptUniqueId", pr.CashierId);
  //  Utilities.Set_Value("receiptTimestamp", pr.TimeStamp_Display);
  //  Utilities.Set_Value("receiptAmount", pr.Amount.toFixed(2));
  //}

  //function ToggleDisabled(id: string, status: boolean): void
  //{
  //  (<HTMLButtonElement>document.getElementById(id)).disabled = status;
  //}

  //function Disable(id: string): void
  //{
  //  ToggleDisabled(id, true);
  //}

  //function Enable(id: string): void
  //{
  //  ToggleDisabled(id, false);
  //}

  function BuildErrors(errors: Array<string>): void
  {
    let errorList: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("errorList"));
    let df = document.createDocumentFragment();
    Utilities.Clear_Element(errorList);    
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

  export function BuildPayerStates(States: Array<any>, id: string): void
  {
    let stateSelect:HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    if (stateSelect === undefined) return;
    Utilities.Clear_Element(stateSelect);
    States.forEach(function (j)
    {
      stateSelect.appendChild(Utilities.Create_Option(j.abv, j.state));
    });
    stateSelect.selectedIndex = 0;
  }

  export function BuildAppTypes(appTypes: Array<AppType>):void
  {
    let appSelect: HTMLSelectElement = (<HTMLSelectElement>document.getElementById("applicationSearchType"));
    Utilities.Clear_Element(appSelect);
    appSelect.appendChild(Utilities.Create_Option("-1", "Select Application Type", true));
    appTypes.forEach(function (a)
    {
      appSelect.appendChild(Utilities.Create_Option(a.Value, a.Label));
    });
    appSelect.selectedIndex = 0;
  }

  export function BuildExpMonths(id: string):void
  {
    let expMonth: HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    if (expMonth === undefined) return;
    Utilities.Clear_Element(expMonth);
    for (let month of ExpMonths)
    {
      expMonth.appendChild(Utilities.Create_Option(month, month));
    }
    expMonth.selectedIndex = 0;
  }

  export function BuildExpYears(id: string): void
  {
    let expYear: HTMLSelectElement = (<HTMLSelectElement>document.getElementById(id));
    Utilities.Clear_Element(expYear);    
    var year = new Date().getFullYear();
    for (var i = 0; i < 10; i++)
    {
      let y = (year + i).toString();
      expYear.appendChild(Utilities.Create_Option(y, y));
      ExpYears.push(y); // save the year we're adding for later when we do some basic validation
    }
  }

  export function Search(buttonId: string, inputId: string, errorId: string): boolean
  {
    //let button = <HTMLButtonElement>document.getElementById(buttonId);
    Utilities.Toggle_Loading_Button(buttonId, true);
    let input = <HTMLInputElement>document.getElementById(inputId);
    let k: string = input.value.trim().toUpperCase();
    if (inputId.indexOf("application") > -1)
    {
      // we'll need to validate the application data
      // the user needs to select a valid application type 
      // and enter a valid application number.
      let appType = (<HTMLSelectElement>document.getElementById(inputId + "Type")).value;
      if (appType === "-1" || appType.length === 0)
      {
        Utilities.Error_Show(errorId, "You must select an Application Type in order to search by Application Number.");
        Utilities.Toggle_Loading_Button(buttonId, false);
        return false;
      }
      k = appType.toUpperCase() + "-" + input.value.trim().toUpperCase();
    }
    if (k.length > 0)
    {
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      Utilities.Get(path + "API/Payments/Query/?key=" + k).then(function (charges: Array<Charge>)
      {
        clayPay.CurrentTransaction.CurrentCharges = charges;
        if (charges.length > 0)
        {
          ProcessSearchResults(charges);
          Utilities.Show("searchResults");
        }
        else
        {
          Utilities.Error_Show(errorId, "No charges were found for search: " + k);
        }

        Utilities.Toggle_Loading_Button(buttonId, false);
        return true;
      },
        function (errorText)
        {
          Utilities.Error_Show(errorId, errorText);
          console.log('error getting charges');
          // do something with the error here
          // need to figure out how to detect if something wasn't found
          // versus an error.
          Utilities.Toggle_Loading_Button(buttonId, false);

          return false;
        });
    } else
    {
      Utilities.Error_Show(errorId, "Invalid search. Please check your entry and try again.")
      input.focus();
      Utilities.Toggle_Loading_Button(buttonId, false);
      return false;
    }
  }

  export function ProcessSearchResults(charges: Array<Charge>): void
  {
    let container: HTMLElement = (<HTMLElement>document.getElementById('Charges'));
    Utilities.Clear_Element(container);    
    container.appendChild(Charge.CreateChargesTable(charges, ChargeView.search_results));
    Utilities.Set_Text('ChargesKey', charges[0].AssocKey);
    Utilities.Set_Text('ChargesDetail', charges[0].Detail);
  }
  
  export function IsItemInCart(itemId: number): boolean
  {
    let item: Array<Charge> = clayPay.CurrentTransaction.Cart.filter((c: Charge) =>
    {
      return c.ItemId == itemId;
    });
    return item.length !== 0;
  }

  //export function AddAllItemsToCart(): void
  //{
  //  for (let charge of clayPay.CurrentTransaction.CurrentCharges)
  //  {
  //    if (!IsItemInCart(charge.ItemId))
  //    {
  //      clayPay.CurrentTransaction.Cart.push(charge);
  //    }
  //  }
  //  updateCart();
  //  // we're going to rerun the "Create Table" so that it'll 
  //  // update each row
  //  ProcessSearchResults(clayPay.CurrentTransaction.CurrentCharges);
  //  //AddCharges(clayPay.CurrentTransaction.CurrentCharges);
  //}

  export function createTableHeaderElement(value: string, width: string): HTMLTableHeaderCellElement
  {
    let th = document.createElement("th");
    th.width = width;
    th.appendChild(document.createTextNode(value));
    return th;
  }

  export function createTableElement(
    value: string,
    className?: string,
    colspan?: number): HTMLTableCellElement
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

  export function createTableElementButton(
    value: string,
    itemId: number,
    className: string,
    toggle: boolean,
    addOnClickFunction: (ev: Event, i: number) => void,
    removeOnClickFunction: (ev: Event, i: number, t: boolean) => void): HTMLTableCellElement
  {
    let IsInCart: boolean = IsItemInCart(itemId);
    let d = document.createElement("td");
    d.className = className;
    let add = document.createElement("button");
    add.style.display = IsInCart ? "none" : "inline-block";
    add.type = "button";
    add.id = "btnAdd" + itemId.toString();
    add.className = "button is-primary";
    add.onclick = (ev: Event) =>
    {
      addOnClickFunction(ev, itemId);
    }
    let remove = document.createElement("div");
    remove.id = "btnRemove" + itemId.toString();
    remove.style.display = IsInCart ? "inline-block" : "none";
    remove.appendChild(document.createTextNode('Added ('));
    let removeButton = document.createElement("a");    
    //removeButton
    removeButton.classList.add("is-warning");
    //removeButton.style.color = "darkgoldenrod";
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




  function updateCartNav():void
  {
    // This function is going to take the contents of the Cart array and 
    // update the CartNav element.
    // it's also going to make some changes to the cart Div, 
    // specifically it's going to hide and unhide the CartEmpty Div
    // based on the size of the array.
    let CartNav: HTMLElement = document.getElementById('nav-cart-total');
    // emptyCart / fullCart is used when displaying the Cart
    // if there are no charges, we show emptyCart.
    // if there are charges, we show fullCart.
    let emptyCart: HTMLElement = document.getElementById("emptyCart"); 
    let fullCart: HTMLElement = document.getElementById("fullCart");
    let payerData: HTMLElement = document.getElementById("payerData");
    let paymentData: HTMLElement = document.getElementById("paymentData");
    Utilities.Hide(emptyCart);
    Utilities.Hide(fullCart);
    Utilities.Hide(payerData);
    //Utilities.Hide(paymentData);
    //Utilities.Show()
    Utilities.Clear_Element(CartNav);
    if (clayPay.CurrentTransaction.Cart.length === 0)
    {
      CartNav.appendChild(document.createTextNode("(empty)"));
      Utilities.Show(emptyCart);
    } else
    {
      let cartLength = clayPay.CurrentTransaction.Cart.length;
      CartNav.appendChild(document.createTextNode(+ cartLength.toString() + (cartLength === 1 ? ' item' : ' items')));
      Utilities.Show(fullCart);
      Utilities.Show(payerData);
      //Utilities.Show(paymentData);
    }
  }

  export function updateCart(): void
  {
    let CartCharges: HTMLElement = document.getElementById('fullCart');
    
    Utilities.Clear_Element(CartCharges);
    //let df = document.createDocumentFragment();
    //for (let charge of clayPay.CurrentTransaction.Cart)
    //{
    //  df.appendChild(buildCartRow(charge));
    //}
    //df.appendChild(buildCartFooterRow());
    //df.appendChild(buildCartConvFeeFooterRow());
    //CartCharges.appendChild(df);
    CartCharges.appendChild(Charge.CreateChargesTable(clayPay.CurrentTransaction.Cart, ChargeView.cart));
    updateCartNav();
  }



  export function buildMenuElements():void
  {
    let menu = document.getElementById("menuTabs");
    for (let menuItem of Menus)
    {
      menu.appendChild(createMenuElement(menuItem));
    }
    createNavCart();
  }

  function createNavCart()
  {
    let cart = document.getElementById("nav-cart");
    let cartTotal = document.createElement("span");
    cartTotal.id = "nav-cart-total";
    cartTotal.style.fontSize = "larger";
    cartTotal.style.fontWeight = "bolder";
    cartTotal.style.paddingLeft = "1em";
    cartTotal.appendChild(document.createTextNode("(empty)"));
    cart.appendChild(cartTotal);
  }

  function createMenuElement(menuItem: { id: string, title: string, subTitle: string, icon: string, label: string, selected: boolean }): HTMLLIElement
  {
    let li = document.createElement("li");
    if (menuItem.selected) li.classList.add("is-active");


    let a = document.createElement("a");
    a.id = menuItem.id;
    a.href = "#";    
    a.onclick = function ()
    {
      let title = document.getElementById("menuTitle");
      let subTitle = document.getElementById("menuSubTitle");
      Utilities.Clear_Element(title);
      Utilities.Clear_Element(subTitle);
      title.appendChild(document.createTextNode(menuItem.title));
      subTitle.appendChild(document.createTextNode(menuItem.subTitle));
      Utilities.Show_Menu(menuItem.id);
    }
    if (menuItem.icon.length > 0)
    {
      let span = document.createElement("span");
      span.classList.add("icon");
      span.classList.add("is-medium");
      let i = document.createElement("i");
      let icons = menuItem.icon.split(" ");
      for (let icon of icons)
      {
        i.classList.add(icon);
      }
      span.appendChild(i);
      a.appendChild(span);
    }
    a.appendChild(document.createTextNode(menuItem.label))
    li.appendChild(a);
    return li;
  }

  export function ShowPaymentMethod(id: string): void
  {
    
  }

}