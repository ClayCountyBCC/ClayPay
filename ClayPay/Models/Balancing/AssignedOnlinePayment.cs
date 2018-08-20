using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;
namespace ClayPay.Models.Balancing
{
  public class AssignedOnlinePayment
  {
    public string CashierId { get; set; } = "";
    public DateTime TransactionDate { get; set; } = DateTime.MinValue;
    public string AssignedTo { get; set; } = "";
    public decimal AmountApplied { get; set; } = 0;
    public DateTime DateAssigned { get; set; } = DateTime.MinValue;

    public AssignedOnlinePayment()
    {


    }

    public static List<AssignedOnlinePayment> Get()
    {
      var query = @"      
        USE WATSC;
        DECLARE @MinDate DATE = CAST('2018-7-27' AS DATE);

        SELECT 
          C.CashierId, 
          C.TransDt TransactionDate,
          CP.AmtApplied AmountApplied,
          AssignedTo,
          DateAssigned
        FROM ccCashierPayment CP
        INNER JOIN ccCashier C ON CP.OTid = C.OTId
        LEFT OUTER JOIN ccOnlineccPaymentsToProcess OP ON OP.CashierId = C.CashierID
        WHERE CP.PmtType IN ('CC On', 'cc_online', 'CC Online')
          AND C.TransDt > @MinDate
          AND (OP.CashierId IS NULL
          OR OP.DateAssigned > DATEADD(HOUR,-3,GETDATE()))
        ORDER BY C.TransDt ASC
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


    public static string AssignPaymentToUser(string CashierId, string UserName)
    {
      var cashierIdCheck = CashierIdIsAssigned(CashierId);
      if(cashierIdCheck == CashierId)
      {
        return "CashierId has already been assigned.";
      }
      else if(cashierIdCheck.Length > 0 && cashierIdCheck != CashierId)
      {
        return cashierIdCheck;
      }
      
      var param = new DynamicParameters();
      param.Add("@CashierId", CashierId);
      param.Add("@Username", UserName);
      var query = @"
      
        USE WATSC;

            INSERT INTO ccOnlineccPaymentsToProcess
            (CashierId, AssignedTo, DateAssigned)
            VALUES
            (@CashierId, @Username, GETDATE())
            
           ";
      var i = Constants.Exec_Query(query, param);
      if (i > 0)
      {
        return "";
      }
      else
      {
        return "There was an issue assigning the payment.";
      }
    }


    public static string ChangeAssignedTo(string CashierId, string UserName)
    {
      var cashierIdCheck = CashierIdIsAssigned(CashierId);
      if (cashierIdCheck.Length == 0)
      {
        return "CashierId is has not been assigned";
      }
      else if (cashierIdCheck.Length > 0 && cashierIdCheck != CashierId)
      {
        return cashierIdCheck;
      }
      var param = new DynamicParameters();
      param.Add("@CashierId", CashierId);
      param.Add("@Username", UserName);
      var query = @"
      
        USE WATSC;
        UPDATE ccOnlineccPaymentsToProcess
        SET DateAssigned = GETDATE(), AssignedTo = @Username
        WHERE CashierId = @CashierId";

      var i = Constants.Exec_Query(query, param);
      if (i > 0)
      {
        return "";
      }
      else
      {
        return "There was an issue re-assigning the payment.";
      }
    }

    public static string CashierIdIsAssigned(string CashierId)
    {
      var param = new DynamicParameters();
      param.Add("@CashierId", CashierId);
      var query = @"
      
        USE WATSC;
        SELECT CashierId
        FROM ccOnlineccPaymentsToProcess
        WHERE CashierId = @CashierId
        ";
      try
      {
        return Constants.Get_Data<string>(query, param).DefaultIfEmpty("").First();

      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return "Checing CashierId failed. Could not be assigned";
      }

    }
  }
}