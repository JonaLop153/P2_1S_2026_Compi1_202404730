export type PrimitiveType = "int" | "float64" | "string" | "bool" | "rune" | "nil";

export type TypeName = PrimitiveType | string;

export const RESERVED_WORDS = new Set([
  "var",
  "func",
  "main",
  "if",
  "else",
  "switch",
  "case",
  "default",
  "for",
  "range",
  "break",
  "continue",
  "return",
  "struct",
  "true",
  "false",
  "nil"
]);

export function isSliceType(type: TypeName): boolean {
  return typeof type === "string" && type.startsWith("[]");
}

export function sliceInnerType(type: TypeName): TypeName {
  return typeof type === "string" && type.startsWith("[]") ? type.slice(2) : "nil";
}

export function isNumericType(type: TypeName): boolean {
  return type === "int" || type === "float64" || type === "rune" || type === "bool";
}
