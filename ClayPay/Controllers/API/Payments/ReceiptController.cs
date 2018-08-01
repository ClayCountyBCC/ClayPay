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
        var errors = new List<string>();
        var originalPaymentList = ReceiptPayment.GetPaymentsByPayId((from p in editPaymentList
                                                                     select p.PayId).ToList());

        var cashierId = originalPaymentList[0].CashierId;
        errors = ReceiptPayment.EditPaymentValidation(editPaymentList, originalPaymentList);

        if(errors.Count() == 0)
        {
          errors = ReceiptPayment.UpdatePayments(editPaymentList, originalPaymentList, User.Identity.Name);
        }

        var response = new ClientResponse(cashierId);
        response.Errors = errors;

        return Ok(response);

      }
      else
      {
        return Ok(BadRequest("There are no payments to edit"));
      }

    }
  }
}
 