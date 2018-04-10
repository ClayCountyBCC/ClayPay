using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Text;
using System.Web.Http;
using System.Net;
using System.IO;
using System.Data;

namespace ClayPay.Models
{
  public class PaymentResponse
  {
    public string UniqueId { get; set; }
    public DateTime TimeStamp { get; set; }
    public string CashierId { get; set; }
    public long OTId { get; set; }
    public string TimeStamp_Display
    {
      get
      {
        return TimeStamp.ToShortDateString();
      }
    }
    public decimal Amount { get; set; }
    public Constants.PaymentTypes PaymentType { get; set; }
    public string ErrorText { get; set; } = "";
    public string ConvFee { get; set; }
    public bool UseProduction { get; set; }

    public PaymentResponse(decimal Amount,
     Constants.PaymentTypes PaymentType,
     bool UseProduction)
    {
      this.Amount = Amount;
      this.PaymentType = PaymentType;
      this.UseProduction = UseProduction;
    }

    public static string GetFee()
    {
      var pr = new PaymentResponse(100, Constants.PaymentTypes.Building, true);
      return pr.CalcFee();
    }

    private string CalcFee()
    {
      try
      {
        string result = PostToMFC(BuildFeeURL());
        ProcessResults(result);
        return ConvFee;
      }catch(Exception ex)
      {
        Constants.Log(ex);
        return "";
      }
    }

    public static PaymentResponse PostPayment(CCData ccd, string ipAddress)
    {
      try
      {
        var pr = new PaymentResponse(ccd.Total, Constants.PaymentTypes.Building, Constants.UseProduction());
        if (pr.Post(ccd, ipAddress))
        {

          return pr;
        }
        else
        {
          return null;
        }
      }
      catch(Exception ex)
      {
        Constants.Log(ex);
        return null;
      }

    }

    private bool Post(CCData ccd, string ipAddress)
    {
      try
      {
        string result = PostToMFC(BuildURL(ccd, ipAddress));
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
              ErrorText = val[1];
              break;
            case "CONV_FEE":
              ConvFee = (val[1]) + "%";
              break;

            default:
              break;
          }
        }
      }
      catch(Exception ex)
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

    //private static string BuildURL(Constants.PaymentTypes PTypes = Constants.PaymentTypes.Building)
    //{
    //  bool Prod = Constants.UseProduction();
    //  var sb = new StringBuilder();
    //  sb.Append("https://www.myfloridacounty.com/myflc-pay/OpenPay.do?UserID=");
    //  if (Prod)
    //  {
    //    sb.Append((int)Constants.Users.Prod_User);
    //  }
    //  else
    //  {
    //    sb.Append((int)Constants.Users.Test_User);
    //  }

    //  sb.Append("&serviceID=");
    //  switch (PTypes)
    //  {
    //    case Constants.PaymentTypes.Building:
    //      if (Prod)
    //      {
    //        sb.Append((int)Constants.Services.Prod_Building_Service);
    //      }
    //      else
    //      {
    //        sb.Append((int)Constants.Services.Test_Building_Service);
    //      }

    //      break;

    //    case Constants.PaymentTypes.Rescue:
    //      if (Prod)
    //      {
    //        sb.Append((int)Constants.Services.Prod_Rescue_Service);
    //      }
    //      else
    //      {
    //        sb.Append((int)Constants.Services.Test_Rescue_Service);
    //      }

    //      break;
    //  }

    //  return sb.ToString();
    //}

    private string BuildFeeURL()
    {
      var sb = new StringBuilder();
      sb.Append(BuildProdURL())
        .Append("&PAYMENT_AMOUNT=100")
        .Append("&mode=CF");
      return sb.ToString();
    }

    private string BuildURL(CCData CC, string ipAddress)
    {      
      var sb = new StringBuilder();
      try
      {
        sb.Append((this.UseProduction) ? BuildProdURL() : BuildTestURL());
        sb.Append("&BILL_TO_FNAME=").Append(CC.FirstName);
        sb.Append("&BILL_TO_LNAME=").Append(CC.LastName); ;
        sb.Append("&CARD_NUMBER=").Append(CC.CardNumber);
        sb.Append("&CARD_TYPE=").Append(CC.CardType);
        sb.Append("&CARD_EXP_MONTH=").Append(CC.ExpMonth);
        sb.Append("&CARD_EXP_YEAR=").Append(CC.ExpYear);
        sb.Append("&CVV=").Append(CC.CVVNumber);
        sb.Append("&ZIPCODE=").Append(CC.ZipCode);
        sb.Append("&PAYMENT_AMOUNT=").Append(CC.Total);
        sb.Append("&mode=AS");
        sb.Append("&*EmailAddress=").Append(CC.EmailAddress);
        sb.Append("&*IPAddress=").Append(ipAddress);
        return sb.ToString();
      }
      catch(Exception ex)
      {
        Constants.Log(ex, sb.ToString());
        return "";
      }
    }

    private string BuildProdURL()
    {
      var sb = new StringBuilder();
      sb.Append("https://www.myfloridacounty.com/myflc-pay/OpenPay.do?UserID=");
      sb.Append(Properties.Resources.Prod_User).Append("&serviceID=");
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
      sb.Append("https://test.myfloridacounty.com/myflc-pay/OpenPay.do?UserID=");
      sb.Append(Properties.Resources.Test_User).Append("&serviceID=");
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

    public bool Save(CCData ccd, string ipAddress)
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@cId", dbType: DbType.String, size: 9, direction: ParameterDirection.Output);
      dbArgs.Add("@otId", dbType: DbType.Int64, direction: ParameterDirection.Output);
      dbArgs.Add("@PayerName", ccd.FirstName + " " + ccd.LastName);
      dbArgs.Add("@Total", ccd.Total);
      dbArgs.Add("@TransId", this.UniqueId);
      dbArgs.Add("@ItemIds", ccd.ItemIds);
      //DECLARE @cId VARCHAR(9) = NULL;
      //DECLARE @otId int = NULL;
      string query = @"
        DECLARE @now DATETIME = GETDATE();
        
        BEGIN TRANSACTION;

        BEGIN TRY
          EXEC dbo.prc_upd_ccNextCashierId @cId OUTPUT;
          
          EXEC dbo.prc_ins_ccCashier 
            @OTId = @otId OUTPUT, 
            @CashierId = @cId, 
            @LstUpdt = NULL, 
            @Name = @PayerName,
            @TransDt = @now;

          EXEC dbo.prc_upd_ccCashierX
            @OTId = @otId,
            @Name = @PayerName,
            @CoName = '',
            @Phone = '',
            @Addr1 = '',
            @Addr2 = '',
            @NTUser='claypay';

          EXEC dbo.prc_upd_ccCashierPmt 
            @PayId = 0,
            @OTId = @otId, 
            @PmtType ='CC On',
            @AmtApplied = @Total,
            @AmtTendered = @Total, 
            @PmtInfo = @PayerName,
            @CkNo = @TransId;

          UPDATE ccCashierItem 
            SET OTId = @otId, CashierId = @cId
            WHERE itemId IN @ItemIds

          -- Add the ccGU rows
          INSERT INTO ccGU (OTId, CashierId, ItemId, PayID, CatCode, TransDt)
          SELECT DISTINCT CCI.OTId, CCI.CashierId, CCI.ItemId, NULL, CCI.CatCode, GETDATE()
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          WHERE CCI.OTId = @OTId

          -- Add the ccGUItem rows
          INSERT INTO ccGUItem (GUID, Account, Amount, Type)
          SELECT 
            GU.GUId,
            GL.Fund + '*' + GL.Account + '**' AS Account,
          FORMAT(
          CASE GL.[Percent] 
            WHEN 0.05 THEN
              CASE WHEN CAST(ROUND((Total * 99.9) / 100, 2) + (ROUND((Total * 0.05) / 100, 2)*2) AS MONEY) > CCI.Total THEN
                CASE WHEN Fund <> '001' THEN 
                  ROUND((Total * GL.[Percent]) / 100, 2) - .01
                ELSE 
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            WHEN 50 THEN
              CASE WHEN (ROUND((Total * GL.[Percent]) / 100, 2)*2) <> CCI.Total THEN
                CASE WHEN GL.Account = '322100' THEN
                    ROUND((Total * GL.[Percent]) / 100, 2) + (CCI.Total -  (ROUND((Total * GL.[Percent]) / 100, 2)*2))
                ELSE
                  ROUND((Total * GL.[Percent]) / 100, 2) 
                END
              ELSE
                ROUND((Total * GL.[Percent]) / 100, 2) 
              END
            ELSE
              ROUND(Total / (100 / GL.[Percent]), 2) 
            END
          , 'N2') AS Amount,
            GL.Type
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          INNER JOIN ccGU GU ON CCI.OTId = GU.OTId AND CCI.ItemId = GU.ItemId
          WHERE CCI.OTId = @OTId
          ORDER BY CCI.ItemId, GL.Type
      
        END TRY
        BEGIN CATCH
          IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        END CATCH;
        
        IF @@TRANCOUNT > 0
          COMMIT TRANSACTION;";
      try
      {
        var i = Constants.Exec_Query(query, dbArgs);
        CashierId = dbArgs.Get<string>("@cId");
        OTId = dbArgs.Get<Int64>("@otId");
        return (i != -1);
      }
      catch(Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }    

    public bool Finalize()
    {
      var dbArgs = new Dapper.DynamicParameters();
      dbArgs.Add("@cId", CashierId);
      dbArgs.Add("@otId", OTId);
      //DECLARE @cId VARCHAR(9) = NULL;
      //DECLARE @otId int = NULL;

      string query = @"
          -- Handle Clearance Sheet Holds
          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          INNER JOIN (
          SELECT DISTINCT 
            CASE CCI.Assoc
              WHEN 'IF' THEN '1IMP'
            ELSE 
              CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
                CASE CCI.CatCode
                  WHEN 'REV' THEN '1REV'
                  WHEN 'REVF' THEN '0REV'
                  WHEN 'CLA' THEN '1SWF'
                ELSE ''
                  END
              ELSE
                ''
              END
            END AS HldCd,
            CASE WHEN CCI.Assoc = 'IF' THEN ''
            ELSE CCI.AssocKey
            END AS PermitNo,
            CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
            ELSE ''
            END AS Clrsht
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          WHERE CCI.OTId = @otId
          AND CCI.Assoc='IF'
          ) AS C ON H.Clrsht=C.Clrsht AND H.HldCd = C.HldCd
          WHERE C.HldCd <> '' AND C.Clrsht <> '';

          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          INNER JOIN (
          SELECT DISTINCT 
            CASE CCI.Assoc
              WHEN 'IF' THEN '1IMP'
            ELSE 
              CASE WHEN CCI.HoldId IS NULL OR CCI.HoldID = 0 THEN
                CASE CCI.CatCode
                  WHEN 'REV' THEN '1REV'
                  WHEN 'REVF' THEN '0REV'
                  WHEN 'CLA' THEN '1SWF'
                ELSE ''
                  END
              ELSE
                ''
              END
            END AS HldCd,
            CASE WHEN CCI.Assoc = 'IF' THEN ''
            ELSE CCI.AssocKey
            END AS PermitNo,
            CASE WHEN CCI.Assoc = 'IF' THEN CCI.AssocKey
            ELSE ''
            END AS Clrsht
          FROM ccCashierItem CCI
          INNER JOIN ccGL GL ON CCI.CatCode = GL.CatCode
          WHERE CCI.OTId = @otId
          AND CCI.Assoc='IF'
          ) AS C ON H.PermitNo=C.PermitNo AND H.HldCd = C.HldCd
          WHERE C.HldCd <> '' AND C.PermitNo <> '';

          -- Handle HoldIds
          UPDATE H
            SET HldDate = GETDATE(), 
              HldIntl ='claypay', 
              HldInput =@cId
          FROM bpHold H
          WHERE HoldId IN 
            (SELECT DISTINCT HoldId 
              FROM ccCashierItem 
              WHERE HoldId > 0 AND OTId=@otId);

          -- Issue Associated Permits
          UPDATE bpASSOC_PERMIT
          SET IssueDate=GETDATE()
          WHERE IssueDate IS NULL AND
            PermitNo IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otId AND
              Assoc NOT IN ('AP', 'CL') AND
              LEFT(AssocKey, 1) NOT IN ('1', '7') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@otId) AND
                CashierId IS NULL AND Total > 0) = 0);

          -- Update Contractor Payments
          DECLARE @ExpDt VARCHAR(20) = (SELECT TOP 1 Description
          FROM clCategory_Codes WHERE Code = 'dt' AND Type_Code = '9');
          
          UPDATE clContractor
          SET IssueDt=GETDATE(), ExpDt=@ExpDt, BlkCrdExpDt=@ExpDt
          WHERE ContractorCd NOT LIKE 'AP%' AND 
            ContractorCd IN 
            (SELECT DISTINCT AssocKey 
              FROM ccCashierItem 
              WHERE OTId=@otId AND
                Assoc='CL' AND
                CatCode IN ('CLLTF', 'CLFE', 'CIAC', 'LFE') AND
              (SELECT ISNULL(SUM(Total), 0) AS Total 
                FROM ccCashierItem
                WHERE AssocKey IN (SELECT DISTINCT AssocKey 
                                  FROM ccCashierItem 
                                  WHERE OTId=@OTId) AND
                CashierId IS NULL AND Total > 0) = 0);";
      try
      {
        var i = Constants.Exec_Query(query, dbArgs);
        return (i != -1);
      }
      catch (Exception ex)
      {
        Constants.Log(ex, query);
        return false;
      }
    }

  }
}