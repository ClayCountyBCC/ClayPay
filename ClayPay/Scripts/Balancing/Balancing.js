var Balancing;
(function (Balancing) {
    Balancing.Menus = [
        {
            id: "nav-balancing",
            title: "Balancing & DJournal Handling",
            subTitle: "Use this page to finalize a day's charges, or see if any payments are not balancing.",
            icon: "fas fa-home",
            label: "Balancing",
            selected: true
        },
        {
            id: "nav-onlinePayments",
            title: "Online Payments Handling",
            subTitle: "The payments made online will be listed here.  Assign them to yourself to indicate that you're going to handle it.",
            icon: "fas fa-credit-card",
            label: "Online Payments",
            selected: false
        },
        {
            id: "nav-receipts",
            title: "Receipts",
            subTitle: "You can use this to view a receipt.",
            icon: "fas fa-file",
            label: "Receipts",
            selected: false
        }
    ];
    function Start() {
        buildMenuElements();
        Balancing.DJournal.GetAndShow();
        Balancing.AssignedOnlinePayment.GetAndDisplay();
    }
    Balancing.Start = Start;
    function DJournalByDate() {
        var DJournalDate = Utilities.Get_Value(Balancing.DJournal.DJournalDateInput);
        if (DJournalDate.length == 0) {
            // invalid date entered
            Utilities.Error_Show(Balancing.DJournal.DJournalSearchErrorContainer, "Invalid date entered, please try again.");
            return;
        }
        Balancing.DJournal.GetAndShow(DJournalDate);
    }
    Balancing.DJournalByDate = DJournalByDate;
    function buildMenuElements() {
        var menu = document.getElementById("menuTabs");
        for (var _i = 0, Menus_1 = Balancing.Menus; _i < Menus_1.length; _i++) {
            var menuItem = Menus_1[_i];
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Balancing.buildMenuElements = buildMenuElements;
    function ClearReceipt() {
        var e = document.getElementById("receiptView");
        Utilities.Clear_Element(e);
        Utilities.Set_Value("receiptSearch", "");
    }
    Balancing.ClearReceipt = ClearReceipt;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Balancing.js.map