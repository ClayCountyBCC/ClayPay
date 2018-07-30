namespace Balancing
{
  interface ICashierTotal
  {
    Type: string;
    TotalAmount: number;
  }

  export class CashierTotal implements ICashierTotal
  {
    public Type: string = "";
    public TotalAmount: number = 0;

    constructor()
    {

    }
  }

}