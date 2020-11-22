@preprocessor typescript

@{%
import { test } from "./nodes";
import { lexer } from "./lexer";
import util from "util";
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);
%}

@lexer nearleyLexer

Main ->
  #(__ %lbc __):* (TopLevel (__ %lbc __):+):* {% d => {console.log('main ' + d[0].toString()); return d }%}
  (__ %lbc __):* TopLevel ((__ %lbc __):+ TopLevel):* {%
    ([, first, rest]: any) => [first, ...rest.map((e: any) => e[1])]
  %}

#TopLevel ->
#    FuncDecl
#  | ProcDecl
#  | Define
#  | RenderOp

#FuncDecl ->
#    Type

TopLevel ->
    #(___ AddSub):* __lbc__ {% d => {console.log("d0 [" + d[0] + "]"); return d[0]} %}
    AddSub {% id %}

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

_ -> (%ws | %lbc | %comment | %multiline_comment):*

__ -> (%ws | %comment | %multiline_comment):*
