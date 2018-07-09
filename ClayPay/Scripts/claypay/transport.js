/// <reference path="../app/xhr.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
var clayPay;
/// <reference path="../app/xhr.ts" />
/// <reference path="apptypes.ts" />
/// <reference path="charge.ts" />
(function (clayPay) {
    var transport;
    (function (transport) {
        "use strict";
        //export function GetApplicationTypes(): Promise<Array<AppType>>
        //{
        //  var x = XHR.Get("./API/Apptypes/");
        //  return new Promise<Array<AppType>>(function (resolve, reject)
        //  {
        //    x.then(function (response)
        //    {
        //      let ar: Array<AppType> = JSON.parse(response.Text);
        //      resolve(ar);
        //    }).catch(function ()
        //    {
        //      console.log("error in Get Application Types");
        //      reject(null);
        //    });
        //  });
        //}
        //export function GetConvenienceFee(): Promise<string>
        //{
        //  var x = XHR.Get("./API/Fee/");
        //  return new Promise<string>(function (resolve, reject)
        //  {
        //    x.then(function (response)
        //    {
        //      let ar: string = JSON.parse(response.Text);
        //      resolve(ar);
        //    }).catch(function ()
        //    {
        //      console.log("error in Get Convenience Fee");
        //      reject(null);
        //    });
        //  });
        //}
        //export function GetCharges(key: string): Promise<Array<Charge>>
        //{
        //  var x = XHR.Get("./API/Query/" + key);
        //  return new Promise<Array<Charge>>(function (resolve, reject)
        //  {
        //    x.then(function (response)
        //    {
        //      let ar: Array<Charge> = JSON.parse(response.Text);
        //      resolve(ar);
        //    }).catch(function ()
        //    {
        //      console.log("error in Get Charges");
        //      reject(null);
        //    });
        //  });
        //}
    })(transport = clayPay.transport || (clayPay.transport = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=transport.js.map