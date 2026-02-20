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

// mixed leaf + nested objects

test("handles mixed leaf styles and nested selectors in the same object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(
    {
      ".parent": {
        color: "red",
        "font-size": "14px",
        ".child": { display: "block" },
      },
    },
    sheet,
  );

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(
    sheet.cssRules[0].cssText,
    ".parent{color:red;font-size:14px;.child{display:block}}",
  );
});

test("handles nested selectors followed by leaf styles", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(
    {
      ".parent": {
        ".child": { display: "block" },
        color: "red",
      },
    },
    sheet,
  );

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(
    sheet.cssRules[0].cssText,
    ".parent{.child{display:block};color:red}",
  );
});

// edge cases

test("returns undefined for empty rules object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules({}, sheet);
  assert.equal(result, undefined);
});

test("returns undefined for empty style object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(".x", {}, sheet);
  assert.equal(result, undefined);
});

test("returns undefined for empty string selector", () => {
  const sheet = createMockSheet();
  const result = addCSSRules("", sheet);
  assert.equal(result, undefined);
});

// at-rules

test("adds @supports rule via nested object", () => {
  const sheet = createMockSheet();
  const result = addCSSRules(
    {
      "@supports (display: grid)": {
        ".grid": { display: "grid" },
      },
    },
    sheet,
  );

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(
    sheet.cssRules[0].cssText,
    "@supports (display: grid){.grid{display:grid}}",
  );
});

test("adds @keyframes as a full rule string", () => {
  const sheet = createMockSheet();
  const rule = "@keyframes fade { from { opacity: 0 } to { opacity: 1 } }";
  const result = addCSSRules(rule, sheet);

  assert.equal(result, sheet);
  assert.equal(sheet.cssRules.length, 1);
  assert.equal(sheet.cssRules[0].cssText, rule);
});

// accumulation

test("multiple calls accumulate rules on the same sheet", () => {
  const sheet = createMockSheet();
  addCSSRules(".a", "color:red;", sheet);
  addCSSRules(".b", { display: "block" }, sheet);
  addCSSRules({ ".c": "font-size:12px;" }, sheet);

  assert.equal(sheet.cssRules.length, 3);
  assert.equal(sheet.cssRules[0].cssText, ".a{color:red;}");
  assert.equal(sheet.cssRules[1].cssText, ".b{display:block}");
  assert.equal(sheet.cssRules[2].cssText, ".c{font-size:12px;}");
});
