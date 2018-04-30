var ImpactFees;
(function (ImpactFees) {
    var CombinedAllocation = (function () {
        function CombinedAllocation() {
        }
        CombinedAllocation.GetAll = function (agreementNumber, builderId, permitNumber) {
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
                qs = "?" + qs.substr(1);
            }
            return XHR.GetArray("./API/ImpactFees/GetAgreements", qs);
        };
        return CombinedAllocation;
    }());
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map