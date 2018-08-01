var Balancing;
(function (Balancing) {
    class DJournal {
        constructor() {
            this.ProcessedPaymentTotals = [];
            this.GUTotals = [];
            this.GLAccountTotals = [];
            this.Log = new Balancing.DJournalLog();
            this.Error = [];
        }
        static GetAndShow() {
            let path = "/";
            let i = window.location.pathname.toLowerCase().indexOf("/claypay");
            if (i == 0) {
                path = "/claypay/";
            }
            Utilities.Get(path + "API/Balancing/GetDJournal").then(function (dj) {
                console.log('djournal', dj);
            }, function (error) {
                console.log('error', error);
            });
        }
    }
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map