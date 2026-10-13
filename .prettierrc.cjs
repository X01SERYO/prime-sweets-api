/**
 * Prettier configuration.
 * Each option is documented in English below.
 */
module.exports = {
  // Whether to add a semicolon at the end of every statement.
  semi: true,

  // Use single quotes instead of double quotes for strings.
  singleQuote: true,

  // Number of spaces per indentation level.
  tabWidth: 2,

  // Where to put trailing commas: "none" | "es5" | "all".
  // "none" = no trailing commas; "es5" = where valid in ES5 (objects, arrays); "all" = wherever possible.
  trailingComma: 'none',

  // When to quote object properties: "as-needed" | "consistent" | "preserve".
  // "as-needed" = only when required (e.g. invalid identifiers or empty keys).
  quoteProps: 'as-needed',

  // Include parentheses around a sole arrow function parameter: "always" | "avoid".
  // "avoid" = omit parens when there is one parameter, e.g. x => x.
  arrowParens: 'avoid',

  // Wrap lines that exceed this character count (Prettier will try to break at sensible points).
  printWidth: 120,

  // Line ending to enforce: "lf" | "crlf" | "cr" | "auto".
  // "auto" = maintain existing line endings (e.g. from git).
  endOfLine: 'auto',
};
