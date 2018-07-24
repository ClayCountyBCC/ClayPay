
namespace clayPay
{
  interface IClientResponse
  {
    ResponseCashierData: CashierData;
    Charges: Array<Charge>;
    ReceiptPayments: Array<ReceiptPayment>;
    Errors: Array<string>;
    TransactionId: string;
    PartialErrors: Array<string>;
  }

  export class ClientResponse implements IClientResponse
  {
    public ResponseCashierData: CashierData = new CashierData();
    public Charges: Array<Charge> = [];
    public ReceiptPayments: Array<ReceiptPayment> = [];
    public TransactionId: string = "";

    public Errors: Array<string> = []; // Errors are full stop, meaning the payment did not process.
    public PartialErrors: Array<string> = []; // Partial errors mean part of the transaction was completed, but something wasn't.

    static CashierErrorTarget: string = "paymentError";
    static PublicErrorTarget: string = "publicPaymentError";
    static ReceiptContainer: string = "receipt";
    //static ReceiptErrorContainer: string = "receiptTransactionErrorContainer"; // To be used for partial payments.
    // receiptSearchElements
    static receiptSearchInput: string = "receiptSearch";
    static receiptSearchButton: string = "receiptSearchButton";
    static receiptSearchError: string = "receiptSearchError";

    constructor()
    {
    }

    public static ShowPaymentReceipt(cr: ClientResponse):void
    {
      console.log('client response ShowPaymentReceipt', cr);
      let container = document.getElementById(ClientResponse.ReceiptContainer);
      Utilities.Clear_Element(container);
      container.appendChild(ClientResponse.CreateReceiptView(cr));
      
      //if (cr.PartialErrors.length > 0)
      //{
      //  Utilities.Error_Show(ClientResponse.ReceiptErrorContainer, cr.PartialErrors, false);
      //}
      //if (cr.TransactionId.trim().length > 0)
      //{
      //  Utilities.Show(ClientResponse.TransactionIdContainer);
      //} else
      //{
      //  Utilities.Hide(ClientResponse.TransactionIdContainer);
      //}
      //Utilities.Set_Value(ClientResponse.TransactionId, cr.TransactionId);
      //Utilities.Set_Text(ClientResponse.TimeStampInput, cr.TimeStamp);
      //Utilities.Set_Value(ClientResponse.CashierIdInput, cr.CashierId);
      //Utilities.Set_Value(ClientResponse.AmountPaidInput, Utilities.Format_Amount(cr.AmountPaid));
      //Utilities.Set_Value(ClientResponse.ChangeDueInput, Utilities.Format_Amount(cr.ChangeDue));
      // this needs to hide all of the other sections and just show the receipt.
      Utilities.Show_Hide_Selector("#views > section", ClientResponse.ReceiptContainer);
    }

    private static CreateReceiptView(cr: ClientResponse): DocumentFragment
    {
      let df = document.createDocumentFragment();
      df.appendChild(ClientResponse.CreateReceiptHeader(cr));
      df.appendChild(Charge.CreateChargesTable(cr.Charges, ChargeView.receipt));
      df.appendChild(ClientResponse.CreateReceiptPayerView(cr.ResponseCashierData));
      // show payment info
      return df;
    }

    private static CreateReceiptHeader(cr: ClientResponse): HTMLDivElement
    {
      let div = document.createElement("div");
      div.classList.add("level")
      let title = document.createElement("span");
      title.classList.add("level-item");
      title.classList.add("title");
      title.appendChild(document.createTextNode("Payment Receipt for: " + cr.ReceiptPayments[0].CashierId));
      div.appendChild(title);
      let receiptDate = document.createElement("span");
      receiptDate.classList.add("level-item");
      receiptDate.classList.add("subtitle");
      receiptDate.appendChild(document.createTextNode(Utilities.Format_Date(cr.ResponseCashierData.TransactionDate)));
      let timestamp = cr.ResponseCashierData.TransactionDate
      return div;
    }

    private static CreateReceiptPayerView(cd: CashierData): DocumentFragment
    {
      let df = document.createDocumentFragment();
      df.appendChild(ClientResponse.CreatePayerDataColumns("Name", cd.PayerName, "Company Name", cd.PayerCompanyName));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Phone Number", cd.PayerPhoneNumber, "Email Address", cd.PayerEmailAddress));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Street Address", cd.PayerStreet1, "Processed By", cd.UserName));
      df.appendChild(ClientResponse.CreatePayerDataColumns("Address 2", cd.PayerStreet2, "", ""));
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

    public static Search(): void
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
        Utilities.Get(path + "API/Payments/Receipt/?CashierId=" + k).then(
          function (cr: ClientResponse)
          {
            console.log('Client Response', cr);
            if (cr.Errors.length > 0)
            {
              Utilities.Error_Show(ClientResponse.receiptSearchError, cr.Errors);
            }
            else
            {
              ClientResponse.ShowPaymentReceipt(cr);
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

  }

}