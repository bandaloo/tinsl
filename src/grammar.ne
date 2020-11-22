@preprocessor typescript

@{%
import { test } from "./nodes";
import { lexer } from "./lexer";
import util from "util"; // TODO remove this
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);
%}

@lexer nearleyLexer

Main ->
  _ TopLevel (__lb__ TopLevel):* _ {%
    ([, first, rest,]: any) => [first, ...rest.map((e: any) => e[1])]
  %}

TopLevel ->
    RenderBlock {% id %}

# TODO is surrounding whitespace covered by line break chunks?
RenderBlock ->
  (%int _ %arrow):? _ %lbrace _ BlockLevel (__lb__ BlockLevel):* _ %rbrace _ %arrow _ %int {%
    ([, , , , first, rest, ,]: any) => ["renderblock", [first, ...rest.map((e: any) => e[1])]]
  %}

BlockLevel ->
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

# .line to access line
Number ->
    %float {% d => ["float", d[0].value] %}
  | %int   {% d => ["int", d[0].value] %}

#_lb_ -> (__ %lbc __):*

__lb__ -> (_sws_ %lbc _sws_):+

_ -> (%ws | %lbc | %comment | %multiline_comment):*

_sws_ -> (%ws | %comment | %multiline_comment):*
