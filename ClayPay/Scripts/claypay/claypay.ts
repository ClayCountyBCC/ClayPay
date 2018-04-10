/// <reference path="transport.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
/// <reference path="ui.ts" />
/// <reference path="ccdata.ts" />

//let Card: any;
//let CurrentCard: any;

namespace clayPay
{
  "use strict";

  export let ConvenienceFee: string;

  export function start(): void
  {
    loadDefaultValues();

  }
  
  function loadDefaultValues(): void
  { // this function will load the application values from a web service.
    loadApplicationTypes();
    loadCreditCardFee();
    loadCreditCardExpirationValues();
    UI.BuildCardTypes("ccTypes");
  }

  function loadCreditCardExpirationValues(): void
  {
    UI.BuildExpMonths("ccExpMonth");
    UI.BuildExpYears("ccExpYear");
  }

  function loadCreditCardFee(): void
  {
    transport.GetConvenienceFee().then(function (fee: string)
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
    transport.GetApplicationTypes().then(function (appTypes: Array<AppType>)
    {
      UI.BuildAppTypes(appTypes);
    }, function ()
      {
        console.log('error getting application types');
        // do something with the error here
      });
  }

  export function toggleNavDisplay(element: string): void
  {
    UI.toggleNav("navTopMenu", element);

    let section = document.getElementsByTagName("section");
    for (var i = 0; i < section.length; i++)
    {
      if (section[i].style.display !== "none")
      {
        section[i].style.display = "none";
      }
    }
    document.getElementById(element).style.display = "block";
  }

}