using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Web.Http;
using System.Web;
using System.Text;
using ClayPay.Models.Claypay;
using ClayPay.Models.Balancing;
using ClayPay.Models;



namespace ClayPay.Controllers.API.Payments
{

  [RoutePrefix("API/Payments")]
  public class ReceiptController : ApiController
  {
    [HttpGet]
    [Route("Receipt")]
    public IHttpActionResult Get(string CashierId)
    {
      var cr = new ClientResponse(CashierId);
      if (cr == null)
      {
        return InternalServerError();
      }
      else
      {
        return Ok(cr);
      }
    }

    [HttpPost]
    [Route("EditPayments")]
    public IHttpActionResult Post(List<ReceiptPayment> editPaymentList)
    {

      if (editPaymentList != null && editPaymentList.Count() > 0)
      {
        var response = new ClientResponse(editPaymentList[0].CashierId);
        var cashierId = editPaymentList[0].CashierId;

        var isNotFinalized = DJournal.LastDateFinalized().AddDays(1).Date >= editPaymentList[0].TransactionDate.Date;
        if (!isNotFinalized)
        {
          response.Errors.Add("These payments have been finalized and can no longer be edited");
        }
        
        // Get Payment data from DB
        var originalPaymentList = ReceiptPayment.GetPaymentsByPayId((from p in editPaymentList
                                                                     where p.PaymentType == "CA" ||
                                                                           p.PaymentType == "CK"
                                                                     select p.PayId).ToList());
        // this will be true if there are not cash or check payments
        if (originalPaymentList.Count() == 0)
        {
          response.Errors.Add("There were no cash or check payments to edit.");
          return Ok(new ClientResponse(cashierId));
        }
        // removes any payments not in the list of payments to edit
        originalPaymentList.RemoveAll(p => !editPaymentList.Contains(p));

        if(isNotFinalized && originalPaymentList.Count() == editPaymentList.Count() )
        {
          response.ReceiptPayments = ReceiptPayment.EditPayments(editPaymentList);
        }

        return Ok(response);

      }
      else
      {
        return Ok(BadRequest("There are no payments to edit"));
      }
      
    }
  }

}
 