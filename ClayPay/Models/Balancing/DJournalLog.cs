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
      param.Add("@created_by", username);
      var sql = $@"
          USE WATSC;
          INSERT INTO ccDJournalTransactionLog
          (djournal_date, created_by)
          VALUES
          (@DateToBalance, @username )


        ";
      try
      { 
        return Constants.Exec_Query(sql, param);
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
              djournal_date, 
              created_on, 
              created_by,
            FROM ccDJournalTransactionLog
            WHERE CAST(djournal_date AS DATE) = CAST(@DateToGet AS DATE)
        ";
      try
      {
        return Constants.Get_Data<DJournalLog>(sql, param).FirstOrDefault();
      }
      catch (Exception ex)
      {
        Constants.Log(ex, sql);
        return null;
      }
    }

  }
}
