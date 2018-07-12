namespace ImpactFees
{
  interface IDeveloperAgreement
  {

    Agreement_Number: string;
    Developer_Name: string;
    Agreement_Amount: number;
    Amount_Currently_Allocated: number;
    Audit_Log: string;
  }

  export class DeveloperAgreement implements IDeveloperAgreement
  {
    public Agreement_Number: string;
    public Developer_Name: string = "";
    public Agreement_Amount: number;
    public Amount_Currently_Allocated: number = 0;
    public Audit_Log: string = "";

    constructor()
    {
    }

    public static Load(e: HTMLSelectElement): void
    {
      let parent = e.parentElement;
      parent.classList.add("is-loading");
      let id = e.id.replace("Add", "");
      let container = document.getElementById(id + "Selected");
      Utilities.Hide(container);
      if (e.selectedIndex === 0)
      {
        parent.classList.remove("is-loading");
        return; // no agreement selected.
      }

      let agreementNumber = e.options[e.selectedIndex].value;

      CombinedAllocation.GetAll(agreementNumber, -1, "").then(function (agreements)
      {
        if (agreements.length > 0)
        {
          let da = agreements[0];
          // Load this object's data into the html form.
          let Amount = <HTMLInputElement>document.getElementById("developerAgreementAmount");
          Amount.classList.remove("is-danger");
          let AllocatedAmount = <HTMLInputElement>document.getElementById("developerCurrentlyAllocated");
          let AuditLog = <HTMLInputElement>document.getElementById("developerAgreementAuditLog");
          let existingAgreement = <HTMLElement>document.getElementById("existingDeveloperAgreement");
          let existingAmountAllocated = <HTMLElement>document.getElementById("existingAgreementAmountAllocated");
          Amount.value = da.Agreement_Amount.toString();
          AllocatedAmount.value = da.Developer_Amount_Currently_Allocated_Formatted;
          AuditLog.value = da.Developer_Audit_Log;
          
          if (da.Developer_Audit_Log.length === 0)
          {
            Utilities.Hide(existingAgreement);
            Utilities.Hide(existingAmountAllocated);
          }
          else
          {
            Utilities.Show(existingAgreement);
            Utilities.Show(existingAmountAllocated);
          }
          Utilities.Show(container);
          parent.classList.remove("is-loading");
        }
      }).catch(function (e)
      {
        parent.classList.remove("is-loading");
        // some kind of error occurred.
      })

    }

    public static SaveAgreement(): void
    {
      let developerAgreementError = <HTMLInputElement>document.getElementById("developerAgreementErrorList");
      let developerAgreementErrorContainer = document.getElementById("developerAgreementError");
      Utilities.Hide(developerAgreementErrorContainer);
      let agreementSelect = <HTMLSelectElement>document.getElementById("developerAgreementAdd");
      let agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;
      let AmountElement = <HTMLInputElement>document.getElementById("developerAgreementAmount");
      AmountElement.classList.remove("is-danger");
      let Amount = parseFloat(AmountElement.value);
      if (!isNaN(Amount) && Amount >= 0)
      { // cursory validation, main validation will be the backend.
        let d = new DeveloperAgreement();
        d.Agreement_Amount = Amount;
        d.Agreement_Number = agreementNumber;
        //XHR.SaveObject<DeveloperAgreement>("../API/ImpactFees/SaveDeveloperAgreement", d)
        Utilities.Post<Array<string>>("../API/ImpactFees/SaveDeveloperAgreement", d)
          .then(function (a)
          {
            console.log('response', a);
            if (a.length > 0)
            {
              Utilities.Show(developerAgreementErrorContainer);
              developerAgreementError.value = a.join("\n");
            }
            else
            {
              DeveloperAgreement.Load(agreementSelect);
            }

          }).catch(function (e)
          {
            // figure out what we want to do with the errors.
            console.log('error response', e);
            Utilities.Show(developerAgreementErrorContainer);
            developerAgreementError.value = e;
          });
      }
      else
      {
        // show error messages
        AmountElement.focus();
        AmountElement.classList.add("is-danger");
        let errorElement = document.getElementById("developerAgreementAmountError");
        Utilities.Error_Show(errorElement);
      }
    }

  }

}