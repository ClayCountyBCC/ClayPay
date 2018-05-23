var ImpactFees;
(function (ImpactFees) {
    var PermitAllocation = (function () {
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
                return;
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
            });
        };
        PermitAllocation.Reset = function () {
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
                return;
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
            });
        };
        PermitAllocation.SearchPermit = function () {
            var permitErrorContainer = document.getElementById("permitErrorContainer");
            var permitInfo = document.getElementById("permitInfo");
            Utilities.Hide(permitErrorContainer);
            Utilities.Hide(permitInfo);
            var permitInput = document.getElementById("permitNumber");
            var permitNumber = permitInput.value;
            PermitAllocation.Reset();
            permitInput.value = permitNumber;
            if (permitNumber.length !== 8) {
                var permitNumberLengthError = document.getElementById("permitNumberLengthError");
                Utilities.Error_Show(permitNumberLengthError);
                return;
            }
            if (isNaN(parseInt(permitNumber))) {
                var permitNumberNumericError = document.getElementById("permitNumberNumericError");
                Utilities.Error_Show(permitNumberNumericError);
                return;
            }
            ImpactFees.PermitImpactFee.Get(permitNumber).then(function (pif) {
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
                    var permitErrorText = document.getElementById("permitErrorText");
                    permitErrorText.value = pif.Error_Text;
                    Utilities.Show(permitErrorContainer);
                    return;
                }
                ImpactFees.CombinedAllocation.GetAll("", -1, permitNumber).then(function (comb) {
                    var selectDeveloperContainer = document.getElementById("permitSelectDeveloper");
                    Utilities.Show(selectDeveloperContainer);
                    var selectAgreement = document.getElementById("permitSelectAgreement");
                    selectAgreement.selectedIndex = 0;
                    if (comb.length == 1) {
                        for (var i = 0; i < selectAgreement.options.length; i++) {
                            if (selectAgreement.options.item(i).value === comb[0].Agreement_Number) {
                                selectAgreement.selectedIndex = i;
                                break;
                            }
                        }
                        PermitAllocation.LoadBuilders(selectAgreement, comb[0].Builder_Id);
                    }
                    else {
                        if (comb.length === 0) {
                        }
                        else {
                            console.log('multiple rows returned for this permit number', comb);
                        }
                    }
                }, function (err) {
                });
            }, function (e) {
            });
        };
        PermitAllocation.SavePermitAllocation = function () {
            var permitNumber = document.getElementById("permitNumber");
            var selectedBuilder = document.getElementById("permitSelectBuilder");
            var allocationAmount = document.getElementById("permitCreditAmount");
            allocationAmount.classList.remove("is-danger");
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
        PermitAllocation.prototype.Save = function () {
            var permitAllocationErrorContainer = document.getElementById("permitAllocationError");
            var permitAllocationError = document.getElementById("permitAllocationErrorList");
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
                Utilities.Show(permitAllocationErrorContainer);
                permitAllocationError.value = e;
            });
        };
        return PermitAllocation;
    }());
    ImpactFees.PermitAllocation = PermitAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=PermitAllocation.js.map