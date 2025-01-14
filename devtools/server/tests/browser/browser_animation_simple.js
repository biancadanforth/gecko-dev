/* vim: set ft=javascript ts=2 et sw=2 tw=80: */
/* Any copyright is dedicated to the Public Domain.
   http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

// Simple checks for the AnimationsActor

add_task(async function() {
  let {client, walker, animations} = await initAnimationsFrontForUrl(
    "data:text/html;charset=utf-8,<title>test</title><div></div>");

  ok(animations, "The AnimationsFront was created");
  ok(animations.getAnimationPlayersForNode,
     "The getAnimationPlayersForNode method exists");
  ok(animations.toggleAll, "The toggleAll method exists");
  ok(animations.playAll, "The playAll method exists");
  ok(animations.pauseAll, "The pauseAll method exists");

  let didThrow = false;
  try {
    await animations.getAnimationPlayersForNode(null);
  } catch (e) {
    didThrow = true;
  }
  ok(didThrow, "An exception was thrown for a missing NodeActor");

  let invalidNode = await walker.querySelector(walker.rootNode, "title");
  let players = await animations.getAnimationPlayersForNode(invalidNode);
  ok(Array.isArray(players), "An array of players was returned");
  is(players.length, 0, "0 players have been returned for the invalid node");

  await client.close();
  gBrowser.removeCurrentTab();
});
