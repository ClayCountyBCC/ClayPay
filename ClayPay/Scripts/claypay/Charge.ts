namespace clayPay
{
  export enum ChargeView
  {
    search_results,
    cart,
    receipt
  }
  interface ICharge
  {
    ItemId: number;
    Description: string;
    TimeStamp: Date;
    TimeStampDisplay: string;
    Assoc: string;
    AssocKey: string;
    Total: number;
    Detail: string;
  }

  export class Charge implements ICharge
  {
    public ItemId: number = 0;
    public Description: string = "";
    public TimeStamp: Date;
    public TimeStampDisplay: string = "";
    public Assoc: string;
    public AssocKey: string;
    public Total: number;
    public Detail: string;

    constructor()
    {

    }

    private static CreateTable(view: ChargeView): HTMLTableElement
    {
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("table");
      table.classList.add("is-fullwidth");
      let thead = document.createElement("THEAD");
      let tr = document.createElement("tr");
      tr.appendChild(UI.createTableHeaderElement("Key", "20%"));
      tr.appendChild(UI.createTableHeaderElement("Description", "40%"));
      if (view !== ChargeView.receipt)
      {
        tr.appendChild(UI.createTableHeaderElement("Date", "15%"));
        tr.appendChild(UI.createTableHeaderElement("Amount", "15%"));
        tr.appendChild(UI.createTableHeaderElement("", "10%"));
      }
      else
      {
        tr.appendChild(UI.createTableHeaderElement("Date", "20%"));
        tr.appendChild(UI.createTableHeaderElement("Amount", "20%"));
      }
      thead.appendChild(tr);
      table.appendChild(thead);
      return table;
    }

    public static CreateChargesTable(charges: Array<Charge>, view: ChargeView): DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = Charge.CreateTable(view);
      let tbody = document.createElement("TBODY");
      charges.forEach(function (charge)
      {
        tbody.appendChild(Charge.buildChargeRow(charge, view));
      });

      let tfoot = document.createElement("TFOOT");
      tfoot.appendChild(Charge.buildChargeFooterRow(charges, view));
      table.appendChild(tbody);
      table.appendChild(tfoot);
      df.appendChild(table);
      return df;
    }

    private static buildChargeFooterRow(charges: Array<Charge>, view: ChargeView): DocumentFragment
    {
      // Based on ChargeView:
      // Search Results Footer should show: 
      //  1. Total Charges
      //  2. Add All Charges To Cart
      //  3. View Cart
      // Cart Footer should show:
      //  1. Total Charges
      //  2. Convenience Fee
      // Receipt Footer should show:
      //  1. Total Charges

      let df = document.createDocumentFragment();
      let trTotal = document.createElement("tr");
      trTotal.appendChild(UI.createTableElement("", "", 2)); 
      trTotal.appendChild(UI.createTableElement("Total", "has-text-weight-bold", 1));
      let TotalAmount: number = charges.reduce((total: number, b: Charge) =>
      {
        return total + b.Total;
      }, 0);
      trTotal.appendChild(UI.createTableElement(Utilities.Format_Amount(TotalAmount), ""));
      if (view === ChargeView.search_results)
      {
        trTotal.appendChild(Charge.createAddAllChargesToCartButton());
      }
      else
      {
        trTotal.appendChild(UI.createTableElement("", "", 1));
      }
      df.appendChild(trTotal);
      switch (view)
      {
        case ChargeView.search_results:
          // Add View Cart button
          df.appendChild(Charge.createViewCartFooterRow());
          break;
        case ChargeView.cart:
          // Show Convenience Fee
          df.appendChild(Charge.buildConvFeeFooterRow());
          break;
      }
      return df;
    }
    
    private static buildConvFeeFooterRow(): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.style.fontWeight = "bolder";
      tr.appendChild(UI.createTableElement("There is a nonrefundable transaction fee charged for Credit Card Payments by our payment provider. This is charged in addition to the total above.", "", 2));
      tr.appendChild(UI.createTableElement("Conv. Fee", "center", 1));
      tr.appendChild(UI.createTableElement(clayPay.ConvenienceFee, "", 1));
      tr.appendChild(UI.createTableElement("", "", 1));
      return tr;
    }

    private static buildChargeRow(charge: Charge, view: ChargeView): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(UI.createTableElement(charge.AssocKey));
      tr.appendChild(UI.createTableElement(charge.Description, "left"));
      tr.appendChild(UI.createTableElement(charge.TimeStampDisplay, "center"));
      tr.appendChild(UI.createTableElement(Utilities.Format_Amount(charge.Total), "center"));
      if (view !== ChargeView.receipt)
      {
        tr.appendChild(Charge.createChargeCartButtonToggle("Add to Cart", charge.ItemId, "center", true));
      }
      return tr;
    }
    
    private static createAddAllChargesToCartButton(): HTMLTableCellElement
    {
      let td = document.createElement("td");
      let button = document.createElement("button");
      button.type = "button"
      button.classList.add("button");
      button.classList.add("is-primary");
      button.appendChild(document.createTextNode("Add All To Cart"));
      button.onclick = (ev: Event) =>
      {
        for (let charge of clayPay.CurrentTransaction.CurrentCharges)
        {
          if (!UI.IsItemInCart(charge.ItemId))
          {
            clayPay.CurrentTransaction.Cart.push(charge);
          }
        }
        UI.updateCart();
        // we're going to rerun the "Create Table" so that it'll 
        // update each row
        UI.ProcessSearchResults(clayPay.CurrentTransaction.CurrentCharges);
        //AddCharges(clayPay.CurrentTransaction.CurrentCharges);
      }
      td.appendChild(button);
      return td;
    
    }

    private static createChargeCartButtonToggle(
      value: string,
      itemId: number,
      className: string,
      toggle: boolean): HTMLTableCellElement
      //addOnClickFunction: (ev: Event, i: number) => void,
      //removeOnClickFunction: (ev: Event, i: number, t: boolean) => void): HTMLTableCellElement
    {
      let removeButton = document.createElement("a");
      let remove = document.createElement("div");
      let addButton = document.createElement("button");

      let IsInCart: boolean = UI.IsItemInCart(itemId);
      let d = document.createElement("td");
      d.className = className;
      
      addButton.style.display = IsInCart ? "none" : "inline-block";
      addButton.type = "button";
      addButton.className = "button is-primary";
      addButton.onclick = (ev: Event) =>
      {
        let item: Array<Charge> = clayPay.CurrentTransaction.CurrentCharges.filter((c: Charge) =>
        {
          return c.ItemId == itemId;
        });
        if (item.length === 1 && clayPay.CurrentTransaction.Cart.indexOf(item[0]) === -1)
        {
          clayPay.CurrentTransaction.Cart.push(item[0]);
        }
        remove.style.display = "inline-block";
        addButton.style.display = "none";
        UI.updateCart();
      };

      
      remove.style.display = IsInCart ? "inline-block" : "none";
      remove.appendChild(document.createTextNode('Added ('));
      removeButton.classList.add("is-warning");
      removeButton.style.cursor = "pointer";
      removeButton.appendChild(document.createTextNode('remove'));
      removeButton.onclick = (ev: Event) =>
      {
        let newCart: Array<Charge> = clayPay.CurrentTransaction.Cart.filter((c: Charge) =>
        {
          return c.ItemId !== itemId;
        });
        clayPay.CurrentTransaction.Cart = newCart;
        UI.updateCart();
        remove.style.display = "none";
        addButton.style.display = "inline-block";
      };

      remove.appendChild(removeButton);
      remove.appendChild(document.createTextNode(')'));
      addButton.appendChild(document.createTextNode(value));
      d.appendChild(addButton);
      d.appendChild(remove);
      return d;
    }


    private static createViewCartFooterRow(): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(UI.createTableElement("", "", 4));
      let td = document.createElement("td");
      let button = document.createElement("button");
      button.type = "button";
      button.classList.add("button");
      button.classList.add("is-success");
      button.onclick = (ev: Event) =>
      {
        let menulist = UI.Menus.filter(function (j) { return j.id === "nav-cart" });
        let cartMenu = menulist[0];
        let title = document.getElementById("menuTitle");
        let subTitle = document.getElementById("menuSubTitle");
        Utilities.Clear_Element(title);
        Utilities.Clear_Element(subTitle);
        title.appendChild(document.createTextNode(cartMenu.title));
        subTitle.appendChild(document.createTextNode(cartMenu.subTitle));
        Utilities.Show_Menu(cartMenu.id);
      }
      button.appendChild(document.createTextNode("View Cart"));
      td.appendChild(button);
      tr.appendChild(td);
      return tr;
    }

  }

}