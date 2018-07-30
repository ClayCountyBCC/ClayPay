namespace ImpactFees
{
  interface IPermitWaiver
  {
    Waiver_Type: string;
    Permit_Number: string;
    Amount: number;
  }

  export class PermitWaiver implements IPermitWaiver
  {
    public Waiver_Type: string;
    public Permit_Number: string;
    public Amount: number;

    constructor()
    {

    }

  }
}