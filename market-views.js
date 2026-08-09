(() => {
  "use strict";

  const views = {
    credit: {
      index: "01 / PRIVATE CREDIT",
      bubbleTitle: "The category is broad; the risk is specific.",
      bubbleCopy: "A market label can obscure the actual exposure. Borrower quality, leverage, interest coverage, documentation, attachment point, manager discipline, and vintage determine the risk.",
      test: "Defaults, recoveries, interest coverage, covenant quality, and concentration by vintage.",
      decision: "Segment exposure before an isolated failure becomes a conclusion about the entire category.",
      lensTitle: "A structure-driven market that resists one headline conclusion.",
      lensCopy: "Private credit spans different borrowers, structures, managers, vintages, and priorities. The useful question is where risk enters the underwriting—not whether the category has one universal condition.",
      measure: "Borrower quality · leverage · debt service · documentation · recoveries",
      change: "Broad stress across sectors and vintages, persistent coverage deterioration, or recoveries that fail to support structural assumptions."
    },
    ai: {
      index: "02 / AI BUILDOUT",
      bubbleTitle: "Enthusiasm is only one layer of the AI cycle.",
      bubbleCopy: "Underneath the software narrative sits a physical investment system: compute, data centers, power, grid equipment, construction, and financing.",
      test: "Utilization, power access, revenue durability, and return on deployed capital.",
      decision: "Stage capacity against observable demand and the slowest physical constraint.",
      lensTitle: "A productivity story with a capital-intensive delivery path.",
      lensCopy: "The opportunity is not only in models. It propagates through compute, power, cooling, grid equipment, construction, and financing—each with a different clock and constraint.",
      measure: "Utilization · power availability · deployment economics · revenue durability",
      change: "Persistent overbuild, weak utilization, or economics that do not improve with scale."
    },
    equities: {
      index: "03 / PUBLIC EQUITIES",
      bubbleTitle: "A high valuation sets a high bar; it does not finish the analysis.",
      bubbleCopy: "The relevant comparison is between expectations and the breadth, durability, concentration, and cash conversion of the earnings that support them.",
      test: "Earnings breadth, free-cash-flow conversion, concentration, valuation, and delivery against guidance.",
      decision: "Identify the execution already priced into the market and the evidence required to sustain it.",
      lensTitle: "A fundamentals-backed market with little room for disappointment.",
      lensCopy: "Elevated expectations can coexist with real earnings and cash flow. That combination makes the delivery bar—not a single historical analogy—the central operating question.",
      measure: "Earnings breadth · cash conversion · concentration · valuation · guidance",
      change: "Delivery narrows materially while expectations remain elevated, or reported growth separates persistently from cash generation."
    }
  };

  const setText = (root, selector, value) => {
    const target = root.querySelector(selector);
    if (target) target.textContent = value;
  };

  const addArrowNavigation = (buttons, activate) => {
    buttons.forEach((button, index) => {
      button.addEventListener("keydown", event => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (["ArrowLeft", "ArrowUp"].includes(event.key)) nextIndex = (index - 1 + buttons.length) % buttons.length;
        if (["ArrowRight", "ArrowDown"].includes(event.key)) nextIndex = (index + 1) % buttons.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = buttons.length - 1;
        buttons[nextIndex].focus();
        activate(buttons[nextIndex]);
      });
    });
  };

  const initBubbleMap = root => {
    const buttons = [...root.querySelectorAll("[data-bubble]")];
    const activate = button => {
      const view = views[button.dataset.bubble];
      if (!view) return;
      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      setText(root, "[data-bubble-index]", view.index);
      setText(root, "[data-bubble-title]", view.bubbleTitle);
      setText(root, "[data-bubble-copy]", view.bubbleCopy);
      setText(root, "[data-bubble-test]", view.test);
      setText(root, "[data-bubble-decision]", view.decision);
    };
    buttons.forEach(button => button.addEventListener("click", () => activate(button)));
    addArrowNavigation(buttons, activate);
  };

  const initMarketLens = root => {
    const buttons = [...root.querySelectorAll("[data-lens]")];
    const activate = button => {
      const view = views[button.dataset.lens];
      if (!view) return;
      buttons.forEach(item => {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      setText(root, "[data-lens-index]", view.index);
      setText(root, "[data-lens-title]", view.lensTitle);
      setText(root, "[data-lens-copy]", view.lensCopy);
      setText(root, "[data-lens-measure]", view.measure);
      setText(root, "[data-lens-change]", view.change);
    };
    buttons.forEach(button => button.addEventListener("click", () => activate(button)));
    addArrowNavigation(buttons, activate);
    const initial = buttons.find(button => button.classList.contains("is-active")) || buttons[0];
    if (initial) activate(initial);
  };

  const bubbleMap = document.querySelector("[data-market-bubbles]");
  const marketLens = document.querySelector("[data-market-lens]");
  if (bubbleMap) initBubbleMap(bubbleMap);
  if (marketLens) initMarketLens(marketLens);
})();
