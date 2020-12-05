@preprocessor typescript

@{%
import { RenderBlock, BinaryExpr, UnaryExpr, IntExpr, FloatExpr } from "./nodes";
import { lexer } from "./lexer";
const nearleyLexer = (lexer as unknown) as NearleyLexer;

const bin = (d: any) => new BinaryExpr(d[2], d[0], d[4]);
const un = (d: any) => new UnaryExpr(d[0], d[2]);
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
    %add _ Unary  {% un %}
  | %sub _ Unary  {% un %}
  | %bnot _ Unary {% un %}
  | %not _ Unary  {% un %}
  | Paren         {% id %}

MultDiv ->
    MultDiv _ %mult _ Unary   {% bin %}
  | MultDiv _ %div _ Unary    {% bin %}
  | MultDiv _ %modulo _ Unary {% bin %}
  | Unary                     {% id %}

AddSub ->
    AddSub _ %add _ MultDiv {% bin %}
  | AddSub _ %sub _ MultDiv {% bin %}
  | MultDiv                 {% id %}

BitShift ->
    BitShift _ %blshift _ AddSub {% bin %}
  | BitShift _ %brshift _ AddSub {% bin %}
  | AddSub                       {% id %}

Relational ->
    Relational _ %lt _ BitShift  {% bin %}
  | Relational _ %gt _ BitShift  {% bin %}
  | Relational _ %lte _ BitShift {% bin %}
  | Relational _ %gte _ BitShift {% bin %}
  | BitShift                     {% id %}

Equality ->
    Equality _ %eq _ Relational  {% bin %}
  | Equality _ %neq _ Relational {% bin %}
  | Relational                   {% id %}

BitAnd ->
    BitAnd _ %band _ Equality {% bin %}
  | Equality                  {% id %}

BitXor ->
    BitXor _ %bxor _ BitAnd {% bin %}
  | BitAnd                  {% id %}

BitOr ->
    BitOr _ %bor _ BitXor {% bin %}
  | BitXor                {% id %}

LogicAnd ->
    LogicAnd _ %and _ BitOr {% bin %}
  | BitOr                   {% id %}

LogicOr ->
    LogicOr _ %or _ LogicAnd {% bin %}
  | LogicAnd                 {% id %}

Number ->
    %float {% d => new FloatExpr(d[0]) %}
  | %int   {% d => new IntExpr(d[0]) %}

# TODO confirm how multiline comments figure into this
__lb__ -> (_sws_ %lbc _sws_):+

_ -> (%ws | %lbc | %comment | %multiline_comment):*

_sws_ -> (%ws | %comment | %multiline_comment):*
