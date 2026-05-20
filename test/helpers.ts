export const createStyleSheet = () => {
  const sheet =
    document &&
    (document.head || document.documentElement).appendChild(
      document.createElement("style"),
    ).sheet;

  if (sheet) return sheet;

  throw new Error("Unable to create stylesheet");
};

export const styleRule = (
  parent: { cssRules: CSSRuleList },
  index = 0,
): CSSStyleRule => {
  const rule = parent.cssRules[index];
  if (rule instanceof CSSStyleRule) return rule;
  throw new Error("not a CSSStyleRule");
};

export const mediaRule = (
  parent: { cssRules: CSSRuleList },
  index = 0,
): CSSMediaRule => {
  const rule = parent.cssRules[index];
  if (rule instanceof CSSMediaRule) return rule;
  throw new Error("not a CSSMediaRule");
};

export const supportsRule = (
  parent: { cssRules: CSSRuleList },
  index = 0,
): CSSSupportsRule => {
  const rule = parent.cssRules[index];
  if (rule instanceof CSSSupportsRule) return rule;
  throw new Error("not a CSSSupportsRule");
};
