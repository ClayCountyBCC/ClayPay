var ImpactFees;
(function (ImpactFees) {
    var PermitAllocation = /** @class */ (function () {
        function PermitAllocation() {
        }
        PermitAllocation.LoadBuilders = function (e, selectedBuilder) {
            if (selectedBuilder === void 0) { selectedBuilder = -1; }
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var permitBuilderContainer = document.getElementById("permitBuilderContainer");
            var developerAmount = document.getElementById("permitDeveloperAmount");
            var developerAllocated = document.getElementById("permitDeveloperCurrentlyAllocated");
            if (e.selectedIndex === 0) {
                Utilities.Hide(permitBuilderContainer);
                developerAllocated.value = "";
                developerAmount.value = "";
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            Utilities.Show(permitBuilderContainer);
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                var selectBuilder = document.getElementById("permitSelectBuilder");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0 && b.Builder_Allocation_Amount > 0; });
                if (builders.length > 0) {
                    developerAmount.value = builders[0].Agreement_Amount_Formatted;
                    developerAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder", selectedBuilder === -1));
                    var distinctBuilder = [];
                    for (var _i = 0, builders_1 = builders; _i < builders_1.length; _i++) {
                        var b = builders_1[_i];
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
        };
        PermitAllocation.Reset = function () {
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
        };
        PermitAllocation.BuilderSelected = function (e) {
            // once they get to this place, I need to do a final validation on the permit
            // to check to make sure that this permit is inside the agreement's boundary      
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var builderSelectedContainer = document.getElementById("permitBuilderSelected");
            var builderAmount = document.getElementById("permitBuilderAmount");
            var builderAllocated = document.getElementById("permitBuilderCurrentlyAllocated");
            var builderAllocationRemaining = document.getElementById("permitBuilderAllocationRemaining");
            var permitCreditAmount = document.getElementById("permitCreditAmount");
            permitCreditAmount.value = "";
            if (e.selectedIndex === 0) {
                Utilities.Hide(builderSelectedContainer);
                parent.classList.remove("is-loading");
                builderAmount.value = "";
                builderAllocated.value = "";
                return; // no agreement selected.
            }
            var builderId = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll("", parseInt(builderId), "").then(function (builders) {
                builderAmount.value = builders[0].Builder_Allocation_Amount_Formatted;
                builderAllocated.value = builders[0].Builder_Amount_Currently_Allocated_Formatted;
                var difference = (builders[0].Builder_Allocation_Amount - builders[0].Builder_Amount_Currently_Allocated);
                var fee = document.getElementById("permitRoadImpactFee").value.replace("$", "").replace(",", "");
                var parsedFee = parseFloat(fee);
                builderAllocationRemaining.value = difference.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                permitCreditAmount.value = Math.min(parsedFee, difference).toFixed();
                parent.classList.remove("is-loading");
                Utilities.Show(builderSelectedContainer);
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                // some kind of error occurred.
            });
        };
        PermitAllocation.SearchPermit = function () {
            // this function will take the contents of the permit input and query it against the webservice.
            var permitErrorContainer = document.getElementById("permitErrorContainer");
            var permitErrorText = document.getElementById("permitErrorText");
            var permitInfo = document.getElementById("permitInfo");
            Utilities.Hide(permitErrorContainer);
            Utilities.Hide(permitInfo);
            var permitInput = document.getElementById("permitNumber");
            var permitNumber = permitInput.value.trim();
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            PermitAllocation.Reset();
            permitInput.value = permitNumber;
            var searchTypeInput = document.querySelector('input[name="searchType"][value="' + searchType + '"]');
            searchTypeInput.checked = true;
            if (permitNumber.length !== 8) {
                // show error
                var permitNumberLengthError = document.getElementById("permitNumberLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                var permitNumberNumericError = document.getElementById("permitNumberNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            ImpactFees.PermitImpactFee.Get(permitNumber, "", "IFCR").then(function (pif) {
                var ImpactFee = document.getElementById("permitRoadImpactFee");
                var ContractorNumber = document.getElementById("permitContractorNumber");
                var ContractorName = document.getElementById("permitContractorName");
                var CashierId = document.getElementById("permitCashierId");
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
                    var selectDeveloperContainer = document.getElementById("permitSelectDeveloper");
                    Utilities.Show(selectDeveloperContainer);
                    var selectAgreement = document.getElementById("permitSelectAgreement");
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
        };
        PermitAllocation.SearchPermitOther = function () {
            // this function will take the contents of the permit input and query it against the webservice.
            Utilities.Hide("permitOtherApplyWaiver"); // hide the button, we'll show it if we make it there.
            var permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            var permitErrorText = document.getElementById("permitOtherErrorText");
            Utilities.Hide(permitErrorContainer);
            var permitInput = document.getElementById("permitNumberOther");
            var permitNumber = permitInput.value.trim();
            permitInput.value = permitNumber;
            if (permitNumber.length !== 8) {
                // show error
                var permitNumberLengthError = document.getElementById("permitNumberOtherLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                var permitNumberNumericError = document.getElementById("permitNumberOtherNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            ImpactFees.PermitImpactFee.Get(permitNumber, "", searchType).then(function (pif) {
                var ImpactFee = document.getElementById("permitOtherImpactFee");
                ImpactFee.value = pif.ImpactFee_Amount_Formatted;
                var AmountToWaive = document.getElementById("AmountToWaive");
                AmountToWaive.value = pif.ImpactFee_Amount.toFixed(2);
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
        };
        PermitAllocation.SavePermitAllocation = function () {
            // need permit number, builder Id, and allocation amount
            var permitNumber = document.getElementById("permitNumber");
            var selectedBuilder = document.getElementById("permitSelectBuilder");
            var allocationAmount = document.getElementById("permitCreditAmount");
            allocationAmount.classList.remove("is-danger");
            // we're going to add this extra line here just to handle if anyone 
            // tries to use more than 2 digits after the decimal point.
            allocationAmount.value = parseFloat(allocationAmount.value).toFixed(2);
            var Amount = parseFloat(allocationAmount.value);
            if (isNaN(Amount) || Amount < 0) {
                allocationAmount.classList.add("is-danger");
                allocationAmount.focus();
                var amountError = document.getElementById("permitCreditAmountError");
                Utilities.Error_Show(amountError);
                return;
            }
            var pa = new PermitAllocation();
            pa.Amount_Allocated = Amount;
            pa.Builder_Id = parseInt(selectedBuilder.options[selectedBuilder.selectedIndex].value);
            pa.Permit_Number = permitNumber.value.trim();
            pa.Save();
        };
        PermitAllocation.SavePermitWaiver = function () {
            Utilities.Toggle_Loading_Button("SavePermitWaiver", true);
            var permitNumber = document.getElementById("permitNumberOther");
            var permitErrorContainer = document.getElementById("permitOtherErrorContainer");
            var permitErrorText = document.getElementById("permitOtherErrorText");
            var searchType = document.querySelector('input[name="searchType"]:checked').value;
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var pw = new ImpactFees.PermitWaiver();
            var amount = document.getElementById("AmountToWaive").value.trim();
            console.log('amount', amount);
            pw.Amount = parseFloat(amount);
            if (isNaN(pw.Amount)) {
                alert("There is a problem with the amount entered.  Please check the amount and try again.");
                return;
            }
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
                Utilities.Toggle_Loading_Button("SavePermitWaiver", false);
            }).catch(function (e) {
                // figure out what we want to do with the errors.
                Utilities.Show(permitErrorContainer);
                permitErrorText.value = e;
                Utilities.Toggle_Loading_Button("SavePermitWaiver", false);
            });
        };
        PermitAllocation.prototype.Save = function () {
            var permitAllocationErrorContainer = document.getElementById("permitAllocationError");
            var permitAllocationError = document.getElementById("permitAllocationErrorList");
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
        };
        return PermitAllocation;
    }());
    ImpactFees.PermitAllocation = PermitAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitAllocation.js.map