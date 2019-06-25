
namespace clayPay
{
  interface IClientResponse
  {
    ResponseCashierData: CashierData;
    Charges: Array<Charge>;
    ReceiptPayments: Array<ReceiptPayment>;
    Errors: Array<string>;
    TransactionId: string;
    IsEditable: boolean;
    PartialErrors: Array<string>;
    CanVoid: boolean;
  }

  export class ClientResponse implements IClientResponse
  {
    public ResponseCashierData: CashierData = new CashierData();
    public Charges: Array<Charge> = [];
    public ReceiptPayments: Array<ReceiptPayment> = [];
    public TransactionId: string = "";
    public IsEditable: boolean = false;
    public Errors: Array<string> = []; // Errors are full stop, meaning the payment did not process.
    public PartialErrors: Array<string> = []; // Partial errors mean part of the transaction was completed, but something wasn't.
    public CanVoid: boolean = false;

    static CashierErrorTarget: string = "paymentError";
    static PublicErrorTarget: string = "publicPaymentError";
    static PaymentReceiptContainer: string = "receipt";
    static BalancingReceiptContainer: string = "receiptView";
    //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
    // receiptSearchElements
    static receiptSearchInput: string = "receiptSearch";
    static receiptSearchButton: string = "receiptSearchButton";
    static receiptSearchError: string = "receiptSearchError";

    constructor()
    {
    }

    public static ShowPaymentReceipt(cr: ClientResponse, target: string, showVoid: boolean = false):void
    {
      console.log('client response ShowPaymentReceipt', cr);
      let container = document.getElementById(target);
      Utilities.Clear_Element(container);
      container.appendChild(ClientResponse.CreateReceiptView(cr, showVoid));
      Utilities.Show_Hide_Selector("#views > section", target);
    }

    private static CreateReceiptView(cr: ClientResponse, showVoid: boolean): DocumentFragment
    {      
      let df = document.createDocumentFragment();
      if (cr.ReceiptPayments.length === 0) return df;
      df.appendChild(ClientResponse.CreateReceiptHeader(cr, showVoid));
      df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
      df.appendChild(Charge.CreateChargesTable(cr.Charges, ChargeView.receipt));
      df.appendChild(ReceiptPayment.CreateReceiptPaymentView(cr.ReceiptPayments, cr.IsEditable));
      // show payment info
      return df;
    }

    private static CreateReceiptHeader(cr: ClientResponse, showVoid: boolean): HTMLDivElement
    {
      let div = document.createElement("div");
      div.classList.add("level")
      let title = document.createElement("span");
      div.appendChild(title);
      title.classList.add("level-item");
      title.classList.add("title");
      title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
      if (showVoid && cr.CanVoid)
      {
        let voidbutton = document.createElement("button");
        voidbutton.classList.add("button");
        voidbutton.classList.add("is-warning");
        voidbutton.classList.add("is-normal");
        voidbutton.classList.add("hide-for-print");
        voidbutton.classList.add("level-item");
        voidbutton.appendChild(document.createTextNode("Void Payment"));
        voidbutton.onclick = function ()
        {
          Utilities.Update_Menu(UI.Menus[5]);
          Utilities.Toggle_Loading_Button("receiptSearchButton", true);
          //Utilities.Toggle_Loading_Button(voidbutton, true);
          ClientResponse.Search(cr.ResponseCashierData.CashierId);
        }
        div.appendChild(voidbutton);
      }
      
      let receiptDate = document.createElement("span");
      receiptDate.classList.add("level-item");
      receiptDate.classList.add("subtitle");
      receiptDate.appendChild(document.createTextNode("Transaction Date: " + Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
      
      div.appendChild(receiptDate);
      let timestamp = cr.ResponseCashierData.TransactionDate
      return div;
    }

    private static CreateReceiptPayerView(cd: CashierData): DocumentFragment
    {
      let df = document.createDocumentFragment();
      if (cd.IsVoided)
      {
        let level = document.createElement("div");
        level.classList.add("level");
        level.classList.add("notification");
        level.classList.add("is-danger");
        let levelitem = document.createElement("p");
        levelitem.classList.add("level-item");        
        levelitem.classList.add("title");
        levelitem.appendChild(document.createTextNode("This transaction has been voided."));
        level.appendChild(levelitem);
        df.appendChild(level);

      }
      df.appendChild(ClientResponse.CreatePayerDataColumns("Name", cd.PayerName, "Company Name", cd.PayerCompanyName));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Phone Number", cd.PayerPhoneNumber, "Email Address", cd.PayerEmailAddress));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Street Address", cd.PayerStreet1, "Address 2", cd.PayerStreet2));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Processed By", cd.UserName, "", ""));
      return df;
    }

    private static CreatePayerDataColumns(label1: string, value1: string, label2: string, value2: string): HTMLDivElement
    {
      let div = document.createElement("div");
      div.classList.add("columns");
      div.style.marginBottom = "0";
      div.appendChild(ClientResponse.CreatePayerData(label1, value1));
      div.appendChild(ClientResponse.CreatePayerData(label2, value2));
      return div;
    }

    private static CreatePayerData(label: string, value: string): HTMLDivElement
    {
      let field = document.createElement("div");
      field.classList.add("field");
      field.classList.add("column");
      let dataLabel = document.createElement("label");
      dataLabel.classList.add("label");
      dataLabel.appendChild(document.createTextNode(label));
      let control = document.createElement("div");
      control.classList.add("control");

      let input = document.createElement("input");
      input.classList.add("input");
      input.classList.add("is-static");
      input.readOnly = true;
      input.type = "text";
      input.value = value;
      control.appendChild(input);      
      field.appendChild(dataLabel);
      field.appendChild(control);
      return field;
    }

    public static Search(CashierIdToVoid: string = ""): void
    {
      Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, true);
      let input = <HTMLInputElement>document.getElementById(ClientResponse.receiptSearchInput);
      let k: string = input.value.trim().toUpperCase();
      if (k.length !== 9)
      {
        Utilities.Error_Show(ClientResponse.receiptSearchError, "Receipts must be 8 digits and a dash, like 18-000001.");
        return;
      }
      if (k.length > 0)
      {
        let path = "/";
        let i = window.location.pathname.toLowerCase().indexOf("/claypay");
        if (i == 0)
        {
          path = "/claypay/";
        }
        let fullpath = "";
        if (CashierIdToVoid.length > 0)
        {
          fullpath = path + "API/Payments/VoidPayment/?CashierId=" + CashierIdToVoid;
        }
        else
        {
          fullpath = path + "API/Payments/Receipt/?CashierId=" + k
        }
        Utilities.Get(fullpath).then(
          function (cr: ClientResponse)
          {
            console.log('Client Response', cr);
            if (cr.Errors.length > 0)
            {
              let container = document.getElementById(ClientResponse.PaymentReceiptContainer);
              Utilities.Clear_Element(container);
              Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
            }
            else
            {
              ClientResponse.ShowPaymentReceipt(cr, ClientResponse.PaymentReceiptContainer, true);
            }
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
          },
          function (errorText)
          {
            console.log('error in Receipt Search', errorText);
            Utilities.Error_Show(ClientResponse.receiptSearchError, errorText);
            // do something with the error here
            // need to figure out how to detect if something wasn't found
            // versus an error.
            Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
          });
      } else
      {
        Utilities.Error_Show(ClientResponse.receiptSearchError, "Invalid search. Please check your entry and try again.")
        input.focus();
        Utilities.Toggle_Loading_Button(ClientResponse.receiptSearchButton, false);
      }



    }

    public static BalancingSearch(link: HTMLElement = null): void
    {
      let cashierId = Utilities.Get_Value("receiptSearch");
      let path = "/";
      let qs = "";
      let i = window.location.pathname.toLowerCase().indexOf("/claypay");
      if (i == 0)
      {
        path = "/claypay/";
      }
      //DateTime DateToBalance, string PaymentType
      qs = "?CashierId=" + cashierId;
      Utilities.Get<clayPay.ClientResponse>(path + "API/Balancing/Receipt" + qs)
        .then(function (cr)
        {
          console.log('client response', cr);
          if (link !== null) Utilities.Set_Text(link, cashierId);          
          clayPay.ClientResponse.ShowPaymentReceipt(cr, Balancing.Payment.DJournalReceiptContainer, false);
          // need to select the right box at the top
          let menulist = Balancing.Menus.filter(function (j) { return j.id === "nav-receipts" });
          let receiptMenu = menulist[0];
          Utilities.Update_Menu(receiptMenu)
        }, function (error)
          {
          console.log('error getting client response for cashier id: ' + cashierId, error);
          if (link !== null) Utilities.Set_Text(link, cashierId); // change it back
          });
    }

  }

}