var ImpactFees;
(function (ImpactFees) {
    class PermitImpactFee {
        constructor() {
        }
        static Get(Permit_Number, Agreement_Number = "", Search_Type) {
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            let qs = "?permit_number=" + Permit_Number.trim();
            qs += "&search_type=" + Search_Type;
            if (Agreement_Number.length > 0) {
                qs += "&agreement_number=" + Agreement_Number;
            }
            return Utilities.Get(path + "API/ImpactFees/GetPermit" + qs);
        }
    }
    ImpactFees.PermitImpactFee = PermitImpactFee;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitImpactFee.js.map