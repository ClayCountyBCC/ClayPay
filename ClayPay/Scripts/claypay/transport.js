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
        function GetApplicationTypes() {
            var x = XHR.Get("./API/Apptypes/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Application Types");
                    reject(null);
                });
            });
        }
        transport.GetApplicationTypes = GetApplicationTypes;
        function GetConvenienceFee() {
            var x = XHR.Get("./API/Fee/");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Convenience Fee");
                    reject(null);
                });
            });
        }
        transport.GetConvenienceFee = GetConvenienceFee;
        function GetCharges(key) {
            var x = XHR.Get("./API/Query/" + key);
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    let ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Charges");
                    reject(null);
                });
            });
        }
        transport.GetCharges = GetCharges;
    })(transport = clayPay.transport || (clayPay.transport = {}));
})(clayPay || (clayPay = {}));
//# sourceMappingURL=transport.js.map