import type { PropertiesHyphen } from "csstype";

type SelectorRules = {
  [selector: string]: string | PropertiesHyphen | SelectorRules;
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

const mapRules = (rules: SelectorRules | PropertiesHyphen | string): string[] =>
  (isString(rules)
    ? [rules]
    : Object.entries(rules).map(([sel, styles]) => {
        if (isString(styles)) return `${sel}{${styles}}`;

        const entries = Object.entries(styles);
        if (!entries.length) return "";

        const parts: string[] = [];
        let declarations: string[] = [];
        const flushDeclarationsToParts = () => {
          if (declarations.length) {
            parts.push(declarations.join(";"));
            declarations = [];
          }
        };

        for (const [key, value] of entries) {
          if (isString(value)) declarations.push(`${key}:${value}`);
          else {
            flushDeclarationsToParts();
            parts.push(mapRules({ [key]: value }).join(""));
          }
        }
        flushDeclarationsToParts();
        return `${sel}{${parts.join(";")}}`;
      })
  ).filter(Boolean);

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
  let styles;
  if (isCSSStyleSheet(stylesOrStyleSheet)) styleSheet ??= stylesOrStyleSheet;
  else styles = stylesOrStyleSheet;

  const sheet = styleSheet || createStyleSheet();

  if (!selectorOrRules || !sheet) return;

  if (styles && isString(selectorOrRules))
    selectorOrRules = {
      [selectorOrRules]: styles,
    };

  let lastIndex;

  for (const rule of mapRules(selectorOrRules))
    lastIndex = sheet.insertRule(rule, sheet.cssRules.length);

  if (isNumber(lastIndex)) return sheet;
};

export default addCSSRules;
