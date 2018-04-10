var ImpactFees;
(function (ImpactFees) {
    function Menu(id) {
        var sections = document.querySelectorAll("section.container");
        if (sections.length > 0) {
            for (var i = 0; i < sections.length; i++) {
                var item = sections.item(i);
                if (sections.item(i).id === id) {
                    item.classList.remove("hide");
                    item.classList.add("show");
                }
                else {
                    item.classList.remove("show");
                    item.classList.add("hide");
                }
            }
        }
    }
    ImpactFees.Menu = Menu;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=impactfees.js.map