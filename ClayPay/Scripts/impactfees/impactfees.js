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
            PopulateExistingAllocations(BuildDeveloperTable());
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
    function PopulateExistingAllocations(df) {
        var container = document.getElementById("existingAllocationsContainer");
        Utilities.Clear_Element(container);
        Utilities.Show(container);
        container.appendChild(df);
    }
    function BuildBreadCrumbs(Agreement_Number, Builder_Name) {
        if (Agreement_Number === void 0) { Agreement_Number = ""; }
        if (Builder_Name === void 0) { Builder_Name = ""; }
        var bc = document.getElementById("breadcrumbs");
        Utilities.Clear_Element(bc);
        var baseLI = document.createElement("li");
        bc.appendChild(baseLI);
        var baseA = document.createElement("a");
        baseA.href = "#";
        baseA.appendChild(document.createTextNode("Agreements"));
        baseA.onclick = function () {
            console.log('testing');
            View("", "");
        };
        baseLI.appendChild(baseA);
        if (Agreement_Number.length === 0) {
            baseLI.classList.add("is-active");
        }
        else {
            var agreementLI = document.createElement("li");
            var agreementA = document.createElement("a");
            agreementA.href = "#";
            agreementA.appendChild(document.createTextNode(Agreement_Number));
            agreementA.onclick = function () {
                console.log("testa");
                View(Agreement_Number, "");
            };
            agreementLI.appendChild(agreementA);
            bc.appendChild(agreementLI);
            if (Builder_Name.length > 0) {
                var builderLI = document.createElement("li");
                builderLI.classList.add("is-active");
                var builderA = document.createElement("a");
                builderA.appendChild(document.createTextNode(Builder_Name));
                builderA.onclick = function () {
                    console.log("test");
                    View(Agreement_Number, Builder_Name);
                };
                builderLI.appendChild(builderA);
                bc.appendChild(builderLI);
            }
            else {
                agreementLI.classList.add("is-active");
            }
        }
    }
    function BuildDeveloperTable() {
        BuildBreadCrumbs();
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(DeveloperHeaderRow());
        var tBody = document.createElement("tbody");
        var distinct = [];
        for (var _i = 0, CombinedAllocations_1 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_1.length; _i++) {
            var ca = CombinedAllocations_1[_i];
            if (distinct.indexOf(ca.Agreement_Number) === -1) {
                distinct.push(ca.Agreement_Number);
                tBody.appendChild(BuildRow(ca.Agreement_Number, "", ca.Agreement_Number, ca.Developer_Name, ca.Agreement_Amount_Formatted, ca.Developer_Amount_Currently_Allocated_Formatted));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function View(Agreement_Number, Builder_Name) {
        if (Agreement_Number.length > 0) {
            if (Builder_Name.length > 0) {
                PopulateExistingAllocations(BuildPermitTable(Agreement_Number, Builder_Name));
            }
            else {
                PopulateExistingAllocations(BuildBuilderTable(Agreement_Number));
            }
        }
        else {
            PopulateExistingAllocations(BuildDeveloperTable());
        }
    }
    ImpactFees.View = View;
    function BuildBuilderTable(Agreement_Number) {
        BuildBreadCrumbs(Agreement_Number);
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(BuilderHeaderRow());
        var tBody = document.createElement("tbody");
        var distinct = [];
        for (var _i = 0, CombinedAllocations_2 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_2.length; _i++) {
            var ca = CombinedAllocations_2[_i];
            if (ca.Agreement_Number === Agreement_Number && distinct.indexOf(ca.Builder_Name) === -1) {
                distinct.push(ca.Builder_Name);
                tBody.appendChild(BuildRow(ca.Agreement_Number, ca.Builder_Name, ca.Builder_Name, ca.Builder_Allocation_Amount_Formatted, ca.Builder_Amount_Currently_Allocated_Formatted));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function BuildPermitTable(Agreement_Number, Builder_Name) {
        BuildBreadCrumbs(Agreement_Number, Builder_Name);
        var df = new DocumentFragment();
        var t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        var tHead = document.createElement("thead");
        tHead.appendChild(PermitHeaderRow());
        var tBody = document.createElement("tbody");
        for (var _i = 0, CombinedAllocations_3 = ImpactFees.CombinedAllocations; _i < CombinedAllocations_3.length; _i++) {
            var ca = CombinedAllocations_3[_i];
            if (ca.Agreement_Number === Agreement_Number && ca.Builder_Name === Builder_Name) {
                tBody.appendChild(BuildRow(ca.Agreement_Number, "", ca.Permit_Number, ca.Permit_Amount_Allocated.toLocaleString('en-US', { style: 'currency', currency: 'USD' })));
            }
        }
        t.appendChild(tHead);
        t.appendChild(tBody);
        df.appendChild(t);
        return df;
    }
    function DeveloperHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var an = document.createElement("th");
        an.appendChild(document.createTextNode("Agreement Number"));
        an.width = "25%";
        var dn = document.createElement("th");
        dn.appendChild(document.createTextNode("Developer Name"));
        dn.width = "25%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Agreement Amount"));
        aa.width = "25%";
        var ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "25%";
        tr.appendChild(an);
        tr.appendChild(dn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function BuilderHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Builder Name"));
        bn.width = "33%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "33%";
        var ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "33%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function PermitHeaderRow() {
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        var bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Permit Name"));
        bn.width = "50%";
        var aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "50%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        return tr;
    }
    function BuildRow(key1, key2) {
        var values = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            values[_i - 2] = arguments[_i];
        }
        var tr = document.createElement("tr");
        tr.classList.add("tr");
        tr.onclick = function () {
            View(key1, key2);
        };
        for (var _a = 0, values_1 = values; _a < values_1.length; _a++) {
            var v = values_1[_a];
            var td = document.createElement("td");
            td.classList.add("td");
            td.appendChild(document.createTextNode(v));
            tr.appendChild(td);
        }
        return tr;
    }
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=impactfees.js.map