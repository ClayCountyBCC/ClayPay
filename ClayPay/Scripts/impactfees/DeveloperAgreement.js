var ImpactFees;
(function (ImpactFees) {
    var DeveloperAgreement = /** @class */ (function () {
        function DeveloperAgreement() {
            this.Developer_Name = "";
            this.Amount_Currently_Allocated = 0;
            this.Audit_Log = "";
        }
        DeveloperAgreement.Load = function (e) {
            var parent = e.parentElement;
            parent.classList.add("is-loading");
            var id = e.id.replace("Add", "");
            var container = document.getElementById(id + "Selected");
            Utilities.Hide(container);
            if (e.selectedIndex === 0) {
                parent.classList.remove("is-loading");
                return; // no agreement selected.
            }
            var agreementNumber = e.options[e.selectedIndex].value;
            ImpactFees.CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (agreements) {
                if (agreements.length > 0) {
                    var da = agreements[0];
                    // Load this object's data into the html form.
                    var Amount = document.getElementById("developerAgreementAmount");
                    Amount.classList.remove("is-danger");
                    var AllocatedAmount = document.getElementById("developerCurrentlyAllocated");
                    var AuditLog = document.getElementById("developerAgreementAuditLog");
                    var existingAgreement = document.getElementById("existingDeveloperAgreement");
                    var existingAmountAllocated = document.getElementById("existingAgreementAmountAllocated");
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
        };
        DeveloperAgreement.SaveAgreement = function () {
            var developerAgreementError = document.getElementById("developerAgreementErrorList");
            var developerAgreementErrorContainer = document.getElementById("developerAgreementError");
            Utilities.Hide(developerAgreementErrorContainer);
            var agreementSelect = document.getElementById("developerAgreementAdd");
            var agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
            var AmountElement = document.getElementById("developerAgreementAmount");
            AmountElement.classList.remove("is-danger");
            var Amount = parseFloat(AmountElement.value);
            if (!isNaN(Amount) && Amount >= 0) { // cursory validation, main validation will be the backend.
                var d = new DeveloperAgreement();
                d.Agreement_Amount = Amount;
                d.Agreement_Number = agreementNumber;
                //XHR.SaveObject<DeveloperAgreement>("../API/ImpactFees/SaveDeveloperAgreement", d)
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                Utilities.Post(path + "API/ImpactFees/SaveDeveloperAgreement", d)
                    .then(function (a) {
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
                    console.log('error response', e);
                    Utilities.Show(developerAgreementErrorContainer);
                    developerAgreementError.value = e;
                });
            }
            else {
                // show error messages
                AmountElement.focus();
                AmountElement.classList.add("is-danger");
                var errorElement = document.getElementById("developerAgreementAmountError");
                Utilities.Error_Show(errorElement);
            }
        };
        return DeveloperAgreement;
    }());
    ImpactFees.DeveloperAgreement = DeveloperAgreement;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=DeveloperAgreement.js.map