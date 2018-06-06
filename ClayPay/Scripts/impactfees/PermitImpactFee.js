/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class PermitImpactFee {
        constructor() {
        }
        static Get(Permit_Number, Agreement_Number = "") {
            let qs = "?permit_number=" + Permit_Number.trim();
            if (Agreement_Number.length > 0) {
                qs += "&agreement_number=" + Agreement_Number;
            }
            return XHR.GetObject("./API/ImpactFees/GetPermit", qs);
        }
    }
    ImpactFees.PermitImpactFee = PermitImpactFee;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitImpactFee.js.map