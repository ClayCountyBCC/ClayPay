using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Web.Http;
using System.Net;
using System.IO;
using System.Data;
using Dapper;
using ClayPay.Models.Claypay;
using System.Web.WebPages;

namespace ClayPay.Models
{
  public class PaymentResponse
  {
    public string UniqueId { get; set; }
    public decimal Amount { get; set; }
    public Constants.PaymentTypes PaymentType { get; set; }
    public string ErrorText { get; set; } = ""; //
    public string ConvFee { get; set; } // function GetConvenienceFee();
    public bool UseProduction { get; set; } //
    public DateTime TimeStamp { get; set; } //
    public string CashierId { get; set; } //
    public long OTId { get; set; } //
    public string TimeStamp_Display
    {
      get
      {
        return TimeStamp.ToShortDateString();
      }
    } 

    public PaymentResponse(decimal Amount,
     Constants.PaymentTypes PaymentType,
     bool UseProduction)
    {
      this.Amount = Amount;
      this.PaymentType = PaymentType;
      this.UseProduction = UseProduction;
    }

    public string CalcFee(decimal Amount)
    {
      try
      {
        string result = PostToMFC(BuildFeeURL(Amount));
        ProcessResults(result);

        return ConvFee;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return "";
      }
    }

    public static PaymentResponse PostPayment(CCPayment ccd, string ipAddress/* = ""*/)
    {
      try
      {
        var pr = new PaymentResponse(ccd.Amount, Constants.PaymentTypes.Building, Constants.UseProduction());
        if (pr.Post(ccd, ipAddress))
        {
          //pr.ConvFeeAmount = Decimal.Parse(PaymentResponse.GetFee(ccd.Amount));
          return pr;
        }
        else
        {
          return null;
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return null;
      }

    }

    private bool Post(CCPayment ccd, string ipAddress)
    {
      try
      {
        string result = "";


        if (ccd.TransactionId != null && ccd.TransactionId.Length > 0)
        {
          NewTransaction.TimingDates.Send_CCData_Settle_Transmit = DateTime.Now;

          result = PostToMFC(BuildSettlePaymentURL(ccd));

          NewTransaction.TimingDates.Return_CCData_Settle_Transmit = DateTime.Now;
        }
        else
        {
          NewTransaction.TimingDates.Send_CCData_Authorize_Transmit = DateTime.Now;

          result = PostToMFC(BuildAuthorizePaymentURL(ccd, ipAddress));

          NewTransaction.TimingDates.Return_CCData_Authorize_Transmit = DateTime.Now;

        }

        ProcessResults(result);
        return true;
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
        return false;
      }
    }

    private void ProcessResults(string result)
    {
      try
      {
        string[] results = result.Split(new string[] { "|" }, StringSplitOptions.None);
        foreach (string r in results)
        {
          string[] val = r.Split(new string[] { "=" }, StringSplitOptions.None);
          switch (val[0].ToUpper())
          {
            case "RC":
              break;
            case "PAYMENTUNIQUEID":
              UniqueId = val[1];
              break;
            case "TRANSDATESTAMP":
              TimeStamp = DateTime.Parse(val[1]);
              break;
            case "MESSAGE":
            case "ERRORMSG":
              if ((!UseProduction && val[1].Substring(1, 6) != "MFC-01") || UseProduction)
              {
                ErrorText = val[1];
              }
              break;
            case "CONV_FEE":
              ConvFee = (val[1]);
              break;
            default:
              break;
          }
        }
      }
      catch (Exception ex)
      {
        Constants.Log(ex);
      }
    }

    private static string PostToMFC(string url)
    {
      if (url.Length == 0)
      {
        Constants.Log("Empty url in PostToMFC", "", "", "");
        return "";
      }
      var req = WebRequest.Create(url);
      var resp = req.GetResponse();
      try
      {
        using (var reader = new StreamReader(resp.GetResponseStream(), encoding: Encoding.UTF8))
        {
          return reader.ReadToEnd();
        }
      }
      catch (Exception e)
      {
        Constants.Log(e);
        return "";
      }

    }

    private string BuildFeeURL(decimal Amount)
    {
      var sb = new StringBuilder();
      sb.Append(BuildProdURL())
        .Append("&PAYMENT_AMOUNT=")
        .Append(Amount.ToString("F2"))
        .Append("&mode=CF");
      return sb.ToString();
    }

    private string BuildAuthorizePaymentURL(CCPayment CC, string ipAddress)
    {

      var sb = new StringBuilder();
      try
      {
        sb.Append((this.UseProduction) ? BuildProdURL() : BuildTestURL())
          .Append("&BILL_TO_FNAME=").Append(CC.FirstName)
          .Append("&BILL_TO_LNAME=").Append(CC.LastName)
          .Append("&CARD_NUMBER=").Append(CC.CardNumber)
          .Append("&CARD_TYPE=").Append(CC.CardType)
          .Append("&CARD_EXP_MONTH=").Append(CC.ExpMonth)
          .Append("&CARD_EXP_YEAR=").Append(CC.ExpYear)
          .Append("&CVV=").Append(CC.CVVNumber)
          .Append("&ZIPCODE=").Append(CC.ZipCode)
          .Append("&PAYMENT_AMOUNT=").Append(CC.Amount + (CC.Amount * Convert.ToDecimal(ConvFee)))
          .Append("&mode=A")
          .Append("&*EmailAddress=").Append(CC.EmailAddress)
          .Append("&*IPAddress=").Append(ipAddress);
        return sb.ToString();
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sb.ToString());
        return "";
      }
    }

    private string BuildSettlePaymentURL(CCPayment CC)
    {

      var sb = new StringBuilder();
      try
      {
        sb.Append((this.UseProduction) ? BuildProdURL() : BuildTestURL())
          .Append("&PAYMENT_AMOUNT=").Append(CC.Amount + Convert.ToDecimal(CC.ConvenienceFee))
          .Append("&CONV_FEE=")
          .Append("&PaymentUniqueID=").Append(CC.TransactionId)
          .Append("&mode=S");
        return sb.ToString();
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sb.ToString());
        return "";
      }
    }

    private string BuildProdURL()
    {
      var sb = new StringBuilder();
      sb.Append("https://www.myfloridacounty.com/myflc-pay/OpenPay.do?UserID=")
      .Append(Properties.Resources.Prod_User).Append("&serviceID=");
      switch (PaymentType)
      {
        case Constants.PaymentTypes.Building:
          sb.Append(Properties.Resources.Prod_Building_Service);
          break;

        case Constants.PaymentTypes.Rescue:
          sb.Append(Properties.Resources.Prod_Rescue_Service);
          break;
      }

      return sb.ToString();
    }

    private string BuildTestURL()
    {
      var sb = new StringBuilder();
      sb.Append("https://test.myfloridacounty.com/myflc-pay/OpenPay.do?UserID=")
        .Append(Properties.Resources.Test_User)
        .Append("&serviceID=");
      switch (PaymentType)
      {
        case Constants.PaymentTypes.Building:
          sb.Append(Properties.Resources.Test_Building_Service);
          break;

        case Constants.PaymentTypes.Rescue:
          sb.Append(Properties.Resources.Test_Rescue_Service);
          break;
      }
      return sb.ToString();
    }

    // TODO: need to use this for saving all types of payments, not just cc payments


  }
}