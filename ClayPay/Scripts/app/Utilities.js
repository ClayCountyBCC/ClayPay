var Utilities;
(function (Utilities) {
    function Hide(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("hide");
        e.classList.remove("show");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Hide = Hide;
    function Show(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show-flex");
    }
    Utilities.Show = Show;
    function Show_Inline(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-inline");
        e.classList.remove("hide");
        e.classList.remove("show");
        e.classList.remove("show-flex");
    }
    Utilities.Show_Inline = Show_Inline;
    function Show_Flex(e) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        e.classList.add("show-flex");
        e.classList.remove("hide");
        e.classList.remove("show-inline");
        e.classList.remove("show");
    }
    Utilities.Show_Flex = Show_Flex;
    function Error_Show(e, errorText) {
        if (typeof e == "string") {
            e = document.getElementById(e);
        }
        if (errorText) {
            Clear_Element(e);
            e.appendChild(document.createTextNode(errorText));
        }
        Show(e);
        window.setTimeout(function (j) {
            Hide(e);
        }, 10000);
    }
    Utilities.Error_Show = Error_Show;
    function Clear_Element(node) {
        if (node === null || node === undefined)
            return;
        while (node.firstChild) {
            node.removeChild(node.firstChild);
        }
    }
    Utilities.Clear_Element = Clear_Element;
    function Create_Option(value, label, selected = false) {
        let o = document.createElement("option");
        o.value = value;
        o.text = label;
        o.selected = selected;
        return o;
    }
    Utilities.Create_Option = Create_Option;
    function Show_Menu(elementId) {
        //let element = e.srcElement;
        // we expect the element's id to be in a "nav-XXX" name format, where 
        // XXX is the element we want to show 
        let id = elementId.replace("nav-", "");
        let menuItems = document.querySelectorAll("#menuTabs > li > a");
        if (menuItems.length > 0) {
            for (let i = 0; i < menuItems.length; i++) {
                let item = menuItems.item(i);
                if (item.id === elementId) {
                    item.parentElement.classList.add("is-active");
                }
                else {
                    item.parentElement.classList.remove("is-active");
                }
            }
        }
        Show_Hide_Selector("#views > section", id);
    }
    Utilities.Show_Menu = Show_Menu;
    function Show_Hide_Selector(selector, id) {
        let sections = document.querySelectorAll(selector);
        if (sections.length > 0) {
            for (let i = 0; i < sections.length; i++) {
                let item = sections.item(i);
                if (item.id === id) {
                    Show(item);
                }
                else {
                    Hide(item);
                }
            }
        }
    }
    Utilities.Show_Hide_Selector = Show_Hide_Selector;
    function Get(url) {
        return fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Upgrade-Insecure-Requests": "1"
            },
            credentials: "include"
        })
            .then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Get = Get;
    function Post(url, data) {
        return fetch(url, {
            method: "POST",
            body: JSON.stringify(data),
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            },
            credentials: "include"
        }).then(response => {
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
    }
    Utilities.Post = Post;
})(Utilities || (Utilities = {}));
//# sourceMappingURL=Utilities.js.map