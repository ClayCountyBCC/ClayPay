var ImpactFees;
(function (ImpactFees) {
    var CombinedAllocation = /** @class */ (function () {
        function CombinedAllocation() {
        }
        CombinedAllocation.GetAll = function (agreementNumber, builderId, permitNumber) {
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var qs = "";
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
            } //"../API/Payments/Fee/"
            return Utilities.Get(path + "API/ImpactFees/GetAgreements" + qs);
            //return fetch("./API/ImpactFees/GetAgreements" + qs) : Promise<Array<CombinedAllocation>>;
            //return XHR.GetArray<CombinedAllocation>("./API/ImpactFees/GetAgreements", qs);
        };
        return CombinedAllocation;
    }());
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map