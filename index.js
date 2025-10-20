/**
 * Dynamically adds CSS rules to a stylesheet.
 *
 * The function accepts flexible argument forms. Common call shapes:
 * - addCSSRules(selector, cssText, styleSheet)
 * - addCSSRules(selector, styleObject, styleSheet)
 * - addCSSRules(selector, styleSheet)
 * - addCSSRules({ '.a': { color: 'red' }, ... }, styleSheet)
 *
 * @param {(Object<string, string|Object<string, string>>|string|null)} [selectorOrRules]
 *   If an object: map of selector => style object or CSS string.
 *   If a string: when `styles` is a string or plain object it's treated as a selector;
 *   otherwise it's treated as a complete CSS rule text.
 * @param {(string|Object|CSSStyleSheet|null)} [stylesOrStyleSheet]
 *   If a string: CSS declarations (e.g. "color: red;").
 *   If an object: JS style object (camelCase keys allowed).
 *   If a CSSStyleSheet: treated as the target stylesheet (same effect as passing it
 *   as the final argument).
 * @param {CSSStyleSheet|null} [styleSheet]
 *   Optional explicit target stylesheet. If omitted, the last stylesheet in the document
 *   is used (and created if none exist).
 * @returns {(undefined|[CSSStyleSheet, number])}
 *   Returns undefined if no rule was added. Otherwise returns [stylesheet, ruleIndex]
 *   for the last added rule.
 *
 * Notes:
 * - insertRule may throw a DOMException for invalid rules.
 */
function addCSSRules(selectorOrRules, stylesOrStyleSheet, styleSheet) {
  if (!selectorOrRules) return;

  const isString = (val) => typeof val === "string";
  const isStyleSheet = (val) => val instanceof CSSStyleSheet;
  /**
   * @param {string} selectorOrRule
   * @param {string|Object<string, string>|null} [styles]
   * @param {CSSStyleSheet} [styleSheet]
   * @returns {[CSSStyleSheet, number]|undefined} The stylesheet and index of the
   * added rule, or undefined if no rule was added.
   */
  const addRule = (selectorOrRule, styles, styleSheet) => {
    if (!selectorOrRule) return;
    /**
     * Retrieves the last stylesheet in the document. If none exist, creates one and
     * calls itself recursively.
     *
     * @returns {CSSStyleSheet} The last stylesheet in the document.
     */
    const getStyleSheet = () => {
      const sheets = document.styleSheets;
      if (sheets.length) return sheets[sheets.length - 1];
      document.head.appendChild(document.createElement("style"));
      return getStyleSheet();
    };

    /**
     * @param {object|string|undefined|null} styles
     * @returns {string|undefined|null}
     */
    const stylesToString = (styles) => {
      if (!styles || isString(styles)) return styles;

      let stylesString = "";
      for (const [property, value] of Object.entries(styles))
        stylesString += `${property}:${value};`;

      return stylesString;
    };

    if (!isStyleSheet(styleSheet)) styleSheet = getStyleSheet();

    styles = stylesToString(styles);

    return [
      styleSheet,
      styleSheet.insertRule(
        isString(styles) ? `${selectorOrRule}{${styles}}` : selectorOrRule,
        styleSheet.cssRules.length,
      ),
    ];
  };

  if (isStyleSheet(stylesOrStyleSheet)) {
    styleSheet = styleSheet ?? stylesOrStyleSheet;
    stylesOrStyleSheet = null;
  }

  if (isString(selectorOrRules))
    return addRule(selectorOrRules, stylesOrStyleSheet, styleSheet);

  let result;
  for (const [selector, styles] of Object.entries(selectorOrRules))
    result = addRule(selector, styles, styleSheet) ?? result;

  return result;
}
