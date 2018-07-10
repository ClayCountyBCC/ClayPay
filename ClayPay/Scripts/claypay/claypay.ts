/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="CCPayment.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />

//let Card: any;
//let CurrentCard: any;

namespace clayPay
{
  "use strict";

  export let ConvenienceFee: string;
  export let CurrentTransaction: NewTransaction = new NewTransaction();

  export function start(isCashier: boolean): void
  {
    console.log('Is Public?', isCashier);
    CurrentTransaction.IsCashier = isCashier;
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
    clayPay.UI.BuildPayerStates(clayPay.UI.AllStates, "payerState");
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
    Utilities.Get<string>("../API/Payments/Fee/")
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
    Utilities.Get<Array<AppType>>("../API/Payments/Apptypes/")
      .then(function (appTypes: Array<AppType>)
      {
        UI.BuildAppTypes(appTypes);
      }, function ()
        {
          console.log('error getting application types');
          // do something with the error here
        });
  }


}