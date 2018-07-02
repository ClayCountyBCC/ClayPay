/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />

//let Card: any;
//let CurrentCard: any;

namespace clayPay
{
  "use strict";

  export let ConvenienceFee: string;
  export let TotalAmountDue: number = 0;
  export let CreditCardAmount: number = 0;
  export let CheckAmount: number = 0;
  export let CashAmount: number = 0;
  export let ChangeOwed: number = 0;

  export function start(): void
  {
    HandleUIEvents();
    UI.buildMenuElements();
    loadDefaultValues();

  }

  function HandleUIEvents(): void
  {
    (<HTMLInputElement>document.getElementById('permitSearch'))
      .onkeydown = function (this: HTMLElement, event: KeyboardEvent)
      {
        var e = event || window.event;
        if (event.keyCode == 13)
        {
          clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
        }
      };

    (<HTMLButtonElement>document.getElementById("permitSearchButton"))
      .onclick = () =>
      {
        clayPay.UI.Search('permitSearchButton', 'permitSearch', 'permitSearchError');
      };

    (<HTMLInputElement>document.getElementById('contractorSearch'))
      .onkeydown = function (this: HTMLElement, event: KeyboardEvent)
      {
        var e = event || window.event;
        if (event.keyCode == 13)
        {
          clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError'); return false;
        }
      };

    (<HTMLButtonElement>document.getElementById("contractorSearchButton"))
      .onclick = () =>
      {
        clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError'); return false;
      };

    (<HTMLInputElement>document.getElementById('applicationSearch'))
      .onkeydown = function (this: HTMLElement, event: KeyboardEvent)
      {
        var e = event || window.event;
        if (event.keyCode == 13)
        {
          clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError'); return false;
        }
      };

    (<HTMLButtonElement>document.getElementById("applicationSearchButton"))
      .onclick = () =>
      {
        clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError'); return false;
      };

  }

  function loadDefaultValues(): void
  { // this function will load the application values from a web service.
    loadApplicationTypes();
    UI.BuildPayerStates();
    loadCreditCardFee();
    loadCreditCardExpirationValues();
  }

  function loadCreditCardExpirationValues(): void
  {
    UI.BuildExpMonths("creditCardMonth");
    UI.BuildExpYears("creditCardYear");
  }

  function loadCreditCardFee(): void
  {
    //"./API/Fee/"
    Utilities.Get<string>("./API/Fee/")
      .then(function (fee: string)
      {
        ConvenienceFee = fee;
        console.log('conv fee is', fee);

      }, function ()
        {
          console.log('error getting convenience fee');
          // do something with the error here
        });
  }

  function loadApplicationTypes(): void
  {
    //transport.GetApplicationTypes().then(function (appTypes: Array<AppType>)
    Utilities.Get<Array<AppType>>("./API/Apptypes/")
      .then(function (appTypes: Array<AppType>)
      {
        UI.BuildAppTypes(appTypes);
      }, function ()
        {
          console.log('error getting application types');
          // do something with the error here
        });
  }

  //export function toggleNavDisplay(element: string): void
  //{


  //  UI.toggleNav("navTopMenu", element);

  //  let section = document.getElementsByTagName("section");
  //  for (var i = 0; i < section.length; i++)
  //  {
  //    if (section[i].style.display !== "none")
  //    {
  //      section[i].style.display = "none";
  //    }
  //  }
  //  document.getElementById(element).style.display = "block";
  //}

}