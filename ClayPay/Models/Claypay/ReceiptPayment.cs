﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Claypay
{
  public class ReceiptPayment
  {
    public string CashierId{ get; set; }
    public int PayId { get; set; }
    public int OTId { get; set; }
    public string Info { get; set; }
    public DateTime TransactionDate { get; set; }
    public string PaymentType { get; set; }
    public string PaymentTypeString
    {
      get
      {
        switch(PaymentType.Trim())
        {
          case "cc_online":
          case "cc_cashier":
          case "CC On":
            return "Credit Card";
          case "CA":
            return "Cash";
          case "CK":
            return "Check";
          case "IFCR":
            return "Impact Fee Credit";
          case "IFEX":
            return "Impact Fee Exemption";
          case "IFWS":
            return "School Impact Fee Waiver";
          case "IFWR":
            return "Road Impact Fee Waiver";
          // should never get here
          default:
            return "";
        }
        
      }
    }
    public decimal AmountApplied { get; set; }
    public decimal AmountTendered { get; set; }
    public decimal ChangeDue;
    public decimal ConvenienceFeeAmount 
    {
      get
      {
        switch(PaymentTypeString.Trim().ToLower())
        {
          case "cc_online":
          case "cc_cashier":
          case "cc on":
            return Convert.ToDecimal(PaymentResponse.GetFee(AmountTendered));
          default:
            return 0;
        }
      }
    }
    public string TransactionId { get; set; }
  
    
    public ReceiptPayment()
    {

    }

    public static List<ReceiptPayment> Get(string CashierId)
    {
      var param = new DynamicParameters();
      param.Add("@cashierId", CashierId);
      var query = @"
        USE WATSC;
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


      return Constants.Get_Data<ReceiptPayment>(query, param);

    }

    public void SetConvenienceFeeAmount()
    {
      
    }
  }
}