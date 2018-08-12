namespace Balancing
{
  interface ICashierDetailData
  {
    CashierId: string;
    TransactionDate: Date;
    Name: string;
    AmountApplied: number;
    PaymentType: string;
    CheckNumber: string;
    TransactionNumber: string;
    Info: string;
    AssocKey: string;
    ChargeTotal: number;
  }
  export class CashierDetailData implements ICashierDetailData
  {
    public CashierId: string;
    public TransactionDate: Date;
    public Name: string;
    public AmountApplied: number;
    public PaymentType: string;
    public CheckNumber: string;
    public TransactionNumber: string;
    public Info: string;
    public AssocKey: string;
    public ChargeTotal: number;

    constructor()
    {
    }

    public static CreateView(cdd: Array<CashierDetailData>): DocumentFragment
    {
      let df = document.createDocumentFragment();
      console.log("You're missing the CashierDetailData view");
      return df;
    }

  }

}