namespace ImpactFees
{
  interface IBuilderAllocation
  {
    Agreement_Number: string;
    Builder_Name: string;
    Id: number;
    Allocation_Amount: number;
    Amount_Currently_Allocated: number;
    Audit_Log: string;
  }

  export class BuilderAllocation implements IBuilderAllocation
  {
    public Agreement_Number: string;
    public Builder_Name: string;
    public Id: number;
    public Allocation_Amount: number;
    public Amount_Currently_Allocated: number = 0;
    public Audit_Log: string = "";

    constructor()
    {

    }

    public static LoadBuilders(e: HTMLSelectElement): void
    {
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
      if (e.selectedIndex === 0)
      {
        parent.classList.remove("is-loading");
        return; // no agreement selected.
      }
      let agreementNumber = e.options[e.selectedIndex].value;

      CombinedAllocation.GetAll(agreementNumber, -1, "").then(
        function (builders)
        {
          // let's load the dropdown
          let selectBuilder = <HTMLSelectElement>document.getElementById("existingBuilders");
          Utilities.Clear_Element(selectBuilder);
          builders = builders.filter(function (b) { return b.Builder_Name.trim().length > 0;})
          if (builders.length > 0)
          {
            Utilities.Show(container);
            Utilities.Show(agreementSelectedDeveloperAmount);
            Utilities.Show(agreementSelectedDeveloperCurrentlyAllocated);
            let DeveloperAmount = <HTMLInputElement>document.getElementById("buildersDeveloperAgreementAmount");
            let DeveloperAllocated = <HTMLInputElement>document.getElementById("buildersDeveloperCurrentlyAllocated");
            DeveloperAmount.value = builders[0].Agreement_Amount_Formatted;
            DeveloperAllocated.value = builders[0].Developer_Amount_Currently_Allocated_Formatted;

            selectBuilder.add(Utilities.Create_Option("", "Select Builder or Add New", true));
            let distinctBuilder = [];
            for (let b of builders)
            {
              if (distinctBuilder.indexOf(b.Builder_Id) === -1 && b.Builder_Name.trim() !== "")
              {
                distinctBuilder.push(b.Builder_Id);
                selectBuilder.add(Utilities.Create_Option(b.Builder_Id.toString(), b.Builder_Name));
              }
            }
          }
          else
          {
            // if there are no builders for this agreement already setup
            // let's just show the add builder inputs.
            BuilderAllocation.LoadBuilder("", "", "", "$0.00");
          }
          parent.classList.remove("is-loading");
        }).catch(function (e)
      {
        parent.classList.remove("is-loading");
        // some kind of error occurred.
      })
    }

    public static LoadSpecificBuilder(e: HTMLSelectElement): void
    {
      if (e.selectedIndex === 0)
      {
        BuilderAllocation.LoadBuilder("", "", "", "$0.00");
        return;
      }
      let parent = e.parentElement;
      parent.classList.add("is-loading");
      let builderId = parseInt(e.options[e.selectedIndex].value);
      CombinedAllocation.GetAll("", builderId, "").then(
        function (builders)
        {
          if (builders.length > 0)
          {
            let builder = builders[0];
            BuilderAllocation.LoadBuilder(builder.Builder_Name, builder.Builder_Allocation_Amount.toString(), builder.Builder_Audit_Log, builder.Builder_Amount_Currently_Allocated_Formatted);
          }

          parent.classList.remove("is-loading");
        }).catch(function (e)
        {
          parent.classList.remove("is-loading");
          console.log('Load Specific builder error happened', e);
        });
    }

    public static LoadBuilder(BuilderName: string, BuilderAmount: string, AuditLog: string, AlreadyAllocated: string): void
    {
      // hide Add New Builder button unless select index = 0
      let Name = <HTMLInputElement>document.getElementById("builderAllocationName");
      let Amount = <HTMLInputElement>document.getElementById("builderAllocationAmount");
      let Log = <HTMLTextAreaElement>document.getElementById("builderAllocationAuditLog");
      let Allocated = <HTMLInputElement>document.getElementById("buildersAmountAllocatedToPermits");
      let container = document.getElementById("builderSelected");
      let existingContainer = document.getElementById("existingBuilderAllocation");
      Utilities.Hide(existingContainer);
      Utilities.Show(container);
      Name.value = BuilderName;
      Amount.value = BuilderAmount;
      Log.value = AuditLog;
      Allocated.value = AlreadyAllocated;
      if (AuditLog.length > 0)
      {
        Utilities.Show(existingContainer);
      }
      // load the values into the form and show it
    }

    public static AddNewBuilder():void
    {
      // clear out the form and show it
      let builderSelect = <HTMLSelectElement>document.getElementById("existingBuilders");
      if (builderSelect.options.length > 0) builderSelect.selectedIndex = 0;
      BuilderAllocation.LoadBuilder("", "", "", "$0.00");
    }

    public static SaveAllocation(): void
    {
      //builderAllocationErrorList
      let builderAllocationErrorContainer = <HTMLInputElement>document.getElementById("builderAllocationError");
      let builderAllocationError = <HTMLInputElement>document.getElementById("builderAllocationErrorList");

      Utilities.Hide(builderAllocationErrorContainer);
      let agreementSelect = <HTMLSelectElement>document.getElementById("builderAllocationAgreementAdd");
      let agreementNumber = agreementSelect.options[agreementSelect.selectedIndex].value;

      let builderSelect = <HTMLSelectElement>document.getElementById("existingBuilders");
      let builderId = null;
      if (builderSelect.options.length > 0 && builderSelect.selectedIndex > 0)
      {
        builderId = builderSelect.options[builderSelect.selectedIndex].value;
      }

      let NameElement = <HTMLInputElement>document.getElementById("builderAllocationName");
      let AmountElement = <HTMLInputElement>document.getElementById("builderAllocationAmount");
      AmountElement.classList.remove("is-danger");
      NameElement.classList.remove("is-danger");
      let Amount = parseFloat(AmountElement.value);
      let BuilderName = NameElement.value.trim().toUpperCase();
      if (BuilderName.length < 3)
      {
        NameElement.focus();
        NameElement.classList.add("is-danger");
        let NameErrorElement = <HTMLElement>document.getElementById("builderAllocationNameError");
        Utilities.Error_Show(NameErrorElement);
        return;
      }
      if (isNaN(Amount) || Amount < 0)
      {
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
      //XHR.SaveObject<BuilderAllocation>("./.API/ImpactFees/SaveBuilderAllocation", b)
      let path = "/";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      Utilities.Post<Array<string>>(path + "API/ImpactFees/SaveBuilderAllocation", b)
        .then(function (a)
        {
          console.log('response', a);
          if (a.length > 0)
          {
            Utilities.Show(builderAllocationErrorContainer);
            builderAllocationError.value = a.join("\n");
          }
          else
          {
            BuilderAllocation.LoadBuilders(agreementSelect);
          }

        }).catch(function (e)
        {
          // figure out what we want to do with the errors.
          Utilities.Show(builderAllocationErrorContainer);
          builderAllocationError.value = e;
        });
    }

  }
}