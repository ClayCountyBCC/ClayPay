var ImpactFees;
(function (ImpactFees) {
    var PermitImpactFee = (function () {
        function PermitImpactFee() {
        }
        PermitImpactFee.Get = function (Permit_Number, Agreement_Number) {
            if (Agreement_Number === void 0) { Agreement_Number = ""; }
            var qs = "?permit_number=" + Permit_Number.trim();
            if (Agreement_Number.length > 0) {
                qs += "&agreement_number=" + Agreement_Number;
            }
            return XHR.GetObject("./API/ImpactFees/GetPermit", qs);
        };
        return PermitImpactFee;
    }());
    ImpactFees.PermitImpactFee = PermitImpactFee;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitImpactFee.js.map