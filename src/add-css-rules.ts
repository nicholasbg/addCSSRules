export type StyleObject = Record<string, string>;
export type SelectorRules = Record<string, string | StyleObject>;

const isString = (str: unknown): str is string => typeof str === "string";

const isCSSStyleSheet = (obj: unknown): obj is CSSStyleSheet =>
  Boolean(obj) &&
  ((typeof CSSStyleSheet !== "undefined" && obj instanceof CSSStyleSheet) ||
    (typeof obj === "object" &&
      typeof (obj as CSSStyleSheet).insertRule === "function" &&
      typeof (obj as CSSStyleSheet).cssRules?.length === "number"));

const createStyleSheet = () =>
  typeof document !== "undefined"
    ? (document.head || document.documentElement).appendChild(
        document.createElement("style"),
      ).sheet
    : null;

const addRule = (
  selectorOrRule: string,
  styles: string | StyleObject | null | undefined,
  sheet: CSSStyleSheet,
): number | undefined => {
  if (!selectorOrRule) return;
  if (isString(styles)) selectorOrRule += `{${styles}}`;
  else if (styles)
    selectorOrRule += `{${Object.entries(styles)
      .map(([prop, val]) => `${prop}:${val}`)
      .join(";")}}`;

  return sheet.insertRule(selectorOrRule, sheet.cssRules.length);
};

type AddCSSRules = {
  (
    rules: SelectorRules,
    styleSheet?: CSSStyleSheet | null,
    empty?: never,
  ): CSSStyleSheet | undefined;
  (
    selector: string,
    styleSheet?: CSSStyleSheet | null,
    empty?: never,
  ): CSSStyleSheet | undefined;
  (
    selector: string,
    styles: string | StyleObject,
    styleSheet?: CSSStyleSheet | null,
  ): CSSStyleSheet | undefined;
};

/**
 * Dynamically adds CSS rules to a stylesheet.
 *
 * The function accepts flexible argument forms. Common call shapes:
 * - addCSSRules(selector, cssText, styleSheet)
 * - addCSSRules(selector, styleObject, styleSheet)
 * - addCSSRules(selector, styleSheet)
 * - addCSSRules({ '.a': { color: 'red' }, ... }, styleSheet)
 *
 * @param {Object<string, string|Object<string, string>>|string} selectorOrRules If an
 *   object: map of selector => style object or CSS string. If a string: when `styles`
 *   is a string or plain object it's treated as a selector; otherwise it's treated as
 *   a complete CSS rule text.
 * @param {string|Object|CSSStyleSheet|null} [stylesOrStyleSheet] If a string: CSS
 *   declarations (e.g. "color: red;"). If an object: object of css styles with key as
 *   property and value as value. Example:
 *     {
 *       color: "red",
 *       "margin-top": "10px",
 *       transition: "opacity 0.3s ease-in-out"
 *     }
 *   If a CSSStyleSheet: treated as the target stylesheet (same effect as passing it
 *   as the final argument).
 * @param {CSSStyleSheet|null} [styleSheet] Optional explicit target stylesheet. If
 *   omitted, the last stylesheet in the document is used (and created if none exist).
 * @returns {CSSStyleSheet|undefined} Returns `undefined` if no rule was added.
 *   Otherwise returns the stylesheet containing the last added rule.
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
const addCSSRules: AddCSSRules = (
  selectorOrRules,
  stylesOrStyleSheet,
  styleSheet,
) => {
  if (isCSSStyleSheet(stylesOrStyleSheet)) {
    styleSheet ??= stylesOrStyleSheet;
    stylesOrStyleSheet = undefined;
  }
  const sheet = styleSheet || createStyleSheet();

  if (sheet) {
    let lastIndex;
    if (isString(selectorOrRules))
      lastIndex = addRule(selectorOrRules, stylesOrStyleSheet, sheet);
    else
      for (const [selector, styles] of Object.entries(selectorOrRules))
        lastIndex = addRule(selector, styles, sheet) ?? lastIndex;

    if (lastIndex != null) return sheet;
  }
};

export default addCSSRules;
