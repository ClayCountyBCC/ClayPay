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
        DECLARE @MinDate DATE = CAST('2018-07-19' AS DATE);

        WITH AssignedCashierIds (CashierId) AS (
          SELECT CashierId FROM ccOnlineCCPaymentsToProcess OP
          WHERE DateAssigned > DATEADD(HOUR,-3,GETDATE())
          )


        SELECT DISTINCT
          C.CashierId, 
          ISNULL(C.[Name], C.CoName) [Info], 
          L.Code [PaymentType], 
          ISNULL(CP.TransactionId, CkNo) [TransactionID], 
          TransDt,
          AssignedTo,
          DateAssigned
         FROM ccCashierPayment CP
        INNER JOIN CCCASHIER C ON C.OTId = CP.OTid
        INNER JOIN ccCashierItem CI ON CI.OTId = CP.OTid
        INNER JOIN ccLookUp L ON UPPER(LEFT(CP.PmtType,5)) = UPPER(LEFT(L.Code,5))
        LEFT OUTER JOIN ccOnlineccPaymentsToProcess OP ON OP.CashierId = C.CashierID
        WHERE CP.PmtType IN ('CC On', 'cc_online')
          AND (C.TransDt > @MinDate
          OR (C.CashierId IN (SELECT CashierId FROM AssignedCashierIds)))
           ";

      try
      {
        var i = Constants.Get_Data<AssignedOnlinePayment>(query);
        return i;

      }catch(Exception ex)
      {
        Constants.Log(ex, query);
        return new List<AssignedOnlinePayment>();
      }
    }

    public static bool AssignPaymentToUser(string CashierId, string UserName)
    {
      var param = new DynamicParameters();
      param.Add("@CashierId", CashierId);
      param.Add("@Username", UserName.Replace("CLAYBCC\\", ""));
      var query = @"
      
        USE WATSC;
        BEGIN TRY
          INSERT INTO ccOnlineccPaymentsToProcess
          (CashierId, AssignedTo, DateAssigned)
          VALUES
          (@CashierId, @Username, GETDATE())
          END TRY
        BEGIN CATCH
        END CATCH
           ";
      return Constants.Save_Data(query, param);
    }

    public static bool ChangeAssignedTo(string CashierId, string UserName)
    {
      var param = new DynamicParameters();
      param.Add("@CashierId", CashierId);
      param.Add("@Username", UserName);
      var query = @"
      
        USE WATSC;
        UPDATE ccOnlineccPaymentsToProcess
        SET DateAssigned = GETDATE(), AssignedTo = @Username
        WHERE CashierId = @CashierId
           ";
      return Constants.Save_Data(query, param);
    }
  }
}