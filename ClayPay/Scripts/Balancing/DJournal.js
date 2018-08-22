var Balancing;
(function (Balancing) {
    var DJournal = /** @class */ (function () {
        function DJournal() {
            this.ProcessedPaymentTotals = [];
            this.GUTotals = [];
            this.GLAccountTotals = [];
            this.Log = new Balancing.DJournalLog();
            this.Error = [];
            this.DJournalDate = new Date();
            this.DJournalDateFormatted = "";
            this.CanDJournalBeFinalized = false;
            this.CashierData = [];
        }
        DJournal.ToggleButtons = function (toggle) {
            Utilities.Toggle_Loading_Button(DJournal.DJournalSearchDateButton, toggle);
            //Utilities.Toggle_Loading_Button(DJournal.DJournalSearchNextDateButton, toggle);
        };
        DJournal.GetAndShow = function (DJournalDate) {
            if (DJournalDate === void 0) { DJournalDate = ""; }
            DJournal.ToggleButtons(true);
            Utilities.Hide(DJournal.PrintingContainer);
            Utilities.Show(DJournal.BalancingContainer);
            var path = "/";
            var i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            var query = "";
            if (DJournalDate.length > 0) {
                query = "?DateToBalance=" + DJournalDate;
            }
            Utilities.Get(path + "API/Balancing/GetDJournal" + query).then(function (dj) {
                console.log('djournal', dj);
                var dateInput = document.getElementById(DJournal.DJournalDateInput);
                Utilities.Set_Value(dateInput, dj.DJournalDateFormatted);
                if (dj.Error.length === 0) {
                    Utilities.Clear_Element(document.getElementById(DJournal.DJournalErrorContainer));
                }
                else {
                    Utilities.Error_Show(DJournal.DJournalErrorContainer, dj.Error, false);
                }
                DJournal.BuildDJournalDisplay(dj);
                DJournal.ToggleButtons(false);
            }, function (error) {
                console.log('error', error);
                Utilities.Error_Show(DJournal.DJournalErrorContainer, error, false);
                DJournal.ToggleButtons(false);
            });
        };
        DJournal.BuildDJournalFinalizeDisplay = function (dj) {
            // Rules:
            // df.CanBeFinalized is true, we show the finalize button
            // Otherwise:
            // If the date is already finalized, we show who did it and when
            // along with a "View Printable DJournal" button
            // If it's not, we don't show anything.
            var finalizeContainer = document.getElementById(DJournal.DJournalFinalizeContainer);
            Utilities.Clear_Element(finalizeContainer);
            var df = document.createDocumentFragment();
            if (dj.CanDJournalBeFinalized) {
                console.log('showing finalize button');
                df.appendChild(DJournal.BuildDJournalFinalizeButton(dj));
            }
            else {
                if (dj.Log.IsCreated) {
                    console.log('showing finalize info');
                    df.appendChild(DJournal.BuildDJournalFinalizeInfo(dj));
                }
                else {
                    console.log('no finalize to show');
                }
            }
            finalizeContainer.appendChild(df);
        };
        DJournal.BuildDJournalFinalizeButton = function (dj) {
            var level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("Finalize Date"));
            button.onclick = function () {
                button.disabled = true;
                button.classList.add("is-loading");
                var path = "/";
                var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                var query = "?DateToFinalize=" + dj.DJournalDate;
                Utilities.Post(path + "API/Balancing/Finalize" + query, null)
                    .then(function (dj) {
                    console.log('dj returned from finalize', dj);
                    DJournal.BuildDJournalDisplay(dj);
                    Utilities.Hide(DJournal.BalancingContainer);
                    Utilities.Show(DJournal.PrintingContainer);
                    button.disabled = false;
                    button.classList.remove("is-loading");
                }, function (error) {
                    console.log("error in finalize", error);
                    button.disabled = false;
                    button.classList.remove("is-loading");
                });
            };
            level.appendChild(button);
            return level;
        };
        DJournal.BuildDJournalFinalizeInfo = function (dj) {
            var container = document.createElement("div");
            container.appendChild(DJournal.CreateDisplayField("Finalized On", Utilities.Format_Date(dj.Log.FinalizedOn)));
            container.appendChild(DJournal.CreateDisplayField("Finalized By", dj.Log.CreatedBy));
            var level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            var button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("View Printable DJournal"));
            button.onclick = function () {
                Utilities.Hide(DJournal.BalancingContainer);
                Utilities.Show(DJournal.PrintingContainer);
            };
            level.appendChild(button);
            container.appendChild(level);
            return container;
        };
        DJournal.CreateDisplayField = function (label, value) {
            var field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            var dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            var control = document.createElement("div");
            control.classList.add("control");
            var input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        };
        DJournal.BuildDJournalDisplay = function (dj) {
            var target = document.getElementById(DJournal.DJournalTotalsContainer);
            var df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj));
            Utilities.Clear_Element(target);
            target.appendChild(df);
            DJournal.BuildDJournalFinalizeDisplay(dj);
            DJournal.BuildPrintableDJournal(dj);
        };
        DJournal.CreateDJournalTable = function (dj, ShowClose) {
            if (ShowClose === void 0) { ShowClose = false; }
            var table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-bordered");
            table.classList.add("is-fullwidth");
            table.classList.add("print-with-no-border");
            table.appendChild(DJournal.BuildDJournalHeader(dj, ShowClose));
            var tbody = document.createElement("tbody");
            var tfoot = document.createElement("tfoot");
            var totalCharges = new Balancing.CashierTotal();
            var totalDeposits = new Balancing.CashierTotal();
            var totalPayments = new Balancing.CashierTotal();
            for (var _i = 0, _a = dj.ProcessedPaymentTotals; _i < _a.length; _i++) {
                var payment = _a[_i];
                switch (payment.Type) {
                    case "Total Charges":
                        totalCharges = payment;
                        tbody.appendChild(DJournal.BuildPaymentRow(payment, dj.DJournalDateFormatted));
                        break;
                    case "Total Deposit":
                        totalDeposits = payment;
                        break;
                    case "Total Payments":
                        totalPayments = payment;
                        break;
                    case "Check":
                    case "Cash":
                        tbody.appendChild(DJournal.BuildShortDJournalRow(payment, dj.DJournalDateFormatted));
                        break;
                    default:
                        tbody.appendChild(DJournal.BuildPaymentRow(payment, dj.DJournalDateFormatted));
                        break;
                }
            }
            var tr = DJournal.BuildDJournalRow(totalPayments.Type, totalPayments.TotalAmount, totalDeposits.Type, totalDeposits.TotalAmount);
            tr.style.backgroundColor = "#fafafa";
            tfoot.appendChild(tr);
            //tfoot.appendChild(DJournal.BuildDJournalRow(totalCharges.Type, totalCharges.TotalAmount, "", -1));
            for (var _b = 0, _c = dj.GUTotals; _b < _c.length; _b++) {
                var gutotal = _c[_b];
                tfoot.appendChild(DJournal.BuildDJournalRow(gutotal.Type, gutotal.TotalAmount, "", -1));
            }
            table.appendChild(tbody);
            table.appendChild(tfoot);
            return table;
        };
        DJournal.BuildDJournalHeader = function (dj, ShowClose) {
            var head = document.createElement("THEAD");
            var bccTitle = document.createElement("div");
            bccTitle.textContent = "Clay County, BCC";
            bccTitle.classList.add("hide");
            bccTitle.classList.add("show-for-print");
            bccTitle.classList.add("print-title-size");
            var closeRow = document.createElement("tr");
            var title = document.createElement("th");
            title.colSpan = ShowClose ? 3 : 4;
            title.classList.add("has-text-left");
            title.classList.add("print-title-size");
            title.appendChild(document.createTextNode("DJournal " + dj.DJournalDateFormatted));
            title.appendChild(document.createElement("br"));
            title.appendChild(bccTitle);
            closeRow.appendChild(title);
            if (ShowClose) {
                var close_1 = document.createElement("th");
                close_1.classList.add("has-text-centered");
                var button = document.createElement("button");
                button.type = "button";
                button.classList.add("button");
                button.classList.add("is-primary");
                button.classList.add("hide-for-print");
                button.appendChild(document.createTextNode("Close"));
                button.onclick = function () {
                    Utilities.Hide(DJournal.PrintingContainer);
                    Utilities.Show(DJournal.BalancingContainer);
                };
                close_1.appendChild(button);
                closeRow.appendChild(close_1);
            }
            head.appendChild(closeRow);
            var tr = document.createElement("tr");
            var payments = document.createElement("th");
            payments.colSpan = 2;
            payments.width = "60%";
            payments.classList.add("has-text-right");
            payments.appendChild(document.createTextNode("Payments"));
            tr.appendChild(payments);
            var deposits = document.createElement("th");
            deposits.colSpan = 2;
            deposits.width = "40%";
            deposits.classList.add("has-text-right");
            deposits.appendChild(document.createTextNode("Deposits"));
            tr.appendChild(deposits);
            head.appendChild(tr);
            return head;
        };
        DJournal.BuildDJournalRow = function (paymentLabel, paymentAmount, depositLabel, depositAmount) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCell(paymentLabel, "45%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(paymentAmount), "15%"));
            if (depositLabel.length > 0) {
                tr.appendChild(DJournal.CreateTableCell(depositLabel, "25%"));
                tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(depositAmount), "15%"));
            }
            else {
                tr.appendChild(DJournal.CreateTableCell("", "25%"));
                tr.appendChild(DJournal.CreateTableCell("", "15%"));
            }
            return tr;
        };
        DJournal.BuildShortDJournalRow = function (payment, djournalDate) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell(payment.Type + " Deposits", "25%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            return tr;
        };
        DJournal.BuildPaymentRow = function (payment, djournalDate) {
            var tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell("", "25%"));
            tr.appendChild(DJournal.CreateTableCell("", "15%"));
            return tr;
        };
        DJournal.CreateTableCell = function (value, width) {
            var td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            td.appendChild(document.createTextNode(value));
            return td;
        };
        DJournal.CreateTableCellLink = function (value, paymentType, width, djournalDate) {
            var td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            if (paymentType.length > 0) {
                var link_1 = document.createElement("A");
                link_1.onclick = function () {
                    Utilities.Set_Text(link_1, "loading...");
                    // load data here
                    var path = "/";
                    var qs = "";
                    var i = window.location.pathname.toLowerCase().indexOf("/claypay");
                    if (i == 0) {
                        path = "/claypay/";
                    }
                    //DateTime DateToBalance, string PaymentType
                    qs = "?DateToBalance=" + djournalDate + "&PaymentType=" + paymentType;
                    Utilities.Get(path + "API/Balancing/GetPayments" + qs)
                        .then(function (payments) {
                        console.log('payments', payments);
                        Balancing.Payment.ShowPayments(payments, value, djournalDate);
                        Utilities.Hide(DJournal.DJournalTotalsContainer);
                        Utilities.Set_Text(link_1, value); // change it back
                        Utilities.Show(DJournal.PaymentsContainer);
                    }, function (error) {
                        console.log('error getting payments for payment type: ' + paymentType, error);
                        Utilities.Set_Text(link_1, value); // change it back
                    });
                };
                link_1.appendChild(document.createTextNode(value));
                td.appendChild(link_1);
            }
            else {
                td.appendChild(document.createTextNode(value));
            }
            return td;
        };
        DJournal.BuildPrintableDJournal = function (dj) {
            var container = document.getElementById(DJournal.PrintingContainer);
            Utilities.Clear_Element(container);
            if (!dj.Log.IsCreated)
                return; // Let's not do anything if this thing isn't finalized
            var df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj, true));
            df.appendChild(Balancing.Account.BuildGLAccountTotals(dj.GLAccountTotals));
            df.appendChild(Balancing.CashierDetailData.BuildCashierDataTable(dj.CashierData));
            container.appendChild(df);
        };
        DJournal.DJournalTotalsContainer = "djournalTotals";
        DJournal.DJournalDateInput = "djournalDate";
        DJournal.BalancingContainer = "balancingDJournal";
        DJournal.PrintingContainer = "printingDJournal";
        DJournal.PaymentsContainer = "djournalPaymentsByType";
        DJournal.DJournalSearchErrorContainer = "djournalSearchError";
        DJournal.DJournalErrorContainer = "djournalErrors";
        DJournal.DJournalSearchDateButton = "BalanceByDate";
        DJournal.DJournalSearchNextDateButton = "NextFinalizeDate";
        DJournal.DJournalFinalizeContainer = "djournalFinalizeContainer";
        return DJournal;
    }());
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map