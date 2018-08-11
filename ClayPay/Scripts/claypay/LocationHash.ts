namespace clayPay
{
  interface ILocationHash
  {
    Permit: string;
    CashierId: string;
    ContractorId: string;
    ApplicationNumber: string;
  }

  export class LocationHash implements ILocationHash
  {
    public Permit: string = "";
    public CashierId: string = "";
    public ContractorId: string = "";
    public ApplicationNumber: string = "";

    constructor(locationHash: string)
    {
      let ha: Array<string> = locationHash.split("&")
      for (let i = 0; i < ha.length; i++)
      {
        let k: Array<string> = ha[i].split("=");
        switch (k[0].toLowerCase())
        {
          case "application":
            this.ApplicationNumber = k[1];
            break;
          case "contractor":
            this.ContractorId = k[1];
            break;
          case "permit":
            this.Permit = k[1];
            break;
          case "cashierid":
            this.CashierId = k[1];
            break;
        }
      }

    }

    //UpdatePermit(permit: string)
    //{ // this function is going to take the current LocationHash
    //  // and using its current properties, going to emit an updated hash
    //  // with a new EmailId.
    //  let h: string = "";
    //  if (permit.length > 0) h += "&permit=" + permit;
    //  return h.substring(1);
    //}

    ToHash(): string
    {
      let h: string = "";
      if (this.Permit.length > 0) h += "&permit=" + this.Permit;
      if (this.ApplicationNumber.length > 0) h += "&application=" + this.ApplicationNumber;
      if (this.ContractorId.length > 0) h += "&contractor=" + this.ContractorId;
      if (this.CashierId.length > 0) h += "&cashierid=" + this.CashierId;
      if (h.length > 0) h = "#" + h.substring(1);
      return h;
    }

  }


}