using System;
using System.Collections.Generic;
using Dapper;
using System.Linq;
using System.Web;

namespace ClayPay.Models.Balancing
{
  public class CashierDetailData
  {
    public string CashierId { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.MinValue;
    public string Name { get; set; } = "";
    public decimal AmountApplied { get; set; } = decimal.MinusOne;
    public string PaymentType { get; set; } = "";
    public string CheckNumber { get; set; } = "";
    public string TransactionNumber { get; set; } = "";
    public string Info { get; set; } = "";
    public string AssocKey { get; set; } = "";
    public decimal ChargeTotal { get; set; } = decimal.MinusOne;

    public CashierDetailData()
    {
    }

    public static List<CashierDetailData> Get(DateTime TransactionDate)
    {
      // this will need to get fleshed out a bit more. There may need to be a custom model
      // created for this data type.
      // This has been changed from the current Cashier Detail report to add
      // the AssocKey (which is the permit number / contractor number / etc)
      // and the total charges for that AssocKey and Cashier Id.
      var param = new DynamicParameters();
      param.Add("@TransactionDate", TransactionDate);
      string sql = @"
          
        EXEC prc_claypay_cashier_detail_data @TransactionDate

      ";
      return Constants.Get_Data<CashierDetailData>(sql, param);
    }
  }
}