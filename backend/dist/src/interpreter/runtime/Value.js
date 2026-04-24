"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeValue = makeValue;
exports.cloneValue = cloneValue;
exports.defaultValue = defaultValue;
exports.stringifyValue = stringifyValue;
exports.runtimeTypeName = runtimeTypeName;
exports.coerceAssignable = coerceAssignable;
const Type_1 = require("./Type");
function makeValue(type, value) {
    return { type, value };
}
function cloneValue(input) {
    if ((0, Type_1.isSliceType)(input.type)) {
        const items = input.value?.map((item) => cloneValue(item)) ?? null;
        return makeValue(input.type, items);
    }
    if (typeof input.value === "object" && input.value !== null && "structName" in input.value) {
        const struct = input.value;
        const cloned = {
            structName: struct.structName,
            fields: {}
        };
        for (const [key, value] of Object.entries(struct.fields)) {
            cloned.fields[key] = cloneValue(value);
        }
        return makeValue(input.type, cloned);
    }
    return makeValue(input.type, input.value);
}
function defaultValue(type) {
    if (type === "int")
        return makeValue("int", 0);
    if (type === "float64")
        return makeValue("float64", 0);
    if (type === "string")
        return makeValue("string", "");
    if (type === "bool")
        return makeValue("bool", false);
    if (type === "rune")
        return makeValue("rune", 0);
    if ((0, Type_1.isSliceType)(type))
        return makeValue(type, null);
    return makeValue(type, null);
}
function stringifyValue(value) {
    if (value.type === "nil" || value.value === null)
        return "nil";
    if (value.type === "bool")
        return value.value ? "true" : "false";
    if (value.type === "rune")
        return String.fromCodePoint(Number(value.value));
    if ((0, Type_1.isSliceType)(value.type)) {
        const items = value.value;
        if (!items)
            return "nil";
        return `[${items.map((item) => stringifyValue(item)).join(" ")}]`;
    }
    if (typeof value.value === "object" && value.value !== null && "structName" in value.value) {
        const struct = value.value;
        const fields = Object.entries(struct.fields)
            .map(([key, inner]) => `${key}: ${stringifyValue(inner)}`)
            .join(", ");
        return `${struct.structName}{${fields}}`;
    }
    return String(value.value);
}
function runtimeTypeName(value) {
    if ((0, Type_1.isSliceType)(value.type))
        return value.type;
    if (typeof value.value === "object" && value.value !== null && "structName" in value.value) {
        return value.value.structName;
    }
    return String(value.type);
}
function coerceAssignable(source, targetType) {
    if (source.type === targetType)
        return cloneValue(source);
    if (targetType === "float64" && source.type === "int")
        return makeValue("float64", Number(source.value));
    if (targetType === "float64" && source.type === "rune")
        return makeValue("float64", Number(source.value));
    if (targetType === "int" && source.type === "rune")
        return makeValue("int", Number(source.value));
    if ((0, Type_1.isSliceType)(targetType) && (0, Type_1.isSliceType)(source.type)) {
        const innerTarget = (0, Type_1.sliceInnerType)(targetType);
        const items = source.value?.map((item) => coerceAssignable(item, innerTarget)) ?? null;
        return makeValue(targetType, items);
    }
    if (source.value === null && ((0, Type_1.isSliceType)(targetType) || targetType === "nil" || typeof targetType === "string")) {
        return makeValue(targetType, null);
    }
    throw new Error(`No se puede asignar un valor de tipo ${source.type} a ${targetType}`);
}
