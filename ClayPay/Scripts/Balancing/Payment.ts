namespace Balancing
{

  interface IPayment
  {
    TransactionDate: Date;
    CashierId: string;
    OTid: number;
    Name: string;
    Total: number;
    Error: string;
  }
  export class Payment implements IPayment
  {
    public TransactionDate: Date;
    public CashierId: string;
    public OTid: number;
    public Name: string;
    public Total: number;
    public Error: string;

    constructor()
    {
    }



  }
}