(function () {
  "use strict";

  var tabs = Array.prototype.slice.call(document.querySelectorAll("[data-process-tab]"));
  var panels = Array.prototype.slice.call(document.querySelectorAll("[data-process-panel]"));

  if (!tabs.length || !panels.length) return;

  function activate(tab, moveFocus) {
    var key = tab.getAttribute("data-process-tab");

    tabs.forEach(function (item) {
      var selected = item === tab;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-selected", selected ? "true" : "false");
      item.setAttribute("tabindex", selected ? "0" : "-1");
    });

    panels.forEach(function (panel) {
      var selected = panel.getAttribute("data-process-panel") === key;
      panel.hidden = !selected;
      panel.classList.toggle("is-active", selected);
    });

    if (moveFocus) tab.focus();
  }

  tabs.forEach(function (tab, index) {
    tab.addEventListener("click", function () {
      activate(tab, false);
    });

    tab.addEventListener("pointerenter", function (event) {
      if (event.pointerType !== "touch" && window.matchMedia("(hover: hover)").matches) {
        activate(tab, false);
      }
    });

    tab.addEventListener("keydown", function (event) {
      var nextIndex = index;

      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIndex = (index + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = tabs.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      activate(tabs[nextIndex], true);
    });
  });
})();
