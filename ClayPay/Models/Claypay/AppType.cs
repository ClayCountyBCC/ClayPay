using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace ClayPay.Models
{
  public class AppType
  {
    public string Label { get; set; }
    public string Value { get; set; }
    public AppType()
    {
    }

    public static List<AppType> Get()
    {
      string sql = @"
        SELECT LTRIM(RTRIM(Code)) AS Value, 
          LTRIM(RTRIM(Description)) AS Label
        FROM apCategory_Codes
        WHERE Active=1 AND TypeCode=4        
        ORDER BY Description ASC";
      return Constants.Get_Data<AppType>(sql);
    }
  }
}