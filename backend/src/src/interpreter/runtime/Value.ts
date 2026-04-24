import { TypeName, isSliceType, sliceInnerType } from "./Type";

export interface StructValue {
  structName: string;
  fields: Record<string, RuntimeValue>;
}

export interface RuntimeValue {
  type: TypeName;
  value: unknown;
}

export function makeValue(type: TypeName, value: unknown): RuntimeValue {
  return { type, value };
}

export function cloneValue(input: RuntimeValue): RuntimeValue {
  if (isSliceType(input.type)) {
    const items = (input.value as RuntimeValue[] | null)?.map((item) => cloneValue(item)) ?? null;
    return makeValue(input.type, items);
  }

  if (typeof input.value === "object" && input.value !== null && "structName" in (input.value as object)) {
    const struct = input.value as StructValue;
    const cloned: StructValue = {
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

export function defaultValue(type: TypeName): RuntimeValue {
  if (type === "int") return makeValue("int", 0);
  if (type === "float64") return makeValue("float64", 0);
  if (type === "string") return makeValue("string", "");
  if (type === "bool") return makeValue("bool", false);
  if (type === "rune") return makeValue("rune", 0);
  if (isSliceType(type)) return makeValue(type, null);
  return makeValue(type, null);
}

export function stringifyValue(value: RuntimeValue): string {
  if (value.type === "nil" || value.value === null) return "nil";
  if (value.type === "bool") return (value.value as boolean) ? "true" : "false";
  if (value.type === "rune") return String.fromCodePoint(Number(value.value));
  if (isSliceType(value.type)) {
    const items = value.value as RuntimeValue[] | null;
    if (!items) return "nil";
    return `[${items.map((item) => stringifyValue(item)).join(" ")}]`;
  }
  if (typeof value.value === "object" && value.value !== null && "structName" in (value.value as object)) {
    const struct = value.value as StructValue;
    const fields = Object.entries(struct.fields)
      .map(([key, inner]) => `${key}: ${stringifyValue(inner)}`)
      .join(", ");
    return `${struct.structName}{${fields}}`;
  }
  return String(value.value);
}

export function runtimeTypeName(value: RuntimeValue): string {
  if (isSliceType(value.type)) return value.type;
  if (typeof value.value === "object" && value.value !== null && "structName" in (value.value as object)) {
    return (value.value as StructValue).structName;
  }
  return String(value.type);
}

export function coerceAssignable(source: RuntimeValue, targetType: TypeName): RuntimeValue {
  if (source.type === targetType) return cloneValue(source);
  if (targetType === "float64" && source.type === "int") return makeValue("float64", Number(source.value));
  if (targetType === "float64" && source.type === "rune") return makeValue("float64", Number(source.value));
  if (targetType === "int" && source.type === "rune") return makeValue("int", Number(source.value));
  if (isSliceType(targetType) && isSliceType(source.type)) {
    const innerTarget = sliceInnerType(targetType);
    const items = (source.value as RuntimeValue[] | null)?.map((item) => coerceAssignable(item, innerTarget)) ?? null;
    return makeValue(targetType, items);
  }
  if (source.value === null && (isSliceType(targetType) || targetType === "nil" || typeof targetType === "string")) {
    return makeValue(targetType, null);
  }
  throw new Error(`No se puede asignar un valor de tipo ${source.type} a ${targetType}`);
}
