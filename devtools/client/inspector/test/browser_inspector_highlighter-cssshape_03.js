/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

"use strict";

// Make sure that the CSS shapes highlighters have the correct size
// in different zoom levels and with different geometry-box.

const TEST_URL = URL_ROOT + "doc_inspector_highlighter_cssshapes.html";
const HIGHLIGHTER_TYPE = "ShapesHighlighter";
const TEST_LEVELS = [0.5, 1, 2];

add_task(async function() {
  let inspector = await openInspectorForURL(TEST_URL);
  let helper = await getHighlighterHelperFor(HIGHLIGHTER_TYPE)(inspector);
  let {testActor} = inspector;

  await testZoomSize(testActor, helper);
  await testGeometryBox(testActor, helper);
  await testStrokeBox(testActor, helper);

  await helper.finalize();
});

async function testZoomSize(testActor, helper) {
  await helper.show("#polygon", {mode: "cssClipPath"});
  let quads = await testActor.getAllAdjustedQuads("#polygon");
  let { top, left, width, height } = quads.border[0].bounds;
  let expectedStyle = `top:${top}px;left:${left}px;width:${width}px;height:${height}px;`;

  // The top/left/width/height of the highlighter should not change at any zoom level.
  // It should always match the element being highlighted.
  for (let zoom of TEST_LEVELS) {
    info(`Setting zoom level to ${zoom}.`);
    await testActor.zoomPageTo(zoom, helper.actorID);
    let style = await helper.getElementAttribute("shapes-shape-container", "style");

    is(style, expectedStyle, `Highlighter has correct quads at zoom level ${zoom}`);
  }
}

async function testGeometryBox(testActor, helper) {
  await testActor.zoomPageTo(1, helper.actorID);
  await helper.show("#ellipse", {mode: "cssClipPath"});
  let quads = await testActor.getAllAdjustedQuads("#ellipse");
  let { top: cTop, left: cLeft,
        width: cWidth, height: cHeight } = quads.content[0].bounds;
  let expectedStyle = `top:${cTop}px;left:${cLeft}px;` +
                      `width:${cWidth}px;height:${cHeight}px;`;
  let style = await helper.getElementAttribute("shapes-shape-container", "style");
  is(style, expectedStyle, "Highlighter has correct quads for content-box");

  await helper.show("#ellipse-padding-box", {mode: "cssClipPath"});
  quads = await testActor.getAllAdjustedQuads("#ellipse-padding-box");
  let { top: pTop, left: pLeft,
        width: pWidth, height: pHeight } = quads.padding[0].bounds;
  expectedStyle = `top:${pTop}px;left:${pLeft}px;` +
                  `width:${pWidth}px;height:${pHeight}px;`;
  style = await helper.getElementAttribute("shapes-shape-container", "style");
  is(style, expectedStyle, "Highlighter has correct quads for padding-box");
}

async function testStrokeBox(testActor, helper) {
  // #rect has a stroke and doesn't have the clip-path option stroke-box,
  // so we must adjust the quads to reflect the object bounding box.
  await helper.show("#rect", {mode: "cssClipPath"});
  let quads = await testActor.getAllAdjustedQuads("#rect");
  let { top, left, width, height } = quads.border[0].bounds;
  let { highlightedNode } = helper;
  let computedStyle = await highlightedNode.getComputedStyle();
  let strokeWidth = computedStyle["stroke-width"].value;
  let delta = parseFloat(strokeWidth) / 2;

  let expectedStyle = `top:${top + delta}px;left:${left + delta}px;` +
                      `width:${width - 2 * delta}px;height:${height - 2 * delta}px;`;
  let style = await helper.getElementAttribute("shapes-shape-container", "style");
  is(style, expectedStyle,
    "Highlighter has correct quads for SVG rect with stroke and stroke-box");
}
