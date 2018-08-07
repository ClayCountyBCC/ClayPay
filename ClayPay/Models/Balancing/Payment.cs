using Dapper;
using System.Linq;
using System;
using System.Collections.Generic;
using ClayPay.Models;

namespace ClayPay.Models.Balancing
{
  public class Payment
  {
    public DateTime TransactionDate { get; set; }
    public string CashierId { get; set; }
    public long OTid { get; set; }
    public string Name { get; set; }
    public decimal Total { get; set; }
    //public bool Editable { get; set; } = false;
    public string Error { get; set; } = "";

    public Payment()
    {

    }
    public Payment(string er)
    {
      Error = er;
    }


    // Without the ability to void payments, this will become unnecessary after a time
    public static List<Payment> GetPayments(
      DateTime DateToBalance,
      string PaymentType
      )
    {
      // Claypay.Payment.payment_type payment_type
      //List<string> PaymentTypes = new List<string>();
      //switch (payment_type)
      //{
      //  case Claypay.Payment.payment_type.cash:
      //    PaymentTypes.Add("CA");
      //    break;
      //  case Claypay.Payment.payment_type.check:
      //    PaymentTypes.Add("CK");
      //    break;
      //  case Claypay.Payment.payment_type.credit_card_public:
      //    PaymentTypes.Add("CC_ONLINE");
      //    PaymentTypes.Add("CC ON");
      //    PaymentTypes.Add("CC ONLINE");
      //    break;
      //  case Claypay.Payment.payment_type.credit_card_cashier:
      //    PaymentTypes.Add("CC_CASHIER");
      //    PaymentTypes.Add("VISA");
      //    PaymentTypes.Add("MC");
      //    PaymentTypes.Add("AMEX");
      //    PaymentTypes.Add("DISC");
      //    break;
      //  case Claypay.Payment.payment_type.impact_fee_credit:
      //    PaymentTypes.Add("IFCR");
      //    break;
      //  case Claypay.Payment.payment_type.impact_fee_exemption:
      //    PaymentTypes.Add("IFEX");
      //    break;
      //  case Claypay.Payment.payment_type.impact_waiver_school:
      //    PaymentTypes.Add("IFWS");
      //    break;
      //  case Claypay.Payment.payment_type.impact_waiver_road:
      //    PaymentTypes.Add("IFWR");
      //    break;
      //  default:
      //    return new List<Payment> { new Payment("Invalid Payment Type.") };
      //}
      var param = new DynamicParameters();
      param.Add("@DateToBalance", DateToBalance);
      param.Add("@PaymentType", PaymentType.ToUpper());
      //param.Add("@PaymentType", PaymentType);

      var sql = @"
      USE WATSC;

      WITH PaymentDetail AS (
        SELECT DISTINCT
          C.TransDt TransactionDate,
          C.CashierId,
          C.Name
        FROM ccCashierPayment CP
        INNER JOIN ccCashier C ON CP.OTid = C.OTId
        WHERE CAST(C.TransDt AS DATE) = CAST(@DateToBalance AS DATE)
      ), PaymentTotals AS (
      SELECT 
        ISNULL(C.CashierId, '') CashierId ,
        SUM(AmtApplied) Total
      FROM ccCashierPayment CP
      LEFT OUTER JOIN CCCASHIER C ON CP.OTId = C.OTId
      WHERE CAST(C.TransDt AS DATE) = CAST(@DateToBalance AS DATE)
        AND UPPER(CP.PmtType) = @PaymentType
      GROUP BY C.CashierId
        WITH ROLLUP
      )

      SELECT
        PT.CashierId,
        ISNULL(PD.Name, 'Total Amount') Name,
        ISNULL(PD.TransactionDate, @DateToBalance) TransactionDate,
        PT.Total
      FROM PaymentTotals PT
      LEFT OUTER JOIN PaymentDetail PD ON Pt.CashierId = PD.CashierId
      ORDER BY PT.Total;";
      try
      {

        var payments = Constants.Get_Data<Payment>(sql, param);

        return payments;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return new List<Payment>();
      }
    }
  }
}