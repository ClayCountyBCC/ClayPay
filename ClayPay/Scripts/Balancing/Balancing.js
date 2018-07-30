var Balancing;
(function (Balancing) {
    let Menus = [
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
            subTitle: "The payments made online will be listed here.",
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
    }
    Balancing.Start = Start;
    function buildMenuElements() {
        let menu = document.getElementById("menuTabs");
        for (let menuItem of Menus) {
            menu.appendChild(Utilities.Create_Menu_Element(menuItem));
        }
    }
    Balancing.buildMenuElements = buildMenuElements;
})(Balancing || (Balancing = {}));
//# sourceMappingURL=Balancing.js.map