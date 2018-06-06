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
/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class PermitAllocation {
        constructor() {
        }
        static LoadBuilders(e, selectedBuilder = -1) {
            let parent = e.parentElement;
            parent.classList.add("is-loading");
            let id = e.id.replace("Add", "");
            let permitBuilderContainer = document.getElementById("permitBuilderContainer");
            let developerAmount = document.getElementById("permitDeveloperAmount");
            let developerAllocated = document.getElementById("permitDeveloperCurrentlyAllocated");
            if (e.selectedIndex === 0) {
                Utilities.Hide(permitBuilderContainer);
                developerAllocated.value = "";
                developerAmount.value = "";
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            Utilities.Show(permitBuilderContainer);
            let agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                let selectBuilder = document.getElementById("permitSelectBuilder");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0 && b.Builder_Allocation_Amount > 0; });
                if (builders.length > 0) {
                    developerAmount.value = builders[0].Agreement_Amount_Formatted;
                    developerAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder", selectedBuilder === -1));
                    let distinctBuilder = [];
                    for (let b of builders) {
                        if (distinctBuilder.indexOf(b.Builder_Id) === -1 && b.Builder_Name.trim() !== "") {
                            distinctBuilder.push(b.Builder_Id);
                            selectBuilder.add(Utilities.Create_Option(b.Builder_Id.toString(), b.Builder_Name, b.Builder_Id === selectedBuilder));
                        }
                    }
                }
                if (selectedBuilder !== -1) {
                    PermitAllocation.BuilderSelected(selectBuilder);
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        }
        static Reset() {
            // this function will unselect all dropdowns and clear every text box
            document.getElementById("formPermitAllocations").reset();
            document.getElementById("permitSelectAgreement").selectedIndex = 0;
            document.getElementById("permitSelectBuilder").selectedIndex = 0;
            Utilities.Hide(document.getElementById("permitAllocationError"));
            Utilities.Hide(document.getElementById("permitBuilderContainer"));
            Utilities.Hide(document.getElementById("permitBuilderSelected"));
            Utilities.Hide(document.getElementById("permitInfo"));
            Utilities.Hide(document.getElementById("permitErrorContainer"));
            Utilities.Hide(document.getElementById("permitSelectDeveloper"));
        }
        static BuilderSelected(e) {
            // once they get to this place, I need to do a final validation on the permit
            // to check to make sure that this permit is inside the agreement's boundary      
            let parent = e.parentElement;
            parent.classList.add("is-loading");
            let id = e.id.replace("Add", "");
            let builderSelectedContainer = document.getElementById("permitBuilderSelected");
            let builderAmount = document.getElementById("permitBuilderAmount");
            let builderAllocated = document.getElementById("permitBuilderCurrentlyAllocated");
            let builderAllocationRemaining = document.getElementById("permitBuilderAllocationRemaining");
            let permitCreditAmount = document.getElementById("permitCreditAmount");
            permitCreditAmount.value = "";
            if (e.selectedIndex === 0) {
                Utilities.Hide(builderSelectedContainer);
                parent.classList.remove("is-loading");
                builderAmount.value = "";
                builderAllocated.value = "";
                return; // no agreement selected.
            }
            let builderId = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll("", parseInt(builderId), "").then(function (builders) {
                builderAmount.value = builders[0].Builder_Allocation_Amount_Formatted;
                builderAllocated.value = builders[0].Builder_Amount_Currently_Allocated_Formatted;
                let difference = (builders[0].Builder_Allocation_Amount - builders[0].Builder_Amount_Currently_Allocated);
                let fee = document.getElementById("permitRoadImpactFee").value.replace("$", "").replace(",", "");
                let parsedFee = parseFloat(fee);
                builderAllocationRemaining.value = difference.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                permitCreditAmount.value = Math.min(parsedFee, difference).toFixed();
                parent.classList.remove("is-loading");
                Utilities.Show(builderSelectedContainer);
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        }
        static SearchPermit() {
            // this function will take the contents of the permit input and query it against the webservice.
            let permitErrorContainer = document.getElementById("permitErrorContainer");
            let permitInfo = document.getElementById("permitInfo");
            Utilities.Hide(permitErrorContainer);
            Utilities.Hide(permitInfo);
            let permitInput = document.getElementById("permitNumber");
            let permitNumber = permitInput.value;
            PermitAllocation.Reset();
            permitInput.value = permitNumber;
            if (permitNumber.length !== 8) {
                // show error
                let permitNumberLengthError = document.getElementById("permitNumberLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                let permitNumberNumericError = document.getElementById("permitNumberNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            ImpactFees.PermitImpactFee.Get(permitNumber).then(function (pif) {
                let ImpactFee = document.getElementById("permitRoadImpactFee");
                let ContractorNumber = document.getElementById("permitContractorNumber");
                let ContractorName = document.getElementById("permitContractorName");
                let CashierId = document.getElementById("permitCashierId");
                ImpactFee.value = pif.ImpactFee_Amount_Formatted;
                ContractorNumber.value = pif.Contractor_Id;
                ContractorName.value = pif.Contractor_Name;
                CashierId.value = pif.Cashier_Id;
                Utilities.Show(permitInfo);
                if (pif.Error_Text.length > 0) {
                    let permitErrorText = document.getElementById("permitErrorText");
                    permitErrorText.value = pif.Error_Text;
                    Utilities.Show(permitErrorContainer);
                    return; // if we find an error, we should stop here.
                }
                // if we made it here, let's query the combined allocations for this permit number
                // to see if it is already associated to any agreements/ builders.
                ImpactFees.CombinedAllocation.GetAll("", -1, permitNumber).then(function (comb) {
                    let selectDeveloperContainer = document.getElementById("permitSelectDeveloper");
                    Utilities.Show(selectDeveloperContainer);
                    let selectAgreement = document.getElementById("permitSelectAgreement");
                    selectAgreement.selectedIndex = 0;
                    if (comb.length == 1) {
                        // let's select the right agreement
                        for (var i = 0; i < selectAgreement.options.length; i++) {
                            if (selectAgreement.options.item(i).value === comb[0].Agreement_Number) {
                                selectAgreement.selectedIndex = i;
                                break;
                            }
                        }
                        // then load the builders for that agreement
                        // and select the right builder
                        PermitAllocation.LoadBuilders(selectAgreement, comb[0].Builder_Id);
                    }
                    else {
                        if (comb.length === 0) {
                            // we should figure out how to show an unselected agreement select here.
                        }
                        else {
                            // if multiple rows are returned, dunno
                            console.log('multiple rows returned for this permit number', comb);
                        }
                    }
                }, function (err) {
                });
            }, function (e) {
            });
        }
        static SavePermitAllocation() {
            // need permit number, builder Id, and allocation amount
            let permitNumber = document.getElementById("permitNumber");
            let selectedBuilder = document.getElementById("permitSelectBuilder");
            let allocationAmount = document.getElementById("permitCreditAmount");
            allocationAmount.classList.remove("is-danger");
            // we're going to add this extra line here just to handle if anyone 
            // tries to use more than 2 digits after the decimal point.
            allocationAmount.value = parseFloat(allocationAmount.value).toFixed(2);
            let Amount = parseFloat(allocationAmount.value);
            if (isNaN(Amount) || Amount < 0) {
                allocationAmount.classList.add("is-danger");
                allocationAmount.focus();
                let amountError = document.getElementById("permitCreditAmountError");
                Utilities.Error_Show(amountError);
                return;
            }
            let pa = new PermitAllocation();
            pa.Amount_Allocated = Amount;
            pa.Builder_Id = parseInt(selectedBuilder.options[selectedBuilder.selectedIndex].value);
            pa.Permit_Number = permitNumber.value.trim();
            pa.Save();
        }
        Save() {
            let permitAllocationErrorContainer = document.getElementById("permitAllocationError");
            let permitAllocationError = document.getElementById("permitAllocationErrorList");
            XHR.SaveObject("./API/ImpactFees/SavePermitAllocation", this).then(function (a) {
                console.log('response', a);
                if (a.length > 0) {
                    Utilities.Show(permitAllocationErrorContainer);
                    permitAllocationError.value = a.join("\n");
                }
                else {
                    PermitAllocation.SearchPermit();
                }
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(permitAllocationErrorContainer);
                permitAllocationError.value = e;
            });
        }
    }
    ImpactFees.PermitAllocation = PermitAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitAllocation.js.map
/// <reference path="../app/utilities.ts" />
/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/utilities.ts" />
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    function Start() {
        LoadAgreements();
    }
    ImpactFees.Start = Start;
    function Menu(id) {
        let sections = document.querySelectorAll("body > section");
        if (sections.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                let item = sections.item(i);
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
/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class DeveloperAgreement {
        constructor() {
            this.Developer_Name = "";
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        //public static GetAll(agreementNumber: string = ""): Promise<Array<DeveloperAgreement>>
        //{
        //  let agreement: string = "";
        //  if (agreementNumber.length > 0)
        //  {
        //    agreement = "?agreementNumber=" + agreementNumber;
        //  }
        //  return GetArray<DeveloperAgreement>("./API/ImpactFees/GetDeveloperAgreements", agreement);
        //}
        static Load(e) {
            let parent = e.parentElement;
            parent.classList.add("is-loading");
            let id = e.id.replace("Add", "");
            let container = document.getElementById(id + "Selected");
            Utilities.Hide(container);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            let agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (agreements) {
                if (agreements.length > 0) {
                    let da = agreements[0];
                    // Load this object's data into the html form.
                    let Amount = document.getElementById("developerAgreementAmount");
                    Amount.classList.remove("is-danger");
                    let AllocatedAmount = document.getElementById("developerCurrentlyAllocated");
                    let AuditLog = document.getElementById("developerAgreementAuditLog");
                    let existingAgreement = document.getElementById("existingDeveloperAgreement");
                    let existingAmountAllocated = document.getElementById("existingAgreementAmountAllocated");
                    Amount.value = da.Agreement_Amount.toString();
                    AllocatedAmount.value = da.Developer_Amount_Currently_Allocated_Formatted;
                    AuditLog.value = da.Developer_Audit_Log;
                    if (da.Developer_Audit_Log.length === 0) {
                        Utilities.Hide(existingAgreement);
                        Utilities.Hide(existingAmountAllocated);
                    }
                    else {
                        Utilities.Show(existingAgreement);
                        Utilities.Show(existingAmountAllocated);
                    }
                    Utilities.Show(container);
                    parent.classList.remove("is-loading");
                }
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        }
        static SaveAgreement() {
            let developerAgreementError = document.getElementById("developerAgreementErrorList");
            let developerAgreementErrorContainer = document.getElementById("developerAgreementError");
            Utilities.Hide(developerAgreementErrorContainer);
            let agreementSelect = document.getElementById("developerAgreementAdd");
            let agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            let AmountElement = document.getElementById("developerAgreementAmount");
            AmountElement.classList.remove("is-danger");
            let Amount = parseFloat(AmountElement.value);
            if (!isNaN(Amount) && Amount >= 0) { // cursory validation, main validation will be the backend.
                let d = new DeveloperAgreement();
                d.Agreement_Amount = Amount;
                d.Agreement_Number = agreementNumber;
                XHR.SaveObject("./API/ImpactFees/SaveDeveloperAgreement", d).then(function (a) {
                    console.log('response', a);
                    if (a.length > 0) {
                        Utilities.Show(developerAgreementErrorContainer);
                        developerAgreementError.value = a.join("\n");
                    }
                    else {
                        DeveloperAgreement.Load(agreementSelect);
                    }
                }).catch(function (e) {
                    // figure out what we want to do with the errors.
                    Utilities.Show(developerAgreementErrorContainer);
                    developerAgreementError.value = e;
                });
            }
            else {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                let errorElement = document.getElementById("developerAgreementAmountError");
                Utilities.Error_Show(errorElement);
            }
        }
    }
    ImpactFees.DeveloperAgreement = DeveloperAgreement;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=DeveloperAgreement.js.map
/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class CombinedAllocation {
        constructor() {
        }
        static GetAll(agreementNumber, builderId, permitNumber) {
            let qs = "";
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
            }
            return XHR.GetArray("./API/ImpactFees/GetAgreements", qs);
        }
    }
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map
/// <reference path="../app/xhr.ts" />
var ImpactFees;
/// <reference path="../app/xhr.ts" />
(function (ImpactFees) {
    class BuilderAllocation {
        constructor() {
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        static LoadBuilders(e) {
            let parent = e.parentElement;
            parent.classList.add("is-loading");
            let id = e.id.replace("Add", "");
            let container = document.getElementById(id + "Selected");
            let agreementSelectedDeveloperAmount = document.getElementById("builderDeveloperSelectedAmount");
            let agreementSelectedDeveloperCurrentlyAllocated = document.getElementById("builderDeveloperSelectedCurrentlyAllocated");
            let builderSelectedContainer = document.getElementById("builderSelected");
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
            Utilities.Hide(builderSelectedContainer);
            Utilities.Hide(container);
            Utilities.Hide(agreementSelectedDeveloperAmount);
            Utilities.Hide(agreementSelectedDeveloperCurrentlyAllocated);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            let agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                // let's load the dropdown
                let selectBuilder = document.getElementById("existingBuilders");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0; });
                if (builders.length > 0) {
                    Utilities.Show(container);
                    Utilities.Show(agreementSelectedDeveloperAmount);
                    Utilities.Show(agreementSelectedDeveloperCurrentlyAllocated);
                    let DeveloperAmount = document.getElementById("buildersDeveloperAgreementAmount");
                    let DeveloperAllocated = document.getElementById("buildersDeveloperCurrentlyAllocated");
                    DeveloperAmount.value = builders[0].Agreement_Amount_Formatted;
                    DeveloperAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder or Add New", true));
                    let distinctBuilder = [];
                    for (let b of builders) {
                        if (distinctBuilder.indexOf(b.Builder_Id) === -1 && b.Builder_Name.trim() !== "") {
                            distinctBuilder.push(b.Builder_Id);
                            selectBuilder.add(Utilities.Create_Option(b.Builder_Id.toString(), b.Builder_Name));
                        }
                    }
                }
                else {
                    // if there are no builders for this agreement already setup
                    // let's just show the add builder inputs.
                    BuilderAllocation.LoadBuilder("", "", "", "$0.00");
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        }
        static LoadSpecificBuilder(e) {
            if (e.selectedIndex === 0) {
                BuilderAllocation.LoadBuilder("", "", "", "$0.00");
                return;
            }
            let parent = e.parentElement;
            parent.classList.add("is-loading");
            let builderId = parseInt(e.options[e.selectedIndex].value);
            ImpactFees.CombinedAllocation.GetAll("", builderId, "").then(function (builders) {
                if (builders.length > 0) {
                    let builder = builders[0];
                    BuilderAllocation.LoadBuilder(builder.Builder_Name, builder.Builder_Allocation_Amount.toString(), builder.Builder_Audit_Log, builder.Builder_Amount_Currently_Allocated_Formatted);
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                console.log('Load Specific builder error happened', e);
            });
        }
        static LoadBuilder(BuilderName, BuilderAmount, AuditLog, AlreadyAllocated) {
            // hide Add New Builder button unless select index = 0
            let Name = document.getElementById("builderAllocationName");
            let Amount = document.getElementById("builderAllocationAmount");
            let Log = document.getElementById("builderAllocationAuditLog");
            let Allocated = document.getElementById("buildersAmountAllocatedToPermits");
            let container = document.getElementById("builderSelected");
            let existingContainer = document.getElementById("existingBuilderAllocation");
            Utilities.Hide(existingContainer);
            Utilities.Show(container);
            Name.value = BuilderName;
            Amount.value = BuilderAmount;
            Log.value = AuditLog;
            Allocated.value = AlreadyAllocated;
            if (AuditLog.length > 0) {
                Utilities.Show(existingContainer);
            }
            // load the values into the form and show it
        }
        static AddNewBuilder() {
            // clear out the form and show it
            let builderSelect = document.getElementById("existingBuilders");
            if (builderSelect.options.length > 0)
                builderSelect.selectedIndex = 0;
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
        }
        static SaveAllocation() {
            //builderAllocationErrorList
            let builderAllocationErrorContainer = document.getElementById("builderAllocationError");
            let builderAllocationError = document.getElementById("builderAllocationErrorList");
            Utilities.Hide(builderAllocationErrorContainer);
            let agreementSelect = document.getElementById("builderAllocationAgreementAdd");
            let agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            let builderSelect = document.getElementById("existingBuilders");
            let builderId = null;
            if (builderSelect.options.length > 0 && builderSelect.selectedIndex > 0) {
                builderId = builderSelect.options[builderSelect.selectedIndex].value;
            }
            let NameElement = document.getElementById("builderAllocationName");
            let AmountElement = document.getElementById("builderAllocationAmount");
            AmountElement.classList.remove("is-danger");
            NameElement.classList.remove("is-danger");
            let Amount = parseFloat(AmountElement.value);
            let BuilderName = NameElement.value.trim().toUpperCase();
            if (BuilderName.length < 3) {
                NameElement.focus();
                NameElement.classList.add("is-danger");
                let NameErrorElement = document.getElementById("builderAllocationNameError");
                Utilities.Error_Show(NameErrorElement);
                return;
            }
            if (isNaN(Amount) || Amount < 0) {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                let errorElement = document.getElementById("builderAllocationAmountError");
                Utilities.Error_Show(errorElement);
                return;
            }
            let b = new BuilderAllocation();
            b.Agreement_Number = agreementNumber;
            b.Builder_Name = BuilderName;
            b.Allocation_Amount = Amount;
            b.Id = builderId;
            XHR.SaveObject("./API/ImpactFees/SaveBuilderAllocation", b).then(function (a) {
                console.log('response', a);
                if (a.length > 0) {
                    Utilities.Show(builderAllocationErrorContainer);
                    builderAllocationError.value = a.join("\n");
                }
                else {
                    BuilderAllocation.LoadBuilders(agreementSelect);
                }
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(builderAllocationErrorContainer);
                builderAllocationError.value = e;
            });
        }
    }
    ImpactFees.BuilderAllocation = BuilderAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=BuilderAllocation.js.map