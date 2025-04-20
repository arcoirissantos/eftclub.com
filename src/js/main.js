// -------- Window resize animation --------//

(() => {
  const container = document.querySelector(".container");
  let ticking = false;

  function animateWrap() {
    // 1. First: record current positions
    const items = Array.from(container.children);
    const firstRects = items.map((el) => el.getBoundingClientRect());

    // 2. Force layout (so wrap can happen on next frame)
    //    Here we just wait for the next RAF after resize
    requestAnimationFrame(() => {
      // 3. Last: get new positions
      const lastRects = items.map((el) => el.getBoundingClientRect());

      // 4. Invert: apply deltas as transforms
      items.forEach((el, i) => {
        const dx = firstRects[i].left - lastRects[i].left;
        const dy = firstRects[i].top - lastRects[i].top;
        if (dx || dy) {
          el.style.transform = `translate(${dx}px, ${dy}px)`;
        }
      });

      // 5. Play: remove transforms so CSS transition moves them
      requestAnimationFrame(() => {
        items.forEach((el) => {
          el.style.transform = "";
        });
      });
    });
  }

  // Listen for window resize
  window.addEventListener("resize", () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        animateWrap();
        ticking = false;
      });
      ticking = true;
    }
  });
})();
