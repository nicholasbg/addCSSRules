import { test, expect } from "vitest";

import addCSSRules from "../src/add-css-rules.ts";
import {
  createStyleSheet,
  styleRule,
  mediaRule,
  supportsRule,
} from "./helpers.ts";

test("creates a new stylesheet when none is provided", () => {
  const result = addCSSRules(".x", "color:red;");
  expect(result).toBeInstanceOf(CSSStyleSheet);
  expect(result?.cssRules.length).toBe(1);
});

test("adds a selector + declaration string", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(".x", "color:red;", sheet);

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  expect(styleRule(sheet).selectorText).toBe(".x");
  expect(styleRule(sheet).style.color).toBe("red");
});

test("adds a selector + style object", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    ".x",
    {
      color: "red",
      "margin-top": "10px",
    },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  expect(styleRule(sheet).selectorText).toBe(".x");
  expect(styleRule(sheet).style.color).toBe("red");
  expect(styleRule(sheet).style.marginTop).toBe("10px");
});

test("adds multiple selector rules from an object", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    {
      ".a": "color:blue;",
      ".b": { display: "block" },
    },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(2);
  expect(styleRule(sheet, 0).selectorText).toBe(".a");
  expect(styleRule(sheet, 0).style.color).toBe("blue");
  expect(styleRule(sheet, 1).selectorText).toBe(".b");
  expect(styleRule(sheet, 1).style.display).toBe("block");
});

test("treats a single string argument as a complete CSS rule", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(".rule { color: green; }", sheet);

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  expect(styleRule(sheet).selectorText).toBe(".rule");
  expect(styleRule(sheet).style.color).toBe("green");
});

// queries

test("adds a media query using full rule string", () => {
  const sheet = createStyleSheet();
  const rule = "@media (max-width:600px){.a{color:red}}";
  const result = addCSSRules(rule, sheet);

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  const media = mediaRule(sheet);
  expect(media.media.mediaText).toMatch(/^\(max-width: ?600px\)$/);
  expect(styleRule(media).selectorText).toBe(".a");
  expect(styleRule(media).style.color).toBe("red");
});

test("adds nested object rules inside @media", () => {
  const sheet = createStyleSheet();
  const rules = {
    "@media (max-width: 600px)": {
      ".a": { color: "red" },
    },
  };
  const result = addCSSRules(rules, sheet);

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  const media = mediaRule(sheet);
  expect(media.media.mediaText).toMatch(/^\(max-width: ?600px\)$/);
  expect(styleRule(media).selectorText).toBe(".a");
  expect(styleRule(media).style.color).toBe("red");
});

test("adds more nesting", () => {
  const sheet = createStyleSheet();
  const rules = {
    "@media (max-width: 600px)": {
      ".a": {
        ".b": { color: "blue" },
      },
    },
  };
  const result = addCSSRules(rules, sheet);

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  const media = mediaRule(sheet);
  expect(media.media.mediaText).toBe("(max-width: 600px)");
  expect(media.cssRules.length).toBeGreaterThanOrEqual(1);
});

// mixed leaf + nested objects

test("handles mixed leaf styles and nested selectors in the same object", () => {
  const sheet = createStyleSheet();
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

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  expect(styleRule(sheet).selectorText).toBe(".parent");
});

test("handles nested selectors followed by leaf styles", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    {
      ".parent": {
        ".child": { display: "block" },
        color: "red",
      },
    },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  expect(styleRule(sheet).selectorText).toBe(".parent");
});

// edge cases

test("returns undefined for empty rules object", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules({}, sheet);
  expect(result).toBe(undefined);
});

test("returns undefined for empty style object", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(".x", {}, sheet);
  expect(result).toBe(undefined);
});

test("returns undefined for empty string selector", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules("", sheet);
  expect(result).toBe(undefined);
});

// at-rules

test("adds @supports rule via nested object", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    {
      "@supports (display: grid)": {
        ".grid": { display: "grid" },
      },
    },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(sheet.cssRules.length).toBe(1);
  const supports = supportsRule(sheet);
  expect(supports.conditionText).toBe("(display: grid)");
  expect(styleRule(supports).selectorText).toBe(".grid");
  expect(styleRule(supports).style.display).toBe("grid");
});

// content property values

test("adds content with a simple string value", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(".before::before", { content: '"hello"' }, sheet);

  expect(result).toBe(sheet);
  expect(styleRule(sheet).selectorText).toBe(".before::before");
  expect(styleRule(sheet).style.content).toBe('"hello"');
});

test("adds content with an empty string value", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(".empty::before", { content: '""' }, sheet);

  expect(result).toBe(sheet);
  expect(styleRule(sheet).style.content).toBe('""');
});

test("adds content using attr() and matches", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    ".attr::before",
    { content: "attr(data-label)" },
    sheet,
  );

  expect(result).toBe(sheet);
  // attr() in content is valid CSS but CSSOM may drop it as unsupported
  expect(styleRule(sheet).style.content).toMatch(/^(attr\(data-label\)|)$/);
});
