var ImpactFees;
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    function Start() {
        LoadAgreements();
    }
    ImpactFees.Start = Start;
    function Menu(id) {
        var sections = document.querySelectorAll("body > section");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (sections.item(i).id === id) {
                    item.classList.remove("hide");
                    item.classList.add("show");
                }
                else {
                    item.classList.remove("show");
                    item.classList.add("hide");
                }
            }
        }
    }
    ImpactFees.Menu = Menu;
    function LoadAgreements() {
        ImpactFees.CombinedAllocation.GetAll("", -1, "").then(function (a) {
            ImpactFees.CombinedAllocations = a;
            PopulateAgreementDropdowns(a);
        });
    }
    function PopulateAgreementDropdowns(agreements) {
        var added = [];
        var developer = document.getElementById("developerAgreementAdd");
        var builder = document.getElementById("builderAllocationAgreementAdd");
        var permit = document.getElementById("permitSelectAgreement");
        for (var _i = 0, agreements_1 = agreements; _i < agreements_1.length; _i++) {
            var a = agreements_1[_i];
            if (added.indexOf(a.Agreement_Number) === -1) {
                added.push(a.Agreement_Number);
                var label = a.Agreement_Number + ' - ' + a.Developer_Name;
                developer.add(Utilities.Create_Option(a.Agreement_Number, label));
                if (a.Agreement_Amount > 0) {
                    builder.add(Utilities.Create_Option(a.Agreement_Number, label));
                    if (a.Builder_Allocation_Amount > 0) {
                        permit.add(Utilities.Create_Option(a.Agreement_Number, label));
                    }
                }
            }
        }
    }
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=impactfees.js.map