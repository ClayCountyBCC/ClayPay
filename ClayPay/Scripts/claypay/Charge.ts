namespace clayPay
{

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
  }

}