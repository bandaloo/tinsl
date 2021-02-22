@preprocessor typescript 

@{%
import {
  RenderBlock,
  BinaryExpr,
  UnaryExpr,
  IntExpr,
  FloatExpr,
  SubscriptExpr,
  CallExpr,
  IdentExpr,
  BoolExpr,
  Decl,
  TypeName,
  ConstructorExpr,
  Assign,
  Param,
  FuncDef,
  Return,
  TernaryExpr,
  ForLoop,
  If,
  Else,
  Uniform,
  ProcDef,
  TopDef
} from "./nodes";
import { lexer } from "./lexer";

const nearleyLexer = (lexer as unknown) as NearleyLexer;

const bin = (d: any) => new BinaryExpr(d[0], d[2], d[4]);
const pre = (d: any) => new UnaryExpr(d[0], d[2]);
const post = (d: any) => new UnaryExpr(d[2], d[0], true);
//const typ = (d: any) => new TypeName(d);
const sep = (d: any) => [d[0], ...d[1].map((e: any) => e[2])];
%}

@lexer nearleyLexer

Main ->
    _ TopLevel (__ TopLevel):* _
      {% ([, first, rest, ]: any) => [first, ...rest.map((t: any) => t[1])] %}

TopLevel ->
    RenderBlock {% id %}
  | DefBlock    {% id %}
  | Uniform     {% id %}
  | ProcBlock   {% id %}
  | TopDef    {% id %}

# TODO some sort of define?

# TODO this is a bad name
# TODO make ( ) with space a valid no arg declaration
DefBlock ->
    TypeName _ %ident _ %lparen (_ Params _):? %rparen _ %lbrace (%lbc):* _ (FuncLine):* %rbrace
      {% ([typ, , id, , , params, , , , , , body, ]: any) => new FuncDef(
          typ, id, params === null ? [] : params[1], body.map((e: any) => e[0])
        )
      %}

ProcBlock ->
    %kw_pr _ %ident _ %lparen (_ Params):? _ %rparen _ %lbrace (%lbc):* _ (RenderLine):* %rbrace
      {% ([, , id, , , params, , , , , , , body, ,]: any) => new ProcDef(
          id, params === null ? [] : params[1], body.map((e: any) => e[0])
        )
      %}

RenderBlock ->
    (%int _ %arrow _):? (%kw_loop _ %int _):? (%kw_once _):? %lbrace (%lbc):* _ (RenderLine):* %rbrace _ %arrow _ %int
      {% ([inNumBl, loopNumBl, onceBl, open, , , body, , , , , outNum]: any) =>
        new RenderBlock(
          onceBl !== null && onceBl[0] !== null,
          body.map((e: any) => e[0]),
          inNumBl !== null ? parseInt(inNumBl[0].text) : null,
          parseInt(outNum.text),
          loopNumBl !== null ? parseInt(loopNumBl[2].text) : null,
          open
        )
      %}

# TODO test without this whitespace
Uniform
    -> %kw_uniform _ TypeName _ %ident (%lbc):+ {% d => new Uniform(d[2], d[4]) %}

# for (<INIT>; <cond>; <loop>)
#ForInit ->
#    Decl   {% id %}
#  | Expr   {% id %}
#  | Assign {% id %}

# for (<init>; <COND>; <LOOP>)
# and statements/expressions allowed to appear in render block
RenderLevel ->
    Decl {% id %}
  | Expr {% id %}

# statements/expressions allowed within function bodies
FuncLevel ->
    Expr   {% id %}
  | Decl   {% id %}
  | Assign {% id %}
  | Return {% id %}

# TODO more tests for ending whitespace of for and if statements
FuncLine ->
    FuncLevel (%lbc):+ _ {% d => d[0] %}
  | ForLoop              {% d => d[0] %}
  | If {% id %}

RenderLine ->
    RenderLevel (%lbc):+ _ {% d => d[0] %}

Return ->
    %kw_return _ Expr {% d => new Return(d[2], d[0]) %}

Decl ->
    (%kw_const _):? (TypeName _) (%ident _) %assignment _ Expr
      {% d => new Decl(d[0] !== null, d[1][0], d[2][0], d[5], d[3]) %}

TopDef ->
    %kw_def _ %ident __ Expr
      {% d => new TopDef(d[2], d[4]) %}

Assign ->
    Expr _ AssignSymbol _ Expr {% d => new Assign(d[0], d[2], d[4]) %}

ForInit ->
    RenderLevel {% id %}
  | Assign      {% id %}

ForLoop ->
    %kw_for _ %lparen (_ ForInit):? %lbc (_ RenderLevel):? %lbc (_ RenderLevel):? _ %rparen _ BlockBody
      {% ([kw, , , init, , cond, , loop, , , , body]: any) =>
        new ForLoop(
          init === null ? null : init[1],
          cond === null ? null : cond[1],
          loop === null ? null : loop[1],
          body,
          kw
        )
      %}

If ->
    %kw_if _ %lparen _ Expr _ %rparen _ BlockBody (Else):?
      {% ([tokn, , , , cond, , , , body, cont]: any) =>
        new If(
          cond,
          body,
          tokn,
          cont === null ? null : cont[0]
        )
      %}

Else ->
    %kw_else _ BlockBody {% d => new Else(d[2], d[0]) %}

#ElseContinue ->
#    If        {% id %}
#  | BlockBody {% id %}

BlockBody ->
    FuncLine                                           {% d => [d[0]] %}
  | %lbrace (%lbc):* _ (FuncLine):* %rbrace (%lbc):* _ {% d => d[3].map((e: any) => e[0]) %}

# order of operations
Paren ->
    %lparen _ Expr _ %rparen {% d => d[2] %}
  | Atom                     {% id %}

MiscPost ->
    MiscPost _ %lbracket _ Paren _ %rbracket {% (d: any) => new SubscriptExpr(d[2], d[0], d[4]) %}
  | MiscPost _ %lparen _ Args:? _ %rparen    {% (d: any) => new CallExpr(d[2], d[0], d[4] !== null ? d[4] : []) %}
  | MiscPost _ %period _ Paren               {% bin %}
  | MiscPost _ %incr                         {% post %}
  | MiscPost _ %decr                         {% post %}
  | Paren                                    {% id %}

Unary ->
    %incr _ Unary {% pre %}
  | %decr _ Unary {% pre %}
  | %add _ Unary  {% pre %}
  | %sub _ Unary  {% pre %}
  | %bnot _ Unary {% pre %}
  | %not _ Unary  {% pre %}
  | MiscPost      {% id %}

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

LogicXor ->
    LogicXor _ %xor _ LogicAnd {% bin %}
  | LogicAnd                   {% id %}

LogicOr ->
    LogicOr _ %or _ LogicXor {% bin %}
  | LogicXor                 {% id %}

# ternary is right associative unlike other operators
Ternary ->
    LogicOr _ MiddleTernary _ Ternary {% d => new TernaryExpr(d[0], d[2].expr, d[4], d[2].tok) %}
  | LogicOr                           {% id %}

Expr -> Ternary {% id %}

# helpers
MiddleTernary ->
    %question_mark _ Expr _ %colon {% d => { return { tok: d[0], expr: d[2] } } %}

# TODO float constructor call shouldn't be possible?
TypeName ->
    TypeWord (_ %lbracket (_ %int):? _ %rbracket):?
      {% d => new TypeName(d[0], d[1] === null ? null : d[1][2] === null ? 0 : parseInt(d[1][2][1])) %}

TypeWord ->
    %kw_int    {% id %}
  | %kw_uint   {% id %}
  | %kw_float  {% id %}
  | %kw_bool   {% id %}
  | %kw_vec2   {% id %}
  | %kw_vec3   {% id %}
  | %kw_vec4   {% id %}
  | %kw_uvec2  {% id %}
  | %kw_uvec3  {% id %}
  | %kw_uvec4  {% id %}
  | %kw_ivec2  {% id %}
  | %kw_ivec3  {% id %}
  | %kw_ivec4  {% id %}
  | %kw_bvec2  {% id %}
  | %kw_bvec3  {% id %}
  | %kw_bvec4  {% id %}
  | %kw_mat2   {% id %}
  | %kw_mat3   {% id %}
  | %kw_mat4   {% id %}
  | %kw_mat2x2 {% id %}
  | %kw_mat2x3 {% id %}
  | %kw_mat2x4 {% id %}
  | %kw_mat3x2 {% id %}
  | %kw_mat3x3 {% id %}
  | %kw_mat3x4 {% id %}
  | %kw_mat4x2 {% id %}
  | %kw_mat4x3 {% id %}
  | %kw_mat4x4 {% id %}

Args ->
    Expr (%comma _ Expr):* {% sep %}

Params ->
    Param (%comma _ Param):* {% sep %}

Param ->
    TypeName _ %ident (_ %assignment _ Expr):?
      {% d => new Param(d[0], d[2], d[3] === null ? null : d[3][3]) %}

Atom ->
    %float    {% d => new FloatExpr(d[0]) %}
  | %int      {% d => new IntExpr(d[0]) %}
  | %ident    {% d => new IdentExpr(d[0]) %}
  | %kw_true  {% d => new BoolExpr(d[0]) %}
  | %kw_false {% d => new BoolExpr(d[0]) %}
  | TypeName _ %lparen _ Args:? _ %rparen
      {% (d: any) => new ConstructorExpr(d[2], d[0], d[4] !== null ? d[4] : []) %}

AssignSymbol ->
    %assignment     {% id %}
  | %assign_add     {% id %}
  | %assign_sub     {% id %}
  | %assign_mult    {% id %}
  | %assign_div     {% id %}
  | %assign_modulo  {% id %}
  | %assign_band    {% id %}
  | %assign_bxor    {% id %}
  | %assign_bor     {% id %}
  | %assign_blshift {% id %}
  | %assign_brshift {% id %}

_ -> (%ws | %comment | %multiline_comment):*

__ -> (%ws | %comment | %multiline_comment):+
