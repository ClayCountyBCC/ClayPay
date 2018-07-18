using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ClientResponse
  {
    public int PayId { get; set; }
    public int OTId { get; set; }
    public string PaymentTypeString { get; set; }
    public string TimeStamp { get; set; } = DateTime.Now.ToString();
    public string CashierId { get; set; } = "";
    public string CreditCardTransactionId { get; set; } = "";
    string Payer_First_Name { get; set; } = "";
    string Payer_Last_Name { get; set; } = "";
    public List<Charge> ChargeList { get; set; } = new List<Charge>();
    private List<Payment> TransactionPayments { get; set; }
    public class ReceiptPayment
    { 
      int PayId;
      string Payment_Type_string;
      decimal Amount_Applied;
      decimal Amount_Tendered;
      DateTime Transaction_Date;
    }
    public List<ReceiptPayment> Receipt_Payments { get; set; }
    public decimal AmountPaid { get; set; } = 0;
    private decimal ConvenienceFeeAmount { get; set; } = 0;
    public decimal ChangeDue { get; set; } = 0; // only applicable in Cash payments.


    public List<string> Errors { get; set; } = new List<string>();
    public List<string> PartialErrors { get; set; } = new List<string>();

    public ClientResponse(string cashierid, string transId, List<string> partErr, decimal AmtApplied, decimal change, decimal convFeeAmount = 0)
    {
      CashierId = cashierid;
      PartialErrors = partErr;
      AmountPaid = AmtApplied;
      ChangeDue = change;
      ConvenienceFeeAmount = convFeeAmount;

      var payments = new List<ReceiptPayment>();
      
    }
    // If you've got any errors, you won't need anything else.
    public ClientResponse(List<string> errors, string transactionId = null)
    {
      if (transactionId != null)
      {
        CreditCardTransactionId = transactionId;
      }
      Errors = errors;
    }


    public void ValidateCharges(NewTransaction transaction)
    {

    }

    public void  GetReceiptPayments()
    {
      var param = new DynamicParameters();
      param.Add("@cashierId", CashierId);
      var query = @"
        WITH VOID_CASHEIRIDS(CashierId) AS (
        SELECT DISTINCT LEFT(CASHIERID,9)
        FROM ccCashier
        WHERE RIGHT(CashierId,1) = 'V')

        SELECT DISTINCT PayId, PmtType, AmtTendered, AmtApplied,
        C.Name, C.TransDt, C.CoName
        FROM ccCashierPayment CP
        INNER JOIN ccCashier C ON C.OTId = CP.OTid
        INNER JOIN ccCashierItem CI ON CI.CashierId = C.CashierId

        WHERE LEFT(C.CashierId,9) = @cashierId
            AND LEFT(C.CashierId,9) NOT IN (SELECT CashierId FROM VOID_CASHEIRIDS)";


      Receipt_Payments = Constants.Get_Data<ReceiptPayment>(query, param);

    }
  }
}