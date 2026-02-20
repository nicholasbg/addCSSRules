export type StyleObject = Record<string, string>;
export type SelectorRules = {
  [selector: string]: string | StyleObject | SelectorRules;
};
export default (function () {
  const doc = globalThis.document;
  const CSSStyleSheetInterface = globalThis.CSSStyleSheet;

  const isString = (str: unknown): str is string => typeof str === "string";

  /**
   * Checks if a value is an object (excluding null).
   * @param val - The value to check.
   * @returns True if the value is an object.
   */
  const isNonNullObject = (val: unknown): val is object =>
    Boolean(val) && typeof val === "object";

  const isUndefined = (val: unknown): val is undefined =>
    typeof val === "undefined";

  const isCSSStyleSheet = (obj: unknown): obj is CSSStyleSheet =>
    isNonNullObject(obj) &&
    ((!isUndefined(CSSStyleSheetInterface) &&
      obj instanceof CSSStyleSheetInterface) ||
      (typeof (obj as CSSStyleSheet).insertRule === "function" &&
        typeof (obj as CSSStyleSheet).cssRules?.length === "number"));

  const isStyleObject = (
    val: StyleObject | SelectorRules | null | undefined | string,
  ): val is StyleObject =>
    isNonNullObject(val) &&
    Object.values(val).every((value) => isString(value));

  const createStyleSheet = () =>
    isUndefined(doc)
      ? null
      : (doc.head || doc.documentElement).appendChild(
          doc.createElement("style"),
        ).sheet;

  const mapRules = (rules: SelectorRules | StyleObject | string): string[] =>
    (isString(rules)
      ? [rules]
      : Object.entries(rules).map(([sel, styles]) => {
          if (isString(styles)) return `${sel}{${styles}}`;

          if (isNonNullObject(styles)) {
            const entries = Object.entries(styles);
            if (entries.length)
              return `${sel}{${
                isStyleObject(styles)
                  ? entries
                      .map(([property, cssValue]) => `${property}:${cssValue}`)
                      .join(";")
                  : mapRules(styles).join("")
              }}`;
          }

          return "";
        })
    ).filter(Boolean);

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
  const addCSSRules: {
    (
      rules: SelectorRules,
      styleSheet?: CSSStyleSheet | null,
      _?: never,
    ): CSSStyleSheet | undefined;
    (
      selector: string,
      styles?: string | StyleObject,
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

    if (!isUndefined(lastIndex)) return sheet;
  };
  return addCSSRules;
})();
