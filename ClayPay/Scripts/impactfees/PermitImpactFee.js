var ImpactFees;
(function (ImpactFees) {
    var PermitImpactFee = /** @class */ (function () {
        function PermitImpactFee() {
        }
        PermitImpactFee.Get = function (Permit_Number, Agreement_Number, Search_Type) {
            if (Agreement_Number === void 0) { Agreement_Number = ""; }
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var qs = "?permit_number=" + Permit_Number.trim();
            qs += "&search_type=" + Search_Type;
            if (Agreement_Number.length > 0) {
                qs += "&agreement_number=" + Agreement_Number;
            }
            return Utilities.Get(path + "API/ImpactFees/GetPermit" + qs);
        };
        return PermitImpactFee;
    }());
    ImpactFees.PermitImpactFee = PermitImpactFee;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitImpactFee.js.map