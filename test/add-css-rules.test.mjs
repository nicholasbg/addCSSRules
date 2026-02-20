import test from "node:test";
import assert from "node:assert/strict";

import addCSSRules from "../dist/add-css-rules.js";

const createMockSheet = () => ({
  cssRules: [],
  insertRule(rule, index) {
    const targetIndex = index ?? this.cssRules.length;
    this.cssRules.splice(targetIndex, 0, { cssText: rule });
    return targetIndex;
  },
});

test("returns undefined when no document and no stylesheet are available", () => {
  const result = addCSSRules(".x", "color:red;");
  assert.equal(result, undefined);
});

test("adds a selector + declaration string", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(".x", "color:red;", sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(sheet.cssRules[0].cssText, ".x{color:red;}");
});

test("adds a selector + style object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(
    ".x",
    {
      color: "red",
      "margin-top": "10px",
    },
    sheet,
  );

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(sheet.cssRules[0].cssText, ".x{color:red;margin-top:10px}");
});

test("adds multiple selector rules from an object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(
    {
      ".a": "color:blue;",
      ".b": { display: "block" },
    },
    sheet,
  );

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 2);
  assert.equal(sheet.cssRules[0].cssText, ".a{color:blue;}");
  assert.equal(sheet.cssRules[1].cssText, ".b{display:block}");
});

test("treats a single string argument as a complete CSS rule", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(".rule { color: green; }", sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(sheet.cssRules[0].cssText, ".rule { color: green; }");
});

// queries

test("adds a media query using full rule string", () => {
  const sheet = createMockSheet();
  const rule = "@media (max-width:600px){.a{color:red}}";
  const result = addCSSRules(rule, sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(sheet.cssRules[0].cssText, rule);
});

test("adds nested object rules inside @media", () => {
  const sheet = createMockSheet();
  const rules = {
    "@media (max-width: 600px)": {
      ".a": { color: "red" },
    },
  };
  const result = addCSSRules(rules, sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(
    sheet.cssRules[0].cssText,
    "@media (max-width: 600px){.a{color:red}}",
  );
});

test("adds more nesting", () => {
  const sheet = createMockSheet();
  const rules = {
    "@media (max-width: 600px)": {
      ".a": {
        ".b": { color: "blue" },
      },
    },
  };
  const result = addCSSRules(rules, sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(
    sheet.cssRules[0].cssText,
    "@media (max-width: 600px){.a{.b{color:blue}}}",
  );
});
