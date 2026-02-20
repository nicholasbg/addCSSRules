# add-css-rules

A lightweight utility for dynamically adding CSS rules to stylesheets in the browser.

This package is ESM-only.

## Installation

```bash
npm install add-css-rules
```

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

The package exports `StyleObject` and `SelectorRules` types for typing your rule objects:

```typescript
import addCSSRules, {
  type StyleObject,
  type SelectorRules,
} from "add-css-rules";

const styles: StyleObject = {
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

#### Parameters

- `selectorOrRules` (string | object): If a string, it's treated as a CSS selector. If an object, it's a map of selector => styles.
- `stylesOrStyleSheet` (string | object | CSSStyleSheet | null): CSS declarations as string, style object, or target stylesheet.
- `styleSheet` (CSSStyleSheet | null): Optional explicit target stylesheet. If omitted, uses the last stylesheet in the document.

#### Returns

`CSSStyleSheet | undefined`: The stylesheet containing the added rule(s), or `undefined` if no rules were added.

## Browser Support

Works in all modern browsers that support `CSSStyleSheet.insertRule()`.

## Development

```bash
npm test
```

## Notes

- If you pass only a single string argument, it is treated as a complete CSS rule (for example: `".x { color: red; }"`).
- In non-browser environments, pass an explicit stylesheet to avoid accessing `document`.
- If no stylesheet is provided and `document` is unavailable, the function returns `undefined`.
- Each call without an explicit stylesheet creates a new `<style>` element. Pass and reuse a stylesheet reference for better control (e.g., to use the stylesheet's `disabled` property for toggling).
- At-rules like `@media`, `@supports`, `@keyframes`, and `@font-face` all work — either as full rule strings or via nested object syntax.
- Property names must be valid CSS (kebab-case); no automatic conversion from camelCase is performed.

## License

MIT
