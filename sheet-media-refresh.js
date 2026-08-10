(() => {
  "use strict";
  let refreshing = false;
  window.addEventListener("dw-media-changed", () => {
    if (refreshing) return;
    refreshing = true;
    const root = document.getElementById("equipmentList");
    if (root) {
      root.querySelectorAll(".equipment-media").forEach((el) => el.remove());
      const marker = document.createComment("media-refresh");
      root.appendChild(marker);
      marker.remove();
    }
    const story = document.getElementById("story");
    if (story) story.dispatchEvent(new Event("input", { bubbles: true }));
    queueMicrotask(() => { refreshing = false; });
  });
})();
