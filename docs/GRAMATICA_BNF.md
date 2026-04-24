# Gramática BNF

```bnf
<programa> ::= <globales>
<globales> ::= <global> <globales> | ε
<global> ::= <funcion> | <struct>

<struct> ::= "struct" id "{" <campos_struct> "}"
<campos_struct> ::= <tipo> id <campos_struct> | <tipo> id

<funcion> ::= "func" "main" "(" ")" <bloque>
            | "func" id "(" <parametros_opt> ")" <tipo_retorno_opt> <bloque>

<parametros_opt> ::= <parametros> | ε
<parametros> ::= id <tipo> "," <parametros> | id <tipo>
<tipo_retorno_opt> ::= <tipo> | ε

<bloque> ::= "{" <sentencias> "}"
<sentencias> ::= <sentencia> <sentencias> | <bloque> <sentencias> | ε

<sentencia> ::= <declaracion>
              | <asignacion>
              | <impresion>
              | <if>
              | <switch>
              | <for>
              | "break"
              | "continue"
              | "return" <expresion_opt>
              | <llamada>

<declaracion> ::= "var" id <tipo> "=" <expresion>
                | "var" id <tipo>
                | id ":=" <expresion>
                | <tipo> id "=" <expresion>

<asignacion> ::= <acceso> "=" <expresion>
               | <acceso> "+=" <expresion>
               | <acceso> "-=" <expresion>
               | <acceso> "++"
               | <acceso> "--"

<if> ::= "if" <condicion> <bloque> <else_if>* <else_opt>
<else_if> ::= "else" "if" <condicion> <bloque>
<else_opt> ::= "else" <bloque> | ε

<switch> ::= "switch" <expresion> "{" <cases> <default_opt> "}"
<cases> ::= "case" <expresion> ":" <sentencias> <cases> | ε
<default_opt> ::= "default" ":" <sentencias> | ε

<for> ::= "for" <expresion> <bloque>
        | "for" <declaracion> ";" <expresion> ";" <asignacion> <bloque>
        | "for" id "," id ":=" "range" <expresion> <bloque>

<expresion> ::= <expresion> "+" <expresion>
              | <expresion> "-" <expresion>
              | <expresion> "*" <expresion>
              | <expresion> "/" <expresion>
              | <expresion> "%" <expresion>
              | <expresion> "==" <expresion>
              | <expresion> "!=" <expresion>
              | <expresion> ">" <expresion>
              | <expresion> ">=" <expresion>
              | <expresion> "<" <expresion>
              | <expresion> "<=" <expresion>
              | <expresion> "&&" <expresion>
              | <expresion> "||" <expresion>
              | "!" <expresion>
              | "-" <expresion>
              | "(" <expresion> ")"
              | <llamada>
              | <acceso>
              | <literal>
              | <slice_literal>
              | <struct_literal>
```
