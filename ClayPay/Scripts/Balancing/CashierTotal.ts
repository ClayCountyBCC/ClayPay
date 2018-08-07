namespace Balancing
{
  interface ICashierTotal
  {
    Type: string;
    Code: string;
    TotalAmount: number;
  }

  export class CashierTotal implements ICashierTotal
  {
    public Type: string = "";
    public Code: string = "";
    public TotalAmount: number = 0;

    constructor()
    {

    }
  }

}