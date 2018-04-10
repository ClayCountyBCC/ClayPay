namespace clayPay
{


  interface IAppType
  {
    Label: string;
    Value: string;
  }

  export class AppType implements IAppType
  {
    constructor(public Label: string, public Value: string)
    {

    }
  }

}