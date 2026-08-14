import type { PropertiesHyphen } from "csstype";
type SelectorRulesValue = string | PropertiesHyphen | SelectorRules;
type SelectorRules = {
  [selector: string]: SelectorRulesValue;
};
export type { PropertiesHyphen, SelectorRules };

const { document, CSSStyleSheet: CSSInterface } = globalThis;

const isString = (str: unknown): str is string => typeof str === "string";

const isNumber = (val: unknown): val is number => typeof val === "number";

const isCSSStyleSheet = (obj: unknown): obj is CSSStyleSheet =>
  !!obj &&
  typeof obj === "object" &&
  ((CSSInterface && obj instanceof CSSInterface) ||
    (typeof (obj as CSSStyleSheet).insertRule === "function" &&
      isNumber((obj as CSSStyleSheet).cssRules?.length)));

const createStyleSheet = () =>
  document
    ? (document.head || document.documentElement).appendChild(
        document.createElement("style"),
      ).sheet
    : null;

const mapRules = (rules: SelectorRulesValue): string[] => {
  if (isString(rules)) return [rules];
  const stringRules: string[] = [];
  for (const rule of Object.entries(rules)) {
    const [sel, styles]: [string, SelectorRulesValue] = rule;
    if (isString(styles)) {
      stringRules.push(`${sel}{${styles}}`);
      continue;
    }

    const entries: [string, SelectorRulesValue][] = Object.entries(styles);
    if (!entries.length) continue;

    const parts: string[] = [];
    let declarations: string[] = [];
    const flushDeclarations = () => {
      if (declarations.length) {
        parts.push(declarations.join(";"));
        declarations = [];
      }
    };
    for (const [key, value] of entries) {
      if (isString(value)) declarations.push(`${key}:${value}`);
      else {
        flushDeclarations();
        parts.push(mapRules({ [key]: value }).join(""));
      }
    }
    flushDeclarations();
    stringRules.push(`${sel}{${parts.join(";")}}`);
  }
  return stringRules;
};

/**
 * Dynamically adds CSS rules to a stylesheet.
 *
 * The function accepts flexible argument forms. Common call shapes:
 * - addCSSRules(selector, cssText, styleSheet)
 * - addCSSRules(selector, styleObject, styleSheet)
 * - addCSSRules({ '.a': { color: 'red' }, ... }, styleSheet)
 *
 * @param selectorOrRules - If an object: map of selector => style object or CSS string.
 *   If a string: when `styles` is a string or plain object it's treated as a selector;
 *   otherwise it's treated as a complete CSS rule text.
 * @param stylesOrStyleSheet - If a string: CSS declarations (e.g. "color: red;"). If an
 *   object: map of CSS property to value. Example:
 *     {
 *       color: "red",
 *       "margin-top": "10px",
 *       transition: "opacity 0.3s ease-in-out"
 *     }
 *   If a CSSStyleSheet: treated as the target stylesheet (same effect as passing it as
 *   the final argument).
 * @param styleSheet - Optional explicit target stylesheet. If omitted, a new stylesheet
 *   is created in the document.
 * @returns The stylesheet containing the added rule(s), or `undefined` if no rule was
 *   added.
 *
 * Notes:
 * - `insertRule` can throw a DOMException for invalid rules.
 *
 * Design notes:
 * - This function assumes a browser or browser-like environment (with `document`).
 *   However, if a user supplies a stylesheet, the function does not access `document`
 *   and should work in SSR/test environments.
 * - Error handling is delegated to the browser: invalid CSS rules or selectors will
 *   throw via `insertRule`.
 * - Property names must be valid CSS (including vendor prefixes and kebab-case); no
 *   automatic conversion is performed.
 * - Invalid input (e.g., selector with no styles) will throw as per native API
 *   behavior.
 */
const addCSSRules: {
  (
    rules: SelectorRules | string,
    styleSheet?: CSSStyleSheet | null,
    _?: never,
  ): CSSStyleSheet | undefined;
  (
    selector: string,
    styles?: string | SelectorRules,
    styleSheet?: CSSStyleSheet | null,
  ): CSSStyleSheet | undefined;
} = (selectorOrRules, stylesOrStyleSheet, styleSheet) => {
  if (!selectorOrRules) return;

  if (isCSSStyleSheet(stylesOrStyleSheet)) styleSheet ??= stylesOrStyleSheet;
  else if (stylesOrStyleSheet && isString(selectorOrRules))
    selectorOrRules = {
      [selectorOrRules]: stylesOrStyleSheet,
    };

  const rules = mapRules(selectorOrRules);
  if (!rules.length) return;

  styleSheet ??= createStyleSheet();
  if (!styleSheet) return;

  for (const rule of rules)
    styleSheet.insertRule(rule, styleSheet.cssRules.length);

  return styleSheet;
};

export default addCSSRules;
