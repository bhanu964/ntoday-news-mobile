const viewports = [
  { name: '360x640 (Short Mobile)', pageHeight: 584 },
  { name: '390x844 (Standard Phone)', pageHeight: 734 },
  { name: '412x915 (Samsung / Pixel)', pageHeight: 800 },
  { name: '480px Web Column', pageHeight: 780 },
];

function testCardLayout(pageHeight, headlineLines, bodyLines) {
  const isShortScreen = pageHeight < 660;
  const photoRatio = isShortScreen ? 0.33 : 0.40;
  const headlineFontSize = isShortScreen ? 18 : 19.5;
  const headlineLineHeight = isShortScreen ? 25 : 28;
  const bodyFontSize = isShortScreen ? 14.5 : 16;
  const bodyLineHeight = isShortScreen ? 22 : 25;

  const photoHeight = Math.round(pageHeight * photoRatio);
  const textPaddingTop = 10;
  const textLeftMargin = 12;

  const actualHeadlineHeight = headlineLines === 1 ? headlineLineHeight : 2 * headlineLineHeight;
  const headlineToBodyGap = 6;

  const headlineTop = photoHeight + textPaddingTop;
  const headlineBottom = headlineTop + actualHeadlineHeight;
  const bodyTop = headlineBottom + headlineToBodyGap;
  const actualBodyLines = Math.min(10, bodyLines);
  const actualBodyHeight = actualBodyLines * bodyLineHeight;
  const bodyBottom = bodyTop + actualBodyHeight;

  const metaRowTop = pageHeight - 88;
  const metaRowBottom = pageHeight - 56;
  const actionBarTop = pageHeight - 56;
  const actionBarBottom = pageHeight;

  const safetyGap = metaRowTop - bodyBottom;

  return {
    photoRatio: (photoRatio * 100).toFixed(0) + '%',
    photoHeight,
    textLeftMargin,
    headlineLines,
    headlineTop,
    headlineBottom,
    bodyTop,
    actualBodyLines,
    bodyBottom,
    metaRowTop,
    metaRowBottom,
    actionBarTop,
    actionBarBottom,
    safetyGap,
  };
}

for (const vp of viewports) {
  const t1 = testCardLayout(vp.pageHeight, 1, 10);
  const t2 = testCardLayout(vp.pageHeight, 2, 10);
  console.log(`${vp.name} (PAGE_HEIGHT = ${vp.pageHeight}px):`);
  console.log(`  Photo (${t1.photoRatio}): ${t1.photoHeight}px`);
  console.log(`  1-Line: head [${t1.headlineTop}-${t1.headlineBottom}], body starts ${t1.bodyTop}, ends ${t1.bodyBottom}, gap to meta: ${t1.safetyGap}px`);
  console.log(`  2-Line: head [${t2.headlineTop}-${t2.headlineBottom}], body starts ${t2.bodyTop}, ends ${t2.bodyBottom}, gap to meta: ${t2.safetyGap}px`);
  console.log(`  Meta row: [${t1.metaRowTop}-${t1.metaRowBottom}], Action bar: [${t1.actionBarTop}-${t1.actionBarBottom}]\n`);
}
