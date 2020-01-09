/// <reference path="../app/utilities.ts" />
var ImpactFees;
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    var Menus = [
        {
            id: "nav-existingAllocations",
            title: "Existing Agreements and Allocations",
            subTitle: "View the existing allocations by Developer, Builder, or Permit.",
            icon: "fas fa-home",
            label: "Current Allocations",
            selected: true
        },
        {
            id: "nav-developerAgreement",
            title: "Developer Agreements",
            subTitle: "Use this menu to add or make changes to existing developer agreements.",
            icon: "fas fa-user",
            label: "Developer",
            selected: false
        },
        {
            id: "nav-builderAllocations",
            title: "Builder Allocations",
            subTitle: "Use this menu to add or make changes to existing builder allocations.",
            icon: "fas fa-user",
            label: "Builder",
            selected: false
        },
        {
            id: "nav-permitAllocations",
            title: "Permit Waivers, Exemptions, and Allocations",
            subTitle: "Use this menu to add or make changes to existing permit allocations, or to apply waivers or exemptions.",
            icon: "fas fa-clipboard",
            label: "Permit",
            selected: false
        }
    ];
    function Start() {
        buildMenuElements();
        LoadAgreements();
        HandleUIEvents();
    }
    ImpactFees.Start = Start;
    function PermitActionChange() {
        Utilities.Hide("permitOtherApplyWaiver");
        Utilities.Set_Value("permitNumberOther", "");
        Utilities.Set_Value("permitNumber", "");
        var actionType = document.querySelector('input[name="searchType"]:checked').value;
        if (actionType === null || actionType === undefined)
            return;
        Utilities.Hide("permitCredits");
        Utilities.Hide("permitOther");
        if (actionType === "IFCR") {
            Utilities.Show("permitCredits");
            return;
        }
        Utilities.Show("permitOther");
    }
    ImpactFees.PermitActionChange = PermitActionChange;
    function LoadAgreements() {
        ImpactFees.CombinedAllocation.GetAll("", -1, "").then(function (a) {
            ImpactFees.CombinedAllocations = a;
            PopulateAgreementDropdowns(a);
            PopulateExistingAllocations(BuildDeveloperTable());
        });
    }
    function PopulateAgreementDropdowns(agreements) {
        console.log('agreements to Populate', agreements);
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
                if (a.Agreement_Amount > 0) { // we don't need to make them selectable if there is no money allocated to this developer.
                    builder.add(Utilities.Create_Option(a.Agreement_Number, label));
                    if (a.Builder_Allocation_Amount > 0) // same for the permit and the builder.
                     {
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
        tr.style.cursor = "pointer";
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
    function buildMenuElements() {
        var menu = document.getElementById("menuTabs");
        for (var _i = 0, Menus_1 = Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    ImpactFees.buildMenuElements = buildMenuElements;
    function HandleUIEvents() {
        document.getElementById('permitNumberOther')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                ImpactFees.PermitAllocation.SearchPermitOther();
            }
        };
        document.getElementById('permitNumber')
            .onkeydown = function (event) {
            var e = event || window.event;
            if (event.keyCode == 13) {
                ImpactFees.PermitAllocation.SearchPermit();
            }
        };
    }
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=impactfees.js.map