namespace clayPay
{
  interface IReceiptPayment
  {
    CashierId: string;
    PayId: number;
    OTId: number;
    Info: string;
    TransactionDate: Date;
    PaymentType: string;
    PaymentTypeDescription: string;
    AmountApplied: number;
    AmountTendered: number;
    ChangeDue: number;
    ConvenienceFeeAmount: number;

  }

  export class ReceiptPayment implements IReceiptPayment
  {
    public CashierId: string = "";
    public PayId: number = -1;
    public OTId: number = -1;
    public Info: string = "";
    public TransactionDate: Date = new Date();
    public PaymentType: string = "";
    public PaymentTypeDescription: string = "";
    public AmountApplied: number = -1;
    public AmountTendered: number = -1;
    public ChangeDue: number = -1;
    public ConvenienceFeeAmount: number = -1;

    constructor()
    {

    }

    public CreateReceiptPaymentView(receipts: Array<ReceiptPayment>):DocumentFragment
    {
      let df = document.createDocumentFragment();



      // Here we handle Change Due and Convenience fees.
      // We'll add a row for each of them that are > 0
      let changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0 });
      let changeDue = changeDueTmp.reduce((ChangeDue: number, b: ReceiptPayment) =>
      {
        return ChangeDue + b.ChangeDue;
      }, 0);

      let convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0 });
      let convenienceFee = convenienceFeeTmp.reduce((ConvenienceFeeAmount: number, b: ReceiptPayment) =>
      {
        return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
      }, 0);

      return df;

    }

    private static CreateTable(): HTMLTableElement
    {
      let table = document.createElement("table");
      table.classList.add("table");
      table.classList.add("table");
      table.classList.add("is-fullwidth");
      let thead = document.createElement("THEAD");
      let tr = document.createElement("tr");
      tr.appendChild(UI.createTableHeaderElement("Payment Type", "20%"));
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

  }


}