# Manual Técnico

## Arquitectura

- `backend/src/analyzer`: gramática Jison y construcción del parser.
- `backend/src/ast`: nodos del AST separados en expresiones e instrucciones.
- `backend/src/interpreter`: entorno, runtime e intérprete.
- `backend/src/reports`: generación de AST, errores y tabla de símbolos.
- `frontend`: interfaz simple con HTML, CSS y JavaScript puro.

## Flujo

1. El frontend envía el código `.gst` al endpoint `POST /analyze`.
2. `parser.ts` carga `grammar.jison` y genera el parser con Jison.
3. El parser produce nodos crudos y luego se transforman a clases del AST.
4. `Interpreter.ts` registra structs y funciones globales.
5. Se ejecuta `main`, se construye la tabla de símbolos y se recolectan errores.
6. Se devuelven consola, errores, símbolos y DOT del AST.

## Componentes clave

- `Environment.ts`: cadena de ámbitos y resolución de variables, funciones y structs.
- `Value.ts`: manejo de tipos, clonación y coerción.
- `Interpreter.ts`: ejecución de declaraciones, asignaciones, expresiones, control de flujo y funciones embebidas.
- `Graphviz.ts`: construcción del DOT para graficar el AST.

## Tecnologías

- TypeScript
- Node.js
- Express
- Jison
- HTML, CSS y JavaScript
