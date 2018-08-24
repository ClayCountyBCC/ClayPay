var Balancing;
(function (Balancing) {
    var AssignedOnlinePayment = /** @class */ (function () {
        function AssignedOnlinePayment() {
            this.CashierId = "";
            this.AmountApplied = 0;
            this.AssignedTo = "";
        }
        AssignedOnlinePayment.GetAndDisplay = function () {
            var container = document.getElementById(AssignedOnlinePayment.OnlinePaymentsContainer);
            Utilities.Clear_Element(container);
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Get(path + "API/Balancing/UnassignedPayments").then(function (payments) {
                console.log('assigned online payments', payments);
                if (payments.length === 0) {
                    container.appendChild(document.createTextNode("No payments found, please check again later."));
                    return;
                }
                container.appendChild(AssignedOnlinePayment.BuildTable(payments));
            }, function (error) {
                console.log('error', error);
                Utilities.Error_Show(container, error, false);
            });
        };
        AssignedOnlinePayment.AssignAndDisplay = function (cashierId) {
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var query = "?CashierId=" + cashierId;
            Utilities.Post(path + "API/Balancing/AssignPayment" + query, null).then(function (response) {
                console.log('assigned online payments', response);
                if (response.length !== 0) {
                    alert(response);
                }
                AssignedOnlinePayment.GetAndDisplay();
            }, function (error) {
                console.log('error', error);
            });
        };
        AssignedOnlinePayment.BuildTable = function (payments) {
            var df = document.createDocumentFragment();
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            table.classList.add("pagebreak");
            table.classList.add("is-bordered");
            table.appendChild(AssignedOnlinePayment.BuildTableHeader());
            var tbody = document.createElement("tbody");
            for (var _i = 0, payments_1 = payments; _i < payments_1.length; _i++) {
                var p = payments_1[_i];
                tbody.appendChild(AssignedOnlinePayment.BuildTableRow(p));
            }
            table.appendChild(tbody);
            df.appendChild(table);
            return df;
        };
        AssignedOnlinePayment.BuildTableHeader = function () {
            var thead = document.createElement("thead");
            var tr = document.createElement("tr");
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "CashierId", "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Date", "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Amount", "10%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("th", "Assigned To", "15%"));
            var th = AssignedOnlinePayment.CreateTableCell("th", "", "25%");
            var refresh = document.createElement("button");
            refresh.type = "button";
            refresh.classList.add("is-primary");
            refresh.classList.add("button");
            refresh.appendChild(document.createTextNode("Refresh"));
            refresh.onclick = function () {
                refresh.classList.add("is-loading");
                AssignedOnlinePayment.GetAndDisplay();
            };
            th.appendChild(refresh);
            tr.appendChild(th);
            thead.appendChild(tr);
            return thead;
        };
        AssignedOnlinePayment.BuildTableRow = function (payment) {
            var tr = document.createElement("tr");
            tr.appendChild(Balancing.Payment.createTableCellLink("td", payment.CashierId, "25%"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Date(payment.TransactionDate)));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", Utilities.Format_Amount(payment.AmountApplied), "", "has-text-right"));
            tr.appendChild(AssignedOnlinePayment.CreateTableCell("td", payment.AssignedTo == "" ? "Unassigned" : payment.AssignedTo, "has-text-right"));
            var td = AssignedOnlinePayment.CreateTableCell("td", "");
            var assign = document.createElement("button");
            assign.type = "button";
            assign.classList.add("is-primary");
            assign.classList.add("button");
            assign.appendChild(document.createTextNode("Assign to me"));
            assign.onclick = function () {
                assign.classList.add("is-loading");
                AssignedOnlinePayment.AssignAndDisplay(payment.CashierId);
            };
            td.appendChild(assign);
            tr.appendChild(td);
            return tr;
        };
        AssignedOnlinePayment.CreateTableCell = function (type, value, width, className) {
            if (width === void 0) { width = ""; }
            if (className === void 0) { className = "has-text-centered"; }
            var cell = document.createElement(type);
            if (width.length > 0)
                cell.width = width;
            if (className.length > 0)
                cell.classList.add(className);
            cell.appendChild(document.createTextNode(value));
            return cell;
        };
        AssignedOnlinePayment.OnlinePaymentsContainer = "onlinePayments";
        return AssignedOnlinePayment;
    }());
    Balancing.AssignedOnlinePayment = AssignedOnlinePayment;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=AssignedOnlinePayment.js.map