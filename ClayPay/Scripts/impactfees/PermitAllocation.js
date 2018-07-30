var ImpactFees;
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
            let permitErrorText = document.getElementById("permitErrorText");
            let permitInfo = document.getElementById("permitInfo");
            Utilities.Hide(permitErrorContainer);
            Utilities.Hide(permitInfo);
            let permitInput = document.getElementById("permitNumber");
            let permitNumber = permitInput.value.trim();
            let searchType = document.querySelector('input[name="searchType"]:checked').value;
            PermitAllocation.Reset();
            permitInput.value = permitNumber;
            let searchTypeInput = document.querySelector('input[name="searchType"][value="' + searchType + '"]');
            searchTypeInput.checked = true;
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
            ImpactFees.PermitImpactFee.Get(permitNumber, "", "IFCR").then(function (pif) {
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
                    console.log('error', err);
                    permitErrorText.value = err;
                    Utilities.Show(permitErrorContainer);
                });
            }, function (e) {
                console.log('error', e);
                permitErrorText.value = e;
                Utilities.Show(permitErrorContainer);
            });
        }
        static SearchPermitOther() {
            // this function will take the contents of the permit input and query it against the webservice.
            Utilities.Hide("permitOtherApplyWaiver"); // hide the button, we'll show it if we make it there.
            let permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            let permitErrorText = document.getElementById("permitOtherErrorText");
            Utilities.Hide(permitErrorContainer);
            let permitInput = document.getElementById("permitNumberOther");
            let permitNumber = permitInput.value.trim();
            permitInput.value = permitNumber;
            if (permitNumber.length !== 8) {
                // show error
                let permitNumberLengthError = document.getElementById("permitNumberOtherLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                let permitNumberNumericError = document.getElementById("permitNumberOtherNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            let searchType = document.querySelector('input[name="searchType"]:checked').value;
            ImpactFees.PermitImpactFee.Get(permitNumber, "", searchType).then(function (pif) {
                let ImpactFee = document.getElementById("permitOtherImpactFee");
                ImpactFee.value = pif.ImpactFee_Amount_Formatted;
                if (pif.Error_Text.length > 0) {
                    permitErrorText.value = pif.Error_Text;
                    Utilities.Show(permitErrorContainer);
                    return; // if we find an error, we should stop here.
                }
                Utilities.Show("permitOtherApplyWaiver");
            }, function (e) {
                permitErrorText.value = e;
                Utilities.Show(permitErrorContainer);
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
        static SavePermitWaiver() {
            let permitNumber = document.getElementById("permitNumberOther");
            let permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            let permitErrorText = document.getElementById("permitOtherErrorText");
            let searchType = document.querySelector('input[name="searchType"]:checked').value;
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            let pw = new ImpactFees.PermitWaiver();
            let amount = document.getElementById("permitOtherImpactFee").value.replace("$", "").replace(",", "");
            console.log('amount', amount);
            pw.Amount = parseFloat(amount);
            pw.Permit_Number = permitNumber.value.trim();
            pw.Waiver_Type = searchType;
            Utilities.Post(path + "API/ImpactFees/SavePermitWaiver", pw)
                .then(function (a) {
                console.log('response', a);
                if (a.length > 0 && a !== "success") {
                    Utilities.Show(permitErrorContainer);
                    permitErrorText.value = a;
                }
                else {
                    // let's indicate success in some way.
                    // probably show a message of some sort
                    // and then reset();
                    PermitAllocation.Reset();
                    Utilities.Hide("permitCredits");
                    Utilities.Hide("permitOther");
                    alert("Successfully applied Waiver/Exemption to Permit: " + pw.Permit_Number);
                }
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(permitErrorContainer);
                permitErrorText.value = e;
            });
        }
        Save() {
            let permitAllocationErrorContainer = document.getElementById("permitAllocationError");
            let permitAllocationError = document.getElementById("permitAllocationErrorList");
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/ImpactFees/SavePermitAllocation", this)
                .then(function (a) {
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