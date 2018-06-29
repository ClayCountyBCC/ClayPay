/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class CombinedAllocation {
        constructor() {
        }
        static GetAll(agreementNumber, builderId, permitNumber) {
            let qs = "";
            if (agreementNumber.length > 0) {
                qs = "&agreementNumber=" + agreementNumber;
            }
            if (builderId != -1) {
                qs = "&builderId=" + builderId.toString();
            }
            if (permitNumber.length > 0) {
                qs = "&permitNumber=" + permitNumber;
            }
            if (qs.length > 0) {
                qs = "?" + qs.substr(1); // no matter which arguments we used, we'll always remove the leading & and add a ?
            }
            return Utilities.Get("./API/ImpactFees/GetAgreements" + qs);
            //return fetch("./API/ImpactFees/GetAgreements" + qs) : Promise<Array<CombinedAllocation>>;
            //return XHR.GetArray<CombinedAllocation>("./API/ImpactFees/GetAgreements", qs);
        }
    }
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map