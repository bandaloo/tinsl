@preprocessor typescript

@{%
import { RenderBlock } from "./nodes";
import { lexer } from "./lexer";
const nearleyLexer = (lexer as unknown) as NearleyLexer;
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
  (%int _ %arrow):? (_ %kw_loop _ %int):? (_ %kw_once):? _ %lbrace _ BlockLevel (__lb__ BlockLevel):* _ %rbrace _ %arrow _ %int
    {% ([inNumBl, loopNumBl, onceBl, , , , first, rest, , , , , , outNum]: any) =>
      new RenderBlock(
        onceBl !== null && onceBl[1] !== null,
        [first, ...rest.map((e: any) => e[1])],
        inNumBl !== null ? inNumBl[0] : null,
        outNum,
        loopNumBl !== null ? loopNumBl[3] : null
      )
    %}

BlockLevel ->
    AddSub {% id %}

# order of operations
Paren ->
    %lparen _ AddSub _ %rparen {% d => d[2] %}
  | Number                     {% id %}

Unary ->
    %bnot _ AddSub {% d => ["~", d[2]] %}
  | Paren          {% id %}

MultDiv ->
    MultDiv _ %mult _ Unary {% d => [d[0], "*", d[4]] %}
  | MultDiv _ %div _ Unary  {% d => [d[0], "/", d[4]] %}
  | Unary                   {% id %}

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
