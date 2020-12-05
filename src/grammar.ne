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
    LogicOr {% id %}

# order of operations
Paren ->
    %lparen _ LogicOr _ %rparen {% d => d[2] %}
  | Number                      {% id %}

Unary ->
    %add _ Unary  {% d => ["+", d[2]] %}
  | %sub _ Unary  {% d => ["-", d[2]] %}
  | %bnot _ Unary {% d => ["~", d[2]] %}
  | %not _ Unary  {% d => ["!", d[2]] %}
  | Paren         {% id %}

MultDiv ->
    MultDiv _ %mult _ Unary   {% d => [d[0], "*", d[4]] %}
  | MultDiv _ %div _ Unary    {% d => [d[0], "/", d[4]] %}
  | MultDiv _ %modulo _ Unary {% d => [d[0], "%", d[4]] %}
  | Unary                     {% id %}

AddSub ->
    AddSub _ %add _ MultDiv {% d => [d[0], "+", d[4]] %}
  | AddSub _ %sub _ MultDiv {% d => [d[0], "-", d[4]] %}
  | MultDiv                 {% id %}

BitShift ->
    BitShift _ %blshift _ AddSub {% d => [d[0], "<<", d[4]] %}
  | BitShift _ %brshift _ AddSub {% d => [d[0], ">>", d[4]] %}
  | AddSub                       {% id %}

Relational ->
    Relational _ %lt _ BitShift  {% d => [d[0], "<", d[4]] %}
  | Relational _ %gt _ BitShift  {% d => [d[0], ">", d[4]] %}
  | Relational _ %lte _ BitShift {% d => [d[0], "<=", d[4]] %}
  | Relational _ %gte _ BitShift {% d => [d[0], ">=", d[4]] %}
  | BitShift                     {% id %}

Equality ->
    Equality _ %eq _ Relational  {% d => [d[0], "==", d[4]] %}
  | Equality _ %neq _ Relational {% d => [d[0], "!=", d[4]] %}
  | Relational                   {% id %}

BitAnd ->
    BitAnd _ %band _ Equality {% d => [d[0], "&", d[4]] %}
  | Equality                  {% id %}

BitXor ->
    BitXor _ %bxor _ BitAnd {% d => [d[0], "^", d[4]] %}
  | BitAnd                  {% id %}

BitOr ->
    BitOr _ %bor _ BitXor {% d => [d[0], "|", d[4]] %}
  | BitXor                {% id %}

LogicAnd ->
    LogicAnd _ %and _ BitOr {% d => [d[0], "&&", d[4]] %}
  | BitOr                   {% id %}

LogicOr ->
    LogicOr _ %or _ LogicAnd {% d => [d[0], "||", d[4]] %}
  | LogicAnd                 {% id %}

# .line to access line
Number ->
    %float {% d => ["float", d[0].value] %}
  | %int   {% d => ["int", d[0].value] %}

#_lb_ -> (__ %lbc __):*

# TODO confirm how multiline comments figure into this
__lb__ -> (_sws_ %lbc _sws_):+

_ -> (%ws | %lbc | %comment | %multiline_comment):*

_sws_ -> (%ws | %comment | %multiline_comment):*
