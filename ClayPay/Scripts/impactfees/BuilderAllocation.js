var ImpactFees;
(function (ImpactFees) {
    var BuilderAllocation = /** @class */ (function () {
        function BuilderAllocation() {
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        BuilderAllocation.LoadBuilders = function (e) {
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var container = document.getElementById(id + "Selected");
            var agreementSelectedDeveloperAmount = document.getElementById("builderDeveloperSelectedAmount");
            var agreementSelectedDeveloperCurrentlyAllocated = document.getElementById("builderDeveloperSelectedCurrentlyAllocated");
            var builderSelectedContainer = document.getElementById("builderSelected");
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
            Utilities.Hide(builderSelectedContainer);
            Utilities.Hide(container);
            Utilities.Hide(agreementSelectedDeveloperAmount);
            Utilities.Hide(agreementSelectedDeveloperCurrentlyAllocated);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (builders) {
                // let's load the dropdown
                var selectBuilder = document.getElementById("existingBuilders");
                Utilities.Clear_Element(selectBuilder);
                builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0; });
                if (builders.length > 0) {
                    Utilities.Show(container);
                    Utilities.Show(agreementSelectedDeveloperAmount);
                    Utilities.Show(agreementSelectedDeveloperCurrentlyAllocated);
                    var DeveloperAmount = document.getElementById("buildersDeveloperAgreementAmount");
                    var DeveloperAllocated = document.getElementById("buildersDeveloperCurrentlyAllocated");
                    DeveloperAmount.value = builders[0].Agreement_Amount_Formatted;
                    DeveloperAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;
                    selectBuilder.add(Utilities.Create_Option("", "Select Builder or Add New", true));
                    var distinctBuilder = [];
                    for (var _i = 0, builders_1 = builders; _i < builders_1.length; _i++) {
                        var b = builders_1[_i];
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
        };
        BuilderAllocation.LoadSpecificBuilder = function (e) {
            if (e.selectedIndex === 0) {
                BuilderAllocation.LoadBuilder("", "", "", "$0.00", false);
                return;
            }
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var builderId = parseInt(e.options[e.selectedIndex].value);
            ImpactFees.CombinedAllocation.GetAll("", builderId, "").then(function (builders) {
                if (builders.length > 0) {
                    var builder = builders[0];
                    BuilderAllocation.LoadBuilder(builder.Builder_Name, builder.Builder_Allocation_Amount.toString(), builder.Builder_Audit_Log, builder.Builder_Amount_Currently_Allocated_Formatted);
                }
                parent.classList.remove("is-loading");
            }).catch(function (e) {
                parent.classList.remove("is-loading");
                console.log('Load Specific builder error happened', e);
            });
        };
        BuilderAllocation.LoadBuilder = function (BuilderName, BuilderAmount, AuditLog, AlreadyAllocated, ShowContainer) {
            if (ShowContainer === void 0) { ShowContainer = true; }
            // hide Add New Builder button unless select index = 0
            var Name = document.getElementById("builderAllocationName");
            var Amount = document.getElementById("builderAllocationAmount");
            var Log = document.getElementById("builderAllocationAuditLog");
            var Allocated = document.getElementById("buildersAmountAllocatedToPermits");
            var container = document.getElementById("builderSelected");
            var existingContainer = document.getElementById("existingBuilderAllocation");
            Utilities.Hide(existingContainer);
            Utilities.Hide(container);
            if (ShowContainer)
                Utilities.Show(container);
            Name.value = BuilderName;
            Amount.value = BuilderAmount;
            Log.value = AuditLog;
            Allocated.value = AlreadyAllocated;
            if (AuditLog.length > 0) {
                Utilities.Show(existingContainer);
            }
            // load the values into the form and show it
        };
        BuilderAllocation.AddNewBuilder = function () {
            // clear out the form and show it
            var builderSelect = document.getElementById("existingBuilders");
            if (builderSelect.options.length > 0)
                builderSelect.selectedIndex = 0;
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
        };
        BuilderAllocation.SaveAllocation = function () {
            //builderAllocationErrorList
            var builderAllocationErrorContainer = document.getElementById("builderAllocationError");
            var builderAllocationError = document.getElementById("builderAllocationErrorList");
            Utilities.Hide(builderAllocationErrorContainer);
            var agreementSelect = document.getElementById("builderAllocationAgreementAdd");
            var agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            var builderSelect = document.getElementById("existingBuilders");
            var builderId = null;
            if (builderSelect.options.length > 0 && builderSelect.selectedIndex > 0) {
                builderId = builderSelect.options[builderSelect.selectedIndex].value;
            }
            var NameElement = document.getElementById("builderAllocationName");
            var AmountElement = document.getElementById("builderAllocationAmount");
            AmountElement.classList.remove("is-danger");
            NameElement.classList.remove("is-danger");
            var Amount = parseFloat(AmountElement.value);
            var BuilderName = NameElement.value.trim().toUpperCase();
            if (BuilderName.length < 3) {
                NameElement.focus();
                NameElement.classList.add("is-danger");
                var NameErrorElement = document.getElementById("builderAllocationNameError");
                Utilities.Error_Show(NameErrorElement);
                return;
            }
            if (isNaN(Amount) || Amount < 0) {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                var errorElement = document.getElementById("builderAllocationAmountError");
                Utilities.Error_Show(errorElement);
                return;
            }
            var b = new BuilderAllocation();
            b.Agreement_Number = agreementNumber;
            b.Builder_Name = BuilderName;
            b.Allocation_Amount = Amount;
            b.Id = builderId;
            //XHR.SaveObject<BuilderAllocation>("./.API/ImpactFees/SaveBuilderAllocation", b)
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Post(path + "API/ImpactFees/SaveBuilderAllocation", b)
                .then(function (a) {
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
        };
        return BuilderAllocation;
    }());
    ImpactFees.BuilderAllocation = BuilderAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=BuilderAllocation.js.map