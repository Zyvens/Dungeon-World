(() => {
  "use strict";
  const classes = window.DW_CLASSES || {};
  const meta = {
    bardo: { advancedSplit: 10 },
    barbaro: { advancedSplit: 12 },
    clerigo: { advancedSplit: 11 },
    druida: { advancedSplit: 10 },
    engenheiro: { advancedSplit: 10 },
    guerreiro: { advancedSplit: 10 },
    ladrao: { advancedSplit: 9 },
    mago: { advancedSplit: 10 },
    paladino: { advancedSplit: 10 },
    ranger: { advancedSplit: 10, firstAdvanceOnly: ["Meio-Elfo"] }
  };

  for (const [id, rules] of Object.entries(meta)) {
    if (!classes[id]) continue;
    Object.assign(classes[id], rules);
  }
})();
