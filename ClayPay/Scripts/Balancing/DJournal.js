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
    }
    Balancing.DJournal = DJournal;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=DJournal.js.map