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
    CheckNumber: string;
    TransactionId: string;
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
    public CheckNumber: string = "";
    public TransactionId: string = "";

    constructor()
    {

    }

    public static CreateReceiptPaymentView(receipts: Array<ReceiptPayment>):DocumentFragment
    {
      let df = document.createDocumentFragment();
      let table = ReceiptPayment.CreateTable();
      let tbody = document.createElement("TBODY");
      for (let receipt of receipts)
      {
        let transaction = receipt.CheckNumber.length > 0 ? receipt.CheckNumber : receipt.TransactionId;
        tbody.appendChild(
          ReceiptPayment.BuildPaymentRow(
            receipt.PaymentTypeDescription,
            receipt.Info,
            transaction,
            receipt.AmountTendered,
            receipt.AmountApplied));
      }
      
      // Here we handle Change Due and Convenience fees.
      // We'll add a row for each of them that are > 0
      let changeDueTmp = receipts.filter(function (j) { return j.ChangeDue > 0 });
      let TotalChangeDue = changeDueTmp.reduce((ChangeDue: number, b: ReceiptPayment) =>
      {
        return ChangeDue + b.ChangeDue;
      }, 0);

      if (TotalChangeDue > 0)
      {
        tbody.appendChild(
          ReceiptPayment.BuildPaymentRow(
            "Total Change Due",
            "",
            "",
            TotalChangeDue,
            0));
      }

      let convenienceFeeTmp = receipts.filter(function (j) { return j.ConvenienceFeeAmount > 0 });
      let TotalConvenienceFee = convenienceFeeTmp.reduce((ConvenienceFeeAmount: number, b: ReceiptPayment) =>
      {
        return ConvenienceFeeAmount + b.ConvenienceFeeAmount;
      }, 0);

      if (TotalConvenienceFee > 0)
      {
        tbody.appendChild(
          ReceiptPayment.BuildPaymentRow(
            "Convenience Fee Estimate",
            "",
            "",
            TotalConvenienceFee,
            0));
      }
      table.appendChild(tbody);
      df.appendChild(table);
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
      tr.appendChild(UI.createTableHeaderElement("Payment Type", "15%"));
      tr.appendChild(UI.createTableHeaderElement("Info", "35%"));
      tr.appendChild(UI.createTableHeaderElement("Check/Trans#", "20%"));
      tr.appendChild(UI.createTableHeaderElement("Tendered", "15%"));
      tr.appendChild(UI.createTableHeaderElement("Applied", "15%"));
      thead.appendChild(tr);
      table.appendChild(thead);
      return table;
    }

    private static BuildPaymentRow(
      paymentType: string,
      info: string,
      checkNumber: string,
      tendered: number,
      applied: number): HTMLTableRowElement
    {
      let tr = document.createElement("tr");
      tr.appendChild(UI.createTableElement(paymentType));
      tr.appendChild(UI.createTableElement(info));
      tr.appendChild(UI.createTableElement(checkNumber));
      tr.appendChild(UI.createTableElement(Utilities.Format_Amount(tendered)));
      if (paymentType === "Convenience Fee Estimate")
      {
        tr.appendChild(UI.createTableElement(""));
      }
      else
      {
        tr.appendChild(UI.createTableElement(Utilities.Format_Amount(applied)));
      }
      
      return tr;
    }


  }


}