var ImpactFees;
(function (ImpactFees) {
    ImpactFees.CombinedAllocations = [];
    function Start() {
        LoadAgreements();
    }
    ImpactFees.Start = Start;
    function Menu(id) {
        var sections = document.querySelectorAll("body > section");
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
    function LoadAgreements() {
        ImpactFees.CombinedAllocation.GetAll("", -1, "").then(function (a) {
            ImpactFees.CombinedAllocations = a;
            PopulateAgreementDropdowns(a);
        });
    }
    function PopulateAgreementDropdowns(agreements) {
        var added = [];
        var developer = document.getElementById("developerAgreementAdd");
        var builder = document.getElementById("builderAllocationAgreementAdd");
        var permit = document.getElementById("permitAllocationAgreementAdd");
        for (var _i = 0, agreements_1 = agreements; _i < agreements_1.length; _i++) {
            var a = agreements_1[_i];
            if (added.indexOf(a.Agreement_Number) === -1) {
                added.push(a.Agreement_Number);
                var label = a.Agreement_Number + ' - ' + a.Developer_Name;
                developer.add(Utilities.Create_Option(a.Agreement_Number, label));
                if (a.Agreement_Amount > 0) {
                    builder.add(Utilities.Create_Option(a.Agreement_Number, label));
                    permit.add(Utilities.Create_Option(a.Agreement_Number, label));
                }
            }
        }
    }
    function GetArray(url, queryString) {
        if (queryString === void 0) { queryString = ""; }
        var x = XHR.Get(url + queryString);
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                var ar = JSON.parse(response.Text);
                resolve(ar);
            }).catch(function () {
                console.log("error in Get " + url);
                reject(null);
            });
        });
    }
    ImpactFees.GetArray = GetArray;
    function SaveObject(url, object) {
        var x = XHR.Post(url, JSON.stringify(object));
        return new Promise(function (resolve, reject) {
            x.then(function (response) {
                if (response.Text.length === 0) {
                    resolve([]);
                }
                else {
                    var ar = JSON.parse(response.Text);
                    resolve(ar);
                }
            }).catch(function (e) {
                console.log('save object error ' + url + ' ' + e);
                reject(null);
            });
        });
    }
    ImpactFees.SaveObject = SaveObject;
})(ImpactFees || (ImpactFees = {}));
//# sourceMappingURL=ImpactFees.js.map