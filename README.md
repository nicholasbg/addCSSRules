# add-css-rules

A lightweight utility for dynamically adding CSS rules to stylesheets in the browser.

This package is ESM-only.

## Installation

```bash
npm install add-css-rules
```

## Requirements

- Node.js `>=26`
- For contributors: use the project `.nvmrc` (`nvm use`)

## Usage

### Basic Usage

```javascript
import addCSSRules from "add-css-rules";

// Add a single rule
addCSSRules(".my-class", "color: red; font-size: 16px;");

// Add a rule with style object
addCSSRules(".my-class", {
  color: "red",
  "font-size": "16px",
  "margin-top": "10px",
});

// Add multiple rules at once
addCSSRules({
  ".header": { color: "blue", "font-weight": "bold" },
  ".footer": "background: gray; padding: 20px;",
});
```

### Advanced Usage

```javascript
import addCSSRules from "add-css-rules";

// Use with a specific stylesheet
const myStyleSheet = document.styleSheets[0];
addCSSRules(".dynamic-rule", { color: "green" }, myStyleSheet);

// The function returns the stylesheet containing the added rule
const sheet = addCSSRules(".new-rule", "border: 1px solid black;");
console.log(sheet); // CSSStyleSheet object
```

### Nesting

Object syntax supports nesting for at-rules (`@media`, `@supports`, etc.) and CSS nesting:

```javascript
// @media query with nested selectors
addCSSRules({
  "@media (max-width: 600px)": {
    ".sidebar": { display: "none" },
    ".content": { width: "100%" },
  },
});

// CSS nesting
addCSSRules({
  ".card": {
    ".title": { "font-weight": "bold" },
    ".body": { padding: "1rem" },
  },
});

// Mixed leaf styles and nested selectors in the same object
addCSSRules({
  ".card": {
    padding: "1rem",
    "border-radius": "8px",
    ".title": { "font-size": "1.5rem" },
  },
});

// @supports
addCSSRules({
  "@supports (display: grid)": {
    ".layout": { display: "grid", "grid-template-columns": "1fr 1fr" },
  },
});
```

### TypeScript

The package exports `PropertiesHyphen` (from [`csstype`](https://github.com/frenic/csstype)) and `SelectorRules` types for typing your rule objects. `PropertiesHyphen` provides autocompletion and compile-time type safety for hyphen-case CSS property names.

```typescript
import addCSSRules, {
  type PropertiesHyphen,
  type SelectorRules,
} from "add-css-rules";

const styles: PropertiesHyphen = {
  color: "red",
  "font-size": "16px",
};

const rules: SelectorRules = {
  ".header": { color: "blue", "font-weight": "bold" },
  "@media (max-width: 600px)": {
    ".header": { "font-size": "14px" },
  },
};

addCSSRules(".my-class", styles);
addCSSRules(rules);
```

## API

### `addCSSRules(selectorOrRules, stylesOrStyleSheet?, styleSheet?)`

Dynamically adds CSS rules to a stylesheet.

#### Call Forms

- `addCSSRules(selector, cssText, styleSheet?)`
- `addCSSRules(selector, styleObject, styleSheet?)`
- `addCSSRules(rulesObject, styleSheet?)`
- `addCSSRules(fullRuleString, styleSheet?)`

#### Parameters

- `selectorOrRules` (`string | SelectorRules`):
  - If `stylesOrStyleSheet` is a declaration string or style object, this is treated as a CSS selector (for example `".card"`).
  - If no declaration input is provided, this is treated as a full CSS rule string (for example `".card{color:red}"` or `"@media (...) {...}"`).
  - If an object, keys are selectors/at-rules and values are declaration strings, `PropertiesHyphen` objects, or nested rule objects.
- `stylesOrStyleSheet` (`string | PropertiesHyphen | CSSStyleSheet | null`):
  - Declaration string (for example `"color:red;"`) or style object when using selector mode.
  - Target stylesheet when using object mode or full-rule-string mode.
- `styleSheet` (`CSSStyleSheet | null`): Optional explicit target stylesheet. If omitted, a new stylesheet is created in the document.

#### Returns

`CSSStyleSheet | undefined`: The stylesheet containing the added rule(s), or `undefined` if no rules were added.

## Browser Support

Works in all modern browsers that support `CSSStyleSheet.insertRule()`.

## Development

```bash
npm install
npm run typecheck
npm test
```

If browser binaries are missing (for example in CI), install Chromium for Playwright:

```bash
npx playwright install chromium
```

## Notes

- If you pass only a single string argument, it is treated as a complete CSS rule (for example: `".x { color: red; }"`).
- In non-browser environments, pass an explicit stylesheet to avoid accessing `document`.
- If no stylesheet is provided and `document` is unavailable, the function returns `undefined`.
- Each call without an explicit stylesheet creates a new `<style>` element. Pass and reuse a stylesheet reference for better control (e.g., to use the stylesheet's `disabled` property for toggling).
- At-rules like `@media` and `@supports` are supported via nested object syntax.
- Other at-rules (for example `@keyframes` and `@font-face`) can be passed as full rule strings.
- Property names must be valid CSS (kebab-case); no automatic conversion from camelCase is performed.

## License

MIT
