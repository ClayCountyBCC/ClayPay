/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="CCPayment.ts" />
/// <reference path="newtransaction.ts" />
/// <reference path="payment.ts" />
/// <reference path="clientresponse.ts" />

//let Card: any;
//let CurrentCard: any;

namespace clayPay
{
  "use strict";

  export let ConvenienceFee: string;
  export let CurrentTransaction: NewTransaction = new NewTransaction();

  export function start(): void
  {
    
    CurrentTransaction.UpdateIsCashier();
    HandleUIEvents();
    UI.buildMenuElements();
    loadDefaultValues();
    // let's test the receipt view
    // uncomment this to test the receipt view.
    //let cr = new ClientResponse();
    //cr.AmountPaid = 165;
    //cr.CashierId = "18-55544";
    //cr.ChangeDue = 0;
    //cr.Errors = [];
    //cr.TimeStamp = "7/13/2018 7:34 AM";
    //cr.TransactionId = "555ff";
    //ClientResponse.HandleResponse(cr, true);
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
          clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
        }
      };

    (<HTMLButtonElement>document.getElementById("contractorSearchButton"))
      .onclick = () =>
      {
        clayPay.UI.Search('contractorSearchButton', 'contractorSearch', 'contractorSearchError');
      };

    (<HTMLInputElement>document.getElementById('applicationSearch'))
      .onkeydown = function (this: HTMLElement, event: KeyboardEvent)
      {
        var e = event || window.event;
        if (event.keyCode == 13)
        {
          clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError'); 
        }
      };

    (<HTMLButtonElement>document.getElementById("applicationSearchButton"))
      .onclick = () =>
      {
        clayPay.UI.Search('applicationSearchButton', 'applicationSearch', 'applicationSearchError'); 
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
    let path = "/";
    let i = window.location.pathname.toLowerCase().indexOf("/claypay");
    if (i == 0)
    {
      path = "/claypay/";
    }
    Utilities.Get<string>(path + "API/Payments/Fee/")
      .then(function (fee: string)
      {
        ConvenienceFee = fee;
        console.log('conv fee is', fee);

      }, function (e)
        {
          console.log('error getting convenience fee', e);
          // do something with the error here
        });
  }

  function loadApplicationTypes(): void
  {
    let path = "/";
    let i = window.location.pathname.toLowerCase().indexOf("/claypay");
    if (i == 0)
    {
      path = "/claypay/";
    }
    Utilities.Get<Array<AppType>>(path + "API/Payments/Apptypes/")
      .then(function (appTypes: Array<AppType>)
      {
        UI.BuildAppTypes(appTypes);
      }, function (e)
        {
          console.log('error getting application types', e);
          // do something with the error here
        });
  }


}