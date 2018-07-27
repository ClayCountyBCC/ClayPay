using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Dapper;

namespace ClayPay.Models.Balancing
{
  public class DJournalLog
  {
    public DateTime DJournalDate { get; set; } = DateTime.MinValue.Date;
    public DateTime FinalizedOn { get; set; } = DateTime.MinValue;
    public string CreatedBy { get; set; } = "";
    public bool IsCreated { 
      get
      {
        return DJournalDate != DateTime.MinValue.Date;
      }
    }

    public DJournalLog()
    {
      
    }

    public static int Create(DateTime dateToFinalize, String username)
    {
      var param = new DynamicParameters();
      param.Add("@DateToFinalize", dateToFinalize);
      param.Add("@created_by", username.Replace("CLAYBCC\\", ""));
      var sql = $@"
        BEGIN TRY
          USE WATSC;
          INSERT INTO ccDJournalTransactionLog
          (djournal_date, created_by)
          VALUES
          (@DateToFinalize, @created_by )

          COMMIT
        END TRY
        BEGIN CATCH
          -- ROLLBACK
        END CATCH
        ";
      try
      { 
        var i = Constants.Exec_Query(sql, param);
        return i;
      }
      catch(Exception ex)
      {
        Constants.Log(ex, sql);
        return -1;
      }
    }

    public static DJournalLog Get(DateTime LogDate)
    {
      var param = new DynamicParameters();
      param.Add("@DateToGet", LogDate);
      var sql = $@"
            USE WATSC;

            SELECT 
              djournal_date DJournalDate, 
              created_on FinalizedOn, 
              created_by CreatedBy
            FROM ccDJournalTransactionLog
            WHERE CAST(djournal_date AS DATE) = CAST(@DateToGet AS DATE)
        ";
      try
      {
      var l = Constants.Get_Data<DJournalLog>(sql, param).DefaultIfEmpty(new DJournalLog()).First();
        return l;
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return null;
      }
    }

  }
}
