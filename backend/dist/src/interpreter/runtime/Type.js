"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESERVED_WORDS = void 0;
exports.isSliceType = isSliceType;
exports.sliceInnerType = sliceInnerType;
exports.isNumericType = isNumericType;
exports.RESERVED_WORDS = new Set([
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
function isSliceType(type) {
    return typeof type === "string" && type.startsWith("[]");
}
function sliceInnerType(type) {
    return typeof type === "string" && type.startsWith("[]") ? type.slice(2) : "nil";
}
function isNumericType(type) {
    return type === "int" || type === "float64" || type === "rune" || type === "bool";
}
