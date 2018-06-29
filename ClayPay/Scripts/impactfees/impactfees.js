/// <reference path="../app/utilities.ts" />
var ImpactFees;
/// <reference path="../app/utilities.ts" />
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    function Start() {
        LoadAgreements();
    }
    ImpactFees.Start = Start;
    function LoadAgreements() {
        ImpactFees.CombinedAllocation.GetAll("", -1, "").then(function (a) {
            ImpactFees.CombinedAllocations = a;
            PopulateAgreementDropdowns(a);
            PopulateExistingAllocations(BuildDeveloperTable());
        });
    }
    function PopulateAgreementDropdowns(agreements) {
        let added = [];
        let developer = document.getElementById("developerAgreementAdd");
        let builder = document.getElementById("builderAllocationAgreementAdd");
        let permit = document.getElementById("permitSelectAgreement");
        for (let a of agreements) {
            if (added.indexOf(a.Agreement_Number) === -1) {
                added.push(a.Agreement_Number);
                let label = a.Agreement_Number + ' - ' + a.Developer_Name;
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
        let container = document.getElementById("existingAllocationsContainer");
        Utilities.Clear_Element(container);
        Utilities.Show(container);
        container.appendChild(df);
    }
    function BuildBreadCrumbs(Agreement_Number = "", Builder_Name = "") {
        let bc = document.getElementById("breadcrumbs");
        Utilities.Clear_Element(bc);
        let baseLI = document.createElement("li");
        bc.appendChild(baseLI);
        let baseA = document.createElement("a");
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
            let agreementLI = document.createElement("li");
            let agreementA = document.createElement("a");
            agreementA.href = "#";
            agreementA.appendChild(document.createTextNode(Agreement_Number));
            agreementA.onclick = function () {
                console.log("testa");
                View(Agreement_Number, "");
            };
            agreementLI.appendChild(agreementA);
            bc.appendChild(agreementLI);
            if (Builder_Name.length > 0) {
                let builderLI = document.createElement("li");
                builderLI.classList.add("is-active");
                let builderA = document.createElement("a");
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
        let df = new DocumentFragment();
        let t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        let tHead = document.createElement("thead");
        tHead.appendChild(DeveloperHeaderRow());
        let tBody = document.createElement("tbody");
        let distinct = [];
        for (let ca of ImpactFees.CombinedAllocations) {
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
        let df = new DocumentFragment();
        let t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        let tHead = document.createElement("thead");
        tHead.appendChild(BuilderHeaderRow());
        let tBody = document.createElement("tbody");
        let distinct = [];
        for (let ca of ImpactFees.CombinedAllocations) {
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
        let df = new DocumentFragment();
        let t = document.createElement("table");
        t.classList.add("table");
        t.width = "100%";
        let tHead = document.createElement("thead");
        tHead.appendChild(PermitHeaderRow());
        let tBody = document.createElement("tbody");
        for (let ca of ImpactFees.CombinedAllocations) {
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
        let tr = document.createElement("tr");
        tr.classList.add("tr");
        let an = document.createElement("th");
        an.appendChild(document.createTextNode("Agreement Number"));
        an.width = "25%";
        let dn = document.createElement("th");
        dn.appendChild(document.createTextNode("Developer Name"));
        dn.width = "25%";
        let aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Agreement Amount"));
        aa.width = "25%";
        let ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "25%";
        tr.appendChild(an);
        tr.appendChild(dn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function BuilderHeaderRow() {
        let tr = document.createElement("tr");
        tr.classList.add("tr");
        let bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Builder Name"));
        bn.width = "33%";
        let aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "33%";
        let ca = document.createElement("th");
        ca.appendChild(document.createTextNode("Currently Allocated"));
        ca.width = "33%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        tr.appendChild(ca);
        return tr;
    }
    function PermitHeaderRow() {
        let tr = document.createElement("tr");
        tr.classList.add("tr");
        let bn = document.createElement("th");
        bn.appendChild(document.createTextNode("Permit Name"));
        bn.width = "50%";
        let aa = document.createElement("th");
        aa.appendChild(document.createTextNode("Amount Allocated"));
        aa.width = "50%";
        tr.appendChild(bn);
        tr.appendChild(aa);
        return tr;
    }
    function BuildRow(key1, key2, ...values) {
        let tr = document.createElement("tr");
        tr.classList.add("tr");
        tr.onclick = function () {
            View(key1, key2);
        };
        for (let v of values) {
            let td = document.createElement("td");
            td.classList.add("td");
            td.appendChild(document.createTextNode(v));
            tr.appendChild(td);
        }
        return tr;
    }
    //function BuildBigRow(id: string, colSpan: number): HTMLTableRowElement
    //{
    //  let tr = document.createElement("tr");
    //  tr.classList.add("tr");
    //  tr.id = id;
    //  Utilities.Hide(tr);
    //  let td = document.createElement("td");
    //  td.colSpan = colSpan;
    //  tr.appendChild(td);
    //  return tr;
    //}
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=impactfees.js.map