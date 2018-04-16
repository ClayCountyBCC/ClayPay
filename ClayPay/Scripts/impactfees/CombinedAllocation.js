var ImpactFees;
(function (ImpactFees) {
    var CombinedAllocation = (function () {
        function CombinedAllocation() {
        }
        CombinedAllocation.prototype.GetAll = function () {
            var x = XHR.Get("./API/ImpactFees/GetCombinedAllocations");
            return new Promise(function (resolve, reject) {
                x.then(function (response) {
                    var ar = JSON.parse(response.Text);
                    resolve(ar);
                }).catch(function () {
                    console.log("error in Get Combined Allocation");
                    reject(null);
                });
            });
        };
        return CombinedAllocation;
    }());
    ImpactFees.CombinedAllocation = CombinedAllocation;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=CombinedAllocation.js.map