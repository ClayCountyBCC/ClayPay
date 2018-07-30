namespace Balancing
{
  interface IDJournalLog
  {
    DJournalDate: Date;
    FinalizedOn: Date;
    CreatedBy: string;
    IsCreated: boolean;


  }

  export class DJournalLog implements IDJournalLog
  {
    public DJournalDate: Date;
    public FinalizedOn: Date;
    public CreatedBy: string = "";
    public IsCreated: boolean = false;

    constructor()
    {

    }
  }

}