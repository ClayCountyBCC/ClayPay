namespace Balancing
{
  interface IAccount
  {
    Fund: string;
    AccountNumber: string;
    Project: string;
    ProjectAccount: string;
    Total: string;
    CashAccount: string;
  }

  export class Account implements IAccount
  {
    public Fund: string = "";
    public AccountNumber: string = "";
    public Project: string = "";
    public ProjectAccount: string = "";
    public Total: string = "";
    public CashAccount: string = "";

    constructor()
    {

    }
  }

}