@preprocessor typescript

@{%
import { test } from "./nodes";
import { lexer } from "./lexer";
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);
%}

@lexer nearleyLexer

#Main ->
#    FuncDecl
#  | ProcDecl
#  | Define
#  | RenderOp

#FuncDecl ->
#    Type

Main ->
    #(___ AddSub):* __lbc__ {% d => {console.log("d0 [" + d[0] + "]"); return d[0]} %}
    _ AddSub _ {% d => d[1] %}

# order of operations
Paren ->
    %lparen _ AddSub _ %rparen {% d => d[2] %}
  | Number                     {% id %}

MultDiv ->
    MultDiv _ %mult _ Paren {% d => [d[0], "*", d[4]] %}
  | MultDiv _ %div _ Paren  {% d => [d[0], "/", d[4]] %}
  | Paren                   {% id %}

AddSub ->
    AddSub _ %add _ MultDiv {% d => [d[0], "+", d[4]] %}
  | AddSub _ %sub _ MultDiv {% d => [d[0], "-", d[4]] %}
  | MultDiv

Number ->
    %float {% d => ["float", d[0].value, d[0].line] %}
  | %int   {% d => ["int", d[0].value, d[0].line] %}

# required whitespace
__ -> %ws:+

# optional whitespace
_ -> %ws:*
