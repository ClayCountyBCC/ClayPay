using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
namespace ClayPay.Models.Balancing
{
  public class AssignedOnlinePayment
  {
    public string CasheirId { get; set; }
    public string TrasnactionId { get; set; }
    public DateTime TransactionDate { get; set; }
    public string AssignedTo { get; set; }
    public DateTime DateAssigned { get; set; }

    public AssignedOnlinePayment()
    {


    }

    public static List<AssignedOnlinePayment> Get()
    {
      var query = @"      
        USE WATSC;
        SELECT 
          CCO.CashierId,
          CCO.PayID,
          CCO.AssocKey,
          ISNULL(C.Name,C.CoName) [Info],
          'cc_online' PaymentTypeValue,
          CP.AmtTendered AmountTendered,
          CP.TransactionId
        FROM ccOnlineccPaymentsToProcess CCO
        INNER JOIN ccCashierPayment CP CI.Otid = CP.OTid
        INNER JOIN ccCashier C ON C.OTid = CP.OTid AND CP.CashierId = C.CashierId
        WHERE CCO.DateAssigned > DATEADD(HOUR,-24,GETDATE())
          AND DateAssigned IS NULL
           ";
      return Constants.Get_Data<AssignedOnlinePayment>(query);
    }

    public static bool AssignPaymentToUser(string CashierId, string UserName)
    {
      var param = new DynamicParameters();
      param.Add("@CasheirId", CashierId);
      param.Add("@Username", UserName);
      var query = @"
      
        USE WATSC;
        UPDATE ccOnlineccPayments
        SET DateAssigned = @NOW, AssignedTo = @Username
        WHERE 
           ";
      return Constants.Save_Data(query, param);
    }
  }
}