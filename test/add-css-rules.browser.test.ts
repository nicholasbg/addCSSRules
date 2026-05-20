import { test, expect } from "vitest";

import addCSSRules from "../src/add-css-rules.ts";
import { createStyleSheet, styleRule } from "./helpers.ts";

// These tests require a real browser CSSOM to pass correctly

test("adds content with colons and semicolons inside quotes", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    ".tricky::after",
    { content: '"price: $5; tax: $1"' },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(styleRule(sheet).selectorText).toBe(".tricky::after");
  expect(styleRule(sheet).style.content).toBe('"price: $5; tax: $1"');
});

test("adds content using attr()", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    ".attr::before",
    { content: "attr(data-label)" },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(styleRule(sheet).style.content).toBe("attr(data-label)");
});

test("adds content alongside other declarations", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules(
    ".icon::before",
    { content: '"\\2713"', color: "green", "font-size": "16px" },
    sheet,
  );

  expect(result).toBe(sheet);
  expect(styleRule(sheet).style.content).toBe('"✓"');
  expect(styleRule(sheet).style.color).toBe("green");
  expect(styleRule(sheet).style.fontSize).toBe("16px");
});

test("adds content as a CSS string with special characters", () => {
  const sheet = createStyleSheet();
  const result = addCSSRules('.special::before { content: "a{b}c"; }', sheet);

  expect(result).toBe(sheet);
  expect(styleRule(sheet).style.content).toBe('"a{b}c"');
});
