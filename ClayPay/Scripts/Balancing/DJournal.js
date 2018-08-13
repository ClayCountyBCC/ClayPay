var Balancing;
(function (Balancing) {
    class DJournal {
        constructor() {
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
        static ToggleButtons(toggle) {
            Utilities.Toggle_Loading_Button(DJournal.DJournalSearchDateButton, toggle);
            //Utilities.Toggle_Loading_Button(DJournal.DJournalSearchNextDateButton, toggle);
        }
        static GetAndShow(DJournalDate = "") {
            DJournal.ToggleButtons(true);
            Utilities.Hide(DJournal.PrintingContainer);
            Utilities.Show(DJournal.BalancingContainer);
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            let query = "";
            if (DJournalDate.length > 0) {
                query = "?DateToBalance=" + DJournalDate;
            }
            Utilities.Get(path + "API/Balancing/GetDJournal" + query).then(function (dj) {
                console.log('djournal', dj);
                let dateInput = document.getElementById(DJournal.DJournalDateInput);
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
        }
        static BuildDJournalFinalizeDisplay(dj) {
            // Rules:
            // df.CanBeFinalized is true, we show the finalize button
            // Otherwise:
            // If the date is already finalized, we show who did it and when
            // along with a "View Printable DJournal" button
            // If it's not, we don't show anything.
            let finalizeContainer = document.getElementById(DJournal.DJournalFinalizeContainer);
            Utilities.Clear_Element(finalizeContainer);
            let df = document.createDocumentFragment();
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
        }
        static BuildDJournalFinalizeButton(dj) {
            let level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("Finalize Date"));
            button.onclick = () => {
                button.disabled = true;
                button.classList.add("is-loading");
                let path = "/";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
                if (i == 0) {
                    path = "/claypay/";
                }
                let query = "?DateToFinalize=" + dj.DJournalDate;
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
        }
        static BuildDJournalFinalizeInfo(dj) {
            let container = document.createElement("div");
            container.appendChild(DJournal.CreateDisplayField("Finalized On", Utilities.Format_Date(dj.Log.FinalizedOn)));
            container.appendChild(DJournal.CreateDisplayField("Finalized By", dj.Log.CreatedBy));
            let level = document.createElement("div");
            level.classList.add("level");
            level.style.marginTop = ".75em";
            let button = document.createElement("button");
            button.type = "button";
            button.classList.add("button");
            button.classList.add("is-success");
            button.classList.add("level-item");
            button.classList.add("is-large");
            button.appendChild(document.createTextNode("View Printable DJournal"));
            button.onclick = () => {
                Utilities.Hide(DJournal.BalancingContainer);
                Utilities.Show(DJournal.PrintingContainer);
            };
            level.appendChild(button);
            container.appendChild(level);
            return container;
        }
        static CreateDisplayField(label, value) {
            let field = document.createElement("div");
            field.classList.add("field");
            field.classList.add("column");
            let dataLabel = document.createElement("label");
            dataLabel.classList.add("label");
            dataLabel.appendChild(document.createTextNode(label));
            let control = document.createElement("div");
            control.classList.add("control");
            let input = document.createElement("input");
            input.classList.add("input");
            input.classList.add("is-static");
            input.readOnly = true;
            input.type = "text";
            input.value = value;
            control.appendChild(input);
            field.appendChild(dataLabel);
            field.appendChild(control);
            return field;
        }
        static BuildDJournalDisplay(dj) {
            let target = document.getElementById(DJournal.DJournalTotalsContainer);
            let df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj));
            Utilities.Clear_Element(target);
            target.appendChild(df);
            DJournal.BuildDJournalFinalizeDisplay(dj);
            DJournal.BuildPrintableDJournal(dj);
        }
        static CreateDJournalTable(dj, ShowClose = false) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            table.classList.add("is-bordered");
            table.appendChild(DJournal.BuildDJournalHeader(dj, ShowClose));
            let tbody = document.createElement("tbody");
            let tfoot = document.createElement("tfoot");
            let totalCharges = new Balancing.CashierTotal();
            let totalDeposits = new Balancing.CashierTotal();
            let totalPayments = new Balancing.CashierTotal();
            for (let payment of dj.ProcessedPaymentTotals) {
                switch (payment.Type) {
                    case "Total Charges":
                        totalCharges = payment;
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
                }
            }
            let tr = DJournal.BuildDJournalRow(totalPayments.Type, totalPayments.TotalAmount, totalDeposits.Type, totalDeposits.TotalAmount);
            tr.style.backgroundColor = "#fafafa";
            tfoot.appendChild(tr);
            tfoot.appendChild(DJournal.BuildDJournalRow(totalCharges.Type, totalCharges.TotalAmount, "", -1));
            for (let gutotal of dj.GUTotals) {
                tfoot.appendChild(DJournal.BuildDJournalRow(gutotal.Type, gutotal.TotalAmount, "", -1));
            }
            table.appendChild(tbody);
            table.appendChild(tfoot);
            return table;
        }
        static BuildDJournalHeader(dj, ShowClose) {
            let head = document.createElement("THEAD");
            let closeRow = document.createElement("tr");
            let title = document.createElement("th");
            title.colSpan = ShowClose ? 3 : 4;
            title.classList.add("has-text-left");
            title.appendChild(document.createTextNode("DJournal for " + dj.DJournalDateFormatted));
            closeRow.appendChild(title);
            if (ShowClose) {
                let close = document.createElement("th");
                close.classList.add("has-text-centered");
                let button = document.createElement("button");
                button.type = "button";
                button.classList.add("button");
                button.classList.add("is-primary");
                button.classList.add("hide-for-print");
                button.appendChild(document.createTextNode("Close"));
                button.onclick = () => {
                    Utilities.Hide(DJournal.PrintingContainer);
                    Utilities.Show(DJournal.BalancingContainer);
                };
                close.appendChild(button);
                closeRow.appendChild(close);
            }
            head.appendChild(closeRow);
            let tr = document.createElement("tr");
            let payments = document.createElement("th");
            payments.colSpan = 2;
            payments.width = "60%";
            payments.classList.add("has-text-right");
            payments.appendChild(document.createTextNode("Payments"));
            tr.appendChild(payments);
            let deposits = document.createElement("th");
            deposits.colSpan = 2;
            deposits.width = "40%";
            deposits.classList.add("has-text-right");
            deposits.appendChild(document.createTextNode("Deposits"));
            tr.appendChild(deposits);
            head.appendChild(tr);
            return head;
        }
        static BuildDJournalRow(paymentLabel, paymentAmount, depositLabel, depositAmount) {
            let tr = document.createElement("tr");
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
        }
        static BuildShortDJournalRow(payment, djournalDate) {
            let tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell(payment.Type + " Deposits", "25%"));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            return tr;
        }
        static BuildPaymentRow(payment, djournalDate) {
            let tr = document.createElement("tr");
            tr.appendChild(DJournal.CreateTableCellLink(payment.Type, payment.Code, "45%", djournalDate));
            tr.appendChild(DJournal.CreateTableCell(Utilities.Format_Amount(payment.TotalAmount), "15%"));
            tr.appendChild(DJournal.CreateTableCell("", "25%"));
            tr.appendChild(DJournal.CreateTableCell("", "15%"));
            return tr;
        }
        static CreateTableCell(value, width) {
            let td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            td.appendChild(document.createTextNode(value));
            return td;
        }
        static CreateTableCellLink(value, paymentType, width, djournalDate) {
            let td = document.createElement("td");
            td.classList.add("has-text-right");
            td.width = width;
            let link = document.createElement("A");
            link.onclick = () => {
                Utilities.Set_Text(link, "loading...");
                // load data here
                let path = "/";
                let qs = "";
                let i = window.location.pathname.toLowerCase().indexOf("/claypay");
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
                    Utilities.Set_Text(link, value); // change it back
                    Utilities.Show(DJournal.PaymentsContainer);
                }, function (error) {
                    console.log('error getting payments for payment type: ' + paymentType, error);
                    Utilities.Set_Text(link, value); // change it back
                });
            };
            link.appendChild(document.createTextNode(value));
            td.appendChild(link);
            return td;
        }
        static BuildPrintableDJournal(dj) {
            let container = document.getElementById(DJournal.PrintingContainer);
            Utilities.Clear_Element(container);
            if (!dj.Log.IsCreated)
                return; // Let's not do anything if this thing isn't finalized
            let df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj, true));
            df.appendChild(Balancing.Account.BuildGLAccountTotals(dj.GLAccountTotals));
            df.appendChild(Balancing.CashierDetailData.BuildCashierDataTable(dj.CashierData));
            container.appendChild(df);
        }
    }
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
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map