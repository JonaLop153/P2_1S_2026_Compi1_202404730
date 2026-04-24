%lex
%%
\s+                               /* skip */
"//".*                            /* skip */
"/*"[^*]*"*"+([^/*][^*]*"*"+)*"/" /* skip */
"func"                            return 'FUNC';
"var"                             return 'VAR';
"struct"                          return 'STRUCT';
"main"                            return 'MAIN';
"if"                              return 'IF';
"else"                            return 'ELSE';
"switch"                          return 'SWITCH';
"case"                            return 'CASE';
"default"                         return 'DEFAULT';
"for"                             return 'FOR';
"range"                           return 'RANGE';
"break"                           return 'BREAK';
"continue"                        return 'CONTINUE';
"return"                          return 'RETURN';
"true"                            return 'TRUE';
"false"                           return 'FALSE';
"nil"                             return 'NIL';
"fmt.Println"                     return 'PRINTLN';
"slices.Index"                    return 'SLICES_INDEX';
"strings.Join"                    return 'STRINGS_JOIN';
"strconv.Atoi"                    return 'STRCONV_ATOI';
"strconv.ParseFloat"              return 'STRCONV_PARSEFLOAT';
"reflect.TypeOf"                  return 'REFLECT_TYPEOF';
":="                              return 'DECLARE_ASSIGN';
"+="                              return 'PLUS_ASSIGN';
"-="                              return 'MINUS_ASSIGN';
"++"                              return 'INCREMENT';
"--"                              return 'DECREMENT';
"=="                              return 'EQ';
"!="                              return 'NEQ';
">="                              return 'GTE';
"<="                              return 'LTE';
"&&"                              return 'AND';
"||"                              return 'OR';
"="                               return 'ASSIGN';
">"                               return 'GT';
"<"                               return 'LT';
"+"                               return 'PLUS';
"-"                               return 'MINUS';
"*"                               return 'TIMES';
"/"                               return 'DIVIDE';
"%"                               return 'MOD';
"!"                               return 'NOT';
"("                               return 'LPAREN';
")"                               return 'RPAREN';
"{"                               return 'LBRACE';
"}"                               return 'RBRACE';
"["                               return 'LBRACKET';
"]"                               return 'RBRACKET';
":"                               return 'COLON';
","                               return 'COMMA';
";"                               return 'SEMICOLON';
"."                               return 'DOT';
\'([^\\\n]|(\\.))*?\'             yytext = yytext.slice(1, -1); return 'RUNE';
\"([^\\\n]|(\\.))*?\"             yytext = yytext.slice(1, -1); return 'STRING';
[0-9]+"."[0-9]+                   return 'FLOAT';
[0-9]+                            return 'INT';
[A-Za-z_][A-Za-z0-9_]*            return 'ID';
<<EOF>>                           return 'EOF';
.                                 return 'INVALID';
/lex

%start program

%left OR
%left AND
%left EQ NEQ
%left GT GTE LT LTE
%left PLUS MINUS
%left TIMES DIVIDE MOD
%right NOT UMINUS

%%

program
  : globals EOF { return $1; }
  ;

globals
  : global_item globals { $$ = [$1, ...$2]; }
  | /* empty */ { $$ = []; }
  ;

global_item
  : function_decl { $$ = $1; }
  | struct_decl { $$ = $1; }
  ;

struct_decl
  : STRUCT ID LBRACE struct_fields RBRACE opt_semi
    { $$ = { kind: 'Struct', name: $2, fields: $4, line: @2.first_line, column: @2.first_column + 1 }; }
  ;

struct_fields
  : type_name ID opt_semi struct_fields { $$ = [{ type: $1, name: $2 }, ...$4]; }
  | type_name ID opt_semi { $$ = [{ type: $1, name: $2 }]; }
  ;

function_decl
  : FUNC MAIN LPAREN RPAREN block
    { $$ = { kind: 'Main', body: $5, line: @2.first_line, column: @2.first_column + 1 }; }
  | FUNC ID LPAREN params_opt RPAREN return_type_opt block
    { $$ = { kind: 'Function', name: $2, params: $4, returnType: $6, body: $7, line: @2.first_line, column: @2.first_column + 1 }; }
  ;

params_opt
  : params { $$ = $1; }
  | /* empty */ { $$ = []; }
  ;

params
  : ID type_name COMMA params { $$ = [{ name: $1, type: $2 }, ...$4]; }
  | ID type_name { $$ = [{ name: $1, type: $2 }]; }
  ;

return_type_opt
  : type_name { $$ = $1; }
  | /* empty */ { $$ = null; }
  ;

block
  : LBRACE statements RBRACE { $$ = $2; }
  ;

statements
  : statement statements { $$ = [$1, ...$2]; }
  | block statements { $$ = [{ kind: 'Block', body: $1, line: @1.first_line, column: @1.first_column + 1 }, ...$2]; }
  | /* empty */ { $$ = []; }
  ;

statement
  : declaration opt_semi { $$ = $1; }
  | assignment opt_semi { $$ = $1; }
  | print_stmt opt_semi { $$ = $1; }
  | if_stmt { $$ = $1; }
  | switch_stmt { $$ = $1; }
  | for_stmt { $$ = $1; }
  | BREAK opt_semi { $$ = { kind: 'Break', line: @1.first_line, column: @1.first_column + 1 }; }
  | CONTINUE opt_semi { $$ = { kind: 'Continue', line: @1.first_line, column: @1.first_column + 1 }; }
  | RETURN expression opt_semi { $$ = { kind: 'Return', expression: $2, line: @1.first_line, column: @1.first_column + 1 }; }
  | RETURN opt_semi { $$ = { kind: 'Return', expression: null, line: @1.first_line, column: @1.first_column + 1 }; }
  | call_expr opt_semi { $$ = { kind: 'ExpressionStatement', expression: $1, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

declaration
  : VAR ID type_name ASSIGN expression
    { $$ = { kind: 'Declaration', name: $2, declaredType: $3, expression: $5, mode: 'var', line: @2.first_line, column: @2.first_column + 1 }; }
  | VAR ID type_name
    { $$ = { kind: 'Declaration', name: $2, declaredType: $3, expression: null, mode: 'var', line: @2.first_line, column: @2.first_column + 1 }; }
  | ID DECLARE_ASSIGN expression
    { $$ = { kind: 'Declaration', name: $1, declaredType: null, expression: $3, mode: 'infer', line: @1.first_line, column: @1.first_column + 1 }; }
  | type_name ID ASSIGN expression
    { $$ = { kind: 'Declaration', name: $2, declaredType: $1, expression: $4, mode: 'typed', line: @2.first_line, column: @2.first_column + 1 }; }
  ;

assignment
  : access ASSIGN expression
    { $$ = { kind: 'Assignment', target: $1, operator: '=', expression: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | access PLUS_ASSIGN expression
    { $$ = { kind: 'Assignment', target: $1, operator: '+=', expression: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | access MINUS_ASSIGN expression
    { $$ = { kind: 'Assignment', target: $1, operator: '-=', expression: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | access INCREMENT
    { $$ = { kind: 'Assignment', target: $1, operator: '++', expression: { kind: 'Literal', valueType: 'int', value: 1, line: @2.first_line, column: @2.first_column + 1 }, line: @2.first_line, column: @2.first_column + 1 }; }
  | access DECREMENT
    { $$ = { kind: 'Assignment', target: $1, operator: '--', expression: { kind: 'Literal', valueType: 'int', value: 1, line: @2.first_line, column: @2.first_column + 1 }, line: @2.first_line, column: @2.first_column + 1 }; }
  ;

print_stmt
  : PRINTLN LPAREN args_opt RPAREN
    { $$ = { kind: 'Print', args: $3, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

if_stmt
  : IF condition_expr block if_tail
    { $$ = { kind: 'If', condition: $2, thenBody: $3, elseIfs: $4.elseIfs, elseBody: $4.elseBody, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

condition_expr
  : expression { $$ = $1; }
  | LPAREN expression RPAREN { $$ = $2; }
  ;

if_tail
  : ELSE IF condition_expr block if_tail
    { $$ = { elseIfs: [{ condition: $3, body: $4 }, ...$5.elseIfs], elseBody: $5.elseBody }; }
  | ELSE block
    { $$ = { elseIfs: [], elseBody: $2 }; }
  | /* empty */
    { $$ = { elseIfs: [], elseBody: null }; }
  ;

switch_stmt
  : SWITCH non_struct_expr LBRACE switch_cases default_opt RBRACE
    { $$ = { kind: 'Switch', expression: $2, cases: $4, defaultBody: $5, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

switch_cases
  : CASE expression COLON case_statements switch_cases { $$ = [{ match: $2, body: $4 }, ...$5]; }
  | /* empty */ { $$ = []; }
  ;

default_opt
  : DEFAULT COLON case_statements { $$ = $3; }
  | /* empty */ { $$ = null; }
  ;

case_statements
  : statement case_statements { $$ = [$1, ...$2]; }
  | block case_statements { $$ = [{ kind: 'Block', body: $1, line: @1.first_line, column: @1.first_column + 1 }, ...$2]; }
  | /* empty */ { $$ = []; }
  ;

for_stmt
  : FOR expression block
    { $$ = { kind: 'For', mode: 'while', initializer: null, condition: $2, update: null, rangeIndex: null, rangeValue: null, rangeSource: null, body: $3, line: @1.first_line, column: @1.first_column + 1 }; }
  | FOR declaration SEMICOLON expression SEMICOLON assignment block
    { $$ = { kind: 'For', mode: 'classic', initializer: $2, condition: $4, update: $6, rangeIndex: null, rangeValue: null, rangeSource: null, body: $7, line: @1.first_line, column: @1.first_column + 1 }; }
  | FOR ID COMMA ID DECLARE_ASSIGN RANGE non_struct_expr block
    { $$ = { kind: 'For', mode: 'range', initializer: null, condition: null, update: null, rangeIndex: $2, rangeValue: $4, rangeSource: $7, body: $8, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

non_struct_expr
  : non_struct_expr PLUS non_struct_expr { $$ = { kind: 'Arithmetic', operator: '+', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr MINUS non_struct_expr { $$ = { kind: 'Arithmetic', operator: '-', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr TIMES non_struct_expr { $$ = { kind: 'Arithmetic', operator: '*', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr DIVIDE non_struct_expr { $$ = { kind: 'Arithmetic', operator: '/', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr MOD non_struct_expr { $$ = { kind: 'Arithmetic', operator: '%', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | MINUS non_struct_expr %prec UMINUS { $$ = { kind: 'Arithmetic', operator: '-', left: $2, right: null, line: @1.first_line, column: @1.first_column + 1 }; }
  | non_struct_expr EQ non_struct_expr { $$ = { kind: 'Relational', operator: '==', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr NEQ non_struct_expr { $$ = { kind: 'Relational', operator: '!=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr GT non_struct_expr { $$ = { kind: 'Relational', operator: '>', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr GTE non_struct_expr { $$ = { kind: 'Relational', operator: '>=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr LT non_struct_expr { $$ = { kind: 'Relational', operator: '<', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr LTE non_struct_expr { $$ = { kind: 'Relational', operator: '<=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr AND non_struct_expr { $$ = { kind: 'Logical', operator: '&&', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | non_struct_expr OR non_struct_expr { $$ = { kind: 'Logical', operator: '||', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | NOT non_struct_expr { $$ = { kind: 'Logical', operator: '!', left: $2, right: null, line: @1.first_line, column: @1.first_column + 1 }; }
  | LPAREN expression RPAREN { $$ = $2; }
  | call_expr { $$ = $1; }
  | access { $$ = $1; }
  | literal { $$ = $1; }
  | slice_literal { $$ = $1; }
  ;

args_opt
  : args { $$ = $1; }
  | /* empty */ { $$ = []; }
  ;

args
  : expression COMMA args { $$ = [$1, ...$3]; }
  | expression { $$ = [$1]; }
  ;

access
  : ID access_tail
    {
      const base = { kind: 'Identifier', name: $1, line: @1.first_line, column: @1.first_column + 1 };
      $$ = $2.length ? { kind: 'Access', target: base, parts: $2, line: @1.first_line, column: @1.first_column + 1 } : base;
    }
  ;

access_tail
  : LBRACKET expression RBRACKET access_tail { $$ = [{ kind: 'index', expression: $2 }, ...$4]; }
  | DOT ID access_tail { $$ = [{ kind: 'property', name: $2 }, ...$3]; }
  | /* empty */ { $$ = []; }
  ;

call_expr
  : callable LPAREN args_opt RPAREN
    { $$ = { kind: 'CallFunction', callee: $1, args: $3, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

callable
  : ID { $$ = $1; }
  | PRINTLN { $$ = 'fmt.Println'; }
  | SLICES_INDEX { $$ = 'slices.Index'; }
  | STRINGS_JOIN { $$ = 'strings.Join'; }
  | STRCONV_ATOI { $$ = 'strconv.Atoi'; }
  | STRCONV_PARSEFLOAT { $$ = 'strconv.ParseFloat'; }
  | REFLECT_TYPEOF { $$ = 'reflect.TypeOf'; }
  | "append" { $$ = 'append'; }
  | "len" { $$ = 'len'; }
  ;

expression
  : expression PLUS expression { $$ = { kind: 'Arithmetic', operator: '+', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression MINUS expression { $$ = { kind: 'Arithmetic', operator: '-', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression TIMES expression { $$ = { kind: 'Arithmetic', operator: '*', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression DIVIDE expression { $$ = { kind: 'Arithmetic', operator: '/', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression MOD expression { $$ = { kind: 'Arithmetic', operator: '%', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | MINUS expression %prec UMINUS { $$ = { kind: 'Arithmetic', operator: '-', left: $2, right: null, line: @1.first_line, column: @1.first_column + 1 }; }
  | expression EQ expression { $$ = { kind: 'Relational', operator: '==', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression NEQ expression { $$ = { kind: 'Relational', operator: '!=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression GT expression { $$ = { kind: 'Relational', operator: '>', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression GTE expression { $$ = { kind: 'Relational', operator: '>=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression LT expression { $$ = { kind: 'Relational', operator: '<', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression LTE expression { $$ = { kind: 'Relational', operator: '<=', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression AND expression { $$ = { kind: 'Logical', operator: '&&', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | expression OR expression { $$ = { kind: 'Logical', operator: '||', left: $1, right: $3, line: @2.first_line, column: @2.first_column + 1 }; }
  | NOT expression { $$ = { kind: 'Logical', operator: '!', left: $2, right: null, line: @1.first_line, column: @1.first_column + 1 }; }
  | LPAREN expression RPAREN { $$ = $2; }
  | call_expr { $$ = $1; }
  | access { $$ = $1; }
  | literal { $$ = $1; }
  | slice_literal { $$ = $1; }
  | inner_slice_literal { $$ = $1; }
  | struct_literal { $$ = $1; }
  ;

inner_slice_literal
  : LBRACE args_opt RBRACE
    { $$ = { kind: 'InnerSlice', values: $2, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

slice_literal
  : type_slice LBRACE args_opt RBRACE
    { $$ = { kind: 'SliceLiteral', valueType: $1, values: $3, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

struct_literal
  : ID LBRACE struct_values RBRACE
    { $$ = { kind: 'StructLiteral', structName: $1, fields: $3, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

struct_values
  : ID COLON expression COMMA struct_values { $$ = [{ name: $1, expression: $3 }, ...$5]; }
  | ID COLON expression { $$ = [{ name: $1, expression: $3 }]; }
  | /* empty */ { $$ = []; }
  ;

literal
  : INT { $$ = { kind: 'Literal', valueType: 'int', value: Number(yytext), line: @1.first_line, column: @1.first_column + 1 }; }
  | FLOAT { $$ = { kind: 'Literal', valueType: 'float64', value: Number(yytext), line: @1.first_line, column: @1.first_column + 1 }; }
  | STRING { $$ = { kind: 'Literal', valueType: 'string', value: yytext.replace(/\\\\n/g, '\n').replace(/\\\\t/g, '\t').replace(/\\\\r/g, '\r').replace(/\\\\\"/g, '"').replace(/\\\\\\\\/g, '\\'), line: @1.first_line, column: @1.first_column + 1 }; }
  | RUNE { $$ = { kind: 'Literal', valueType: 'rune', value: yytext.replace(/\\\\'/g, "'"), line: @1.first_line, column: @1.first_column + 1 }; }
  | TRUE { $$ = { kind: 'Literal', valueType: 'bool', value: true, line: @1.first_line, column: @1.first_column + 1 }; }
  | FALSE { $$ = { kind: 'Literal', valueType: 'bool', value: false, line: @1.first_line, column: @1.first_column + 1 }; }
  | NIL { $$ = { kind: 'Literal', valueType: 'nil', value: null, line: @1.first_line, column: @1.first_column + 1 }; }
  ;

type_name
  : ID { $$ = $1; }
  | type_slice { $$ = $1; }
  ;

type_slice
  : LBRACKET RBRACKET type_name { $$ = '[]' + $3; }
  ;

opt_semi
  : SEMICOLON
  | /* empty */
  ;
