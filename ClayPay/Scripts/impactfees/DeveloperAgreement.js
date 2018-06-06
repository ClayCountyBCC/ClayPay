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