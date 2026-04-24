# OLC1_Proyecto2_TuCarnet

Proyecto 2 de OLC1: intérprete para GoScript con Jison, AST, tabla de símbolos, reportes y frontend web simple.

## Estructura

- `backend/`: servidor Express, parser Jison e intérprete.
- `frontend/`: interfaz simple sin React.
- `docs/`: gramática BNF y manuales.

## Backend

```bash
cd backend
npm install
npm run build
node dist/index.js
```

## Frontend

Abrir `frontend/index.html` en el navegador.

## Reportes

- Errores léxicos, sintácticos y semánticos
- Tabla de símbolos
- AST en formato DOT
