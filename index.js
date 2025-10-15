/**
 * Dynamically adds CSS rules to a stylesheet.
 *
 * Usage:
 * - Add a single rule:
 *     addCSSRules('.my-class', { color: 'red', marginTop: '1em' });
 * - Add multiple rules:
 *     addCSSRules({
 *       '.foo': { color: 'blue' },
 *       '.bar': 'background: yellow;'
 *     });
 * - Specify a target stylesheet:
 *     addCSSRules('.baz', { fontWeight: 'bold' }, document.styleSheets[0]);
 *
 * @param {object|string} selectorOrRules
 *   - If an object: Map of selector strings to style objects or CSS strings.
 *   - If a string
 *     - If styles is a string or plain object: CSS selector for the rule.
 *     - Otherwise a full CSS rule.
 * @param {string|object|CSSStyleSheet} [styles]
 *   - If a string: CSS declarations (e.g., "color: red;").
 *   - If an object: JS style object (e.g., { color: 'red', marginTop: '1em' }).
 *   - If a CSSStyleSheet: Used as the target stylesheet.
 * @param {CSSStyleSheet} [styleSheet]
 *   - Optional target stylesheet. If omitted, uses the last stylesheet in the document,
 *     or creates one if none exist.
 * @returns {[CSSStyleSheet, number]|undefined}
 *   - Returns undefined if no rule was added.
 *   - [stylesheet, ruleIndex] for the last added rule.
 *
 * Notes:
 * - Style objects are converted from camelCase to kebab-case CSS.
 * - If the selector or rule is invalid, insertRule will throw a DOMException.
 * - If styles is a CSSStyleSheet, it is treated as the target stylesheet.
 */
const addCSSRules = (selectorOrRules, styles, styleSheet) => {
  if (!selectorOrRules) return;
  const isString = (val) => typeof val === "string";
  /**
   * @param {string} selectorOrRule
   * @param {string} [styles]
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
      const sheets = document.styleSheets,
        sheetsLen = sheets.length;
      if (sheetsLen) return sheets[sheetsLen - 1];
      document.head.appendChild(document.createElement("style"));
      return getStyleSheet();
    };

    /**
     * @param {object|string|undefined} obj
     * @returns {string|undefined}
     */
    const stylesToString = (obj) => {
      if (!obj || isString(obj)) return obj;

      const toKebabCase = (str) =>
        str.replace(
          /([a-z0-9])?([A-Z])/g,
          (_, pre, nxt) => (pre ? pre + "-" : "") + nxt.toLowerCase(),
        );
      let stylesString = "";
      for (const [property, value] of Object.entries(obj)) {
        stylesString += `${toKebabCase(property)}:${value};`;
      }
      return stylesString;
    };

    styleSheet = styleSheet || getStyleSheet();
    styles = stylesToString(styles);

    return [
      styleSheet,
      styleSheet.insertRule(
        selectorOrRule && isString(styles)
          ? `${selectorOrRule}{${styles}}`
          : selectorOrRule,
        styleSheet.cssRules.length,
      ),
    ];
  };

  if (styles instanceof CSSStyleSheet) {
    styleSheet = styles;
    styles = undefined;
  }

  if (isString(selectorOrRules)) {
    return addRule(selectorOrRules, styles, styleSheet);
  }

  let result;
  for (const entry of Object.entries(selectorOrRules)) {
    result = addRule(...entry, styleSheet) ?? result;
  }
  return result;
};
