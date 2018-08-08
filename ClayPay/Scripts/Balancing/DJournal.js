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
        }
        static GetAndShow(DJournalDate = "") {
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
                DJournal.BuildDJournalDisplay(dj);
            }, function (error) {
                console.log('error', error);
            });
        }
        static BuildDJournalDisplay(dj) {
            let target = document.getElementById(DJournal.DJournalTotalsContainer);
            let df = document.createDocumentFragment();
            df.appendChild(DJournal.CreateDJournalTable(dj));
            Utilities.Clear_Element(target);
            target.appendChild(df);
        }
        static CreateDJournalTable(dj) {
            let table = document.createElement("table");
            table.classList.add("table");
            table.classList.add("is-fullwidth");
            table.classList.add("is-bordered");
            table.appendChild(DJournal.BuildDJournalHeader());
            let tbody = document.createElement("tbody");
            let tfoot = document.createElement("tfoot");
            let totalCharges;
            let totalDeposits;
            let totalPayments;
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
        static BuildDJournalHeader() {
            let head = document.createElement("THEAD");
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
    }
    DJournal.DJournalTotalsContainer = "djournalTotals";
    DJournal.DJournalDateInput = "djournalDate";
    DJournal.DjournalContainer = "balancingDJournal";
    DJournal.PaymentsContainer = "djournalPaymentsByType";
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map