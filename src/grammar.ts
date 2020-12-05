// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var int: any;
declare var arrow: any;
declare var kw_loop: any;
declare var kw_once: any;
declare var lbrace: any;
declare var rbrace: any;
declare var lparen: any;
declare var rparen: any;
declare var bnot: any;
declare var mult: any;
declare var div: any;
declare var add: any;
declare var sub: any;
declare var float: any;
declare var lbc: any;
declare var ws: any;
declare var comment: any;
declare var multiline_comment: any;

import { RenderBlock } from "./nodes";
import { lexer } from "./lexer";
const nearleyLexer = (lexer as unknown) as NearleyLexer;

interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: nearleyLexer,
  ParserRules: [
    {"name": "Main$ebnf$1", "symbols": []},
    {"name": "Main$ebnf$1$subexpression$1", "symbols": ["__lb__", "TopLevel"]},
    {"name": "Main$ebnf$1", "symbols": ["Main$ebnf$1", "Main$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Main", "symbols": ["_", "TopLevel", "Main$ebnf$1", "_"], "postprocess": 
        ([, first, rest,]: any) => [first, ...rest.map((e: any) => e[1])]
          },
    {"name": "TopLevel", "symbols": ["RenderBlock"], "postprocess": id},
    {"name": "RenderBlock$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int), "_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow)]},
    {"name": "RenderBlock$ebnf$1", "symbols": ["RenderBlock$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$1", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$2$subexpression$1", "symbols": ["_", (nearleyLexer.has("kw_loop") ? {type: "kw_loop"} : kw_loop), "_", (nearleyLexer.has("int") ? {type: "int"} : int)]},
    {"name": "RenderBlock$ebnf$2", "symbols": ["RenderBlock$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$2", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$3$subexpression$1", "symbols": ["_", (nearleyLexer.has("kw_once") ? {type: "kw_once"} : kw_once)]},
    {"name": "RenderBlock$ebnf$3", "symbols": ["RenderBlock$ebnf$3$subexpression$1"], "postprocess": id},
    {"name": "RenderBlock$ebnf$3", "symbols": [], "postprocess": () => null},
    {"name": "RenderBlock$ebnf$4", "symbols": []},
    {"name": "RenderBlock$ebnf$4$subexpression$1", "symbols": ["__lb__", "BlockLevel"]},
    {"name": "RenderBlock$ebnf$4", "symbols": ["RenderBlock$ebnf$4", "RenderBlock$ebnf$4$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "RenderBlock", "symbols": ["RenderBlock$ebnf$1", "RenderBlock$ebnf$2", "RenderBlock$ebnf$3", "_", (nearleyLexer.has("lbrace") ? {type: "lbrace"} : lbrace), "_", "BlockLevel", "RenderBlock$ebnf$4", "_", (nearleyLexer.has("rbrace") ? {type: "rbrace"} : rbrace), "_", (nearleyLexer.has("arrow") ? {type: "arrow"} : arrow), "_", (nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess":  ([inNumBl, loopNumBl, onceBl, , , , first, rest, , , , , , outNum]: any) =>
        new RenderBlock(
          onceBl !== null && onceBl[1] !== null,
          [first, ...rest.map((e: any) => e[1])],
          inNumBl !== null ? inNumBl[0] : null,
          outNum,
          loopNumBl !== null ? loopNumBl[3] : null
        )
            },
    {"name": "BlockLevel", "symbols": ["AddSub"], "postprocess": id},
    {"name": "Paren", "symbols": [(nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "AddSub", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => d[2]},
    {"name": "Paren", "symbols": ["Number"], "postprocess": id},
    {"name": "Unary", "symbols": [(nearleyLexer.has("bnot") ? {type: "bnot"} : bnot), "_", "AddSub"], "postprocess": d => ["~", d[2]]},
    {"name": "Unary", "symbols": ["Paren"], "postprocess": id},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("mult") ? {type: "mult"} : mult), "_", "Unary"], "postprocess": d => [d[0], "*", d[4]]},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("div") ? {type: "div"} : div), "_", "Unary"], "postprocess": d => [d[0], "/", d[4]]},
    {"name": "MultDiv", "symbols": ["Unary"], "postprocess": id},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("add") ? {type: "add"} : add), "_", "MultDiv"], "postprocess": d => [d[0], "+", d[4]]},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("sub") ? {type: "sub"} : sub), "_", "MultDiv"], "postprocess": d => [d[0], "-", d[4]]},
    {"name": "AddSub", "symbols": ["MultDiv"]},
    {"name": "Number", "symbols": [(nearleyLexer.has("float") ? {type: "float"} : float)], "postprocess": d => ["float", d[0].value]},
    {"name": "Number", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess": d => ["int", d[0].value]},
    {"name": "__lb__$ebnf$1$subexpression$1", "symbols": ["_sws_", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "_sws_"]},
    {"name": "__lb__$ebnf$1", "symbols": ["__lb__$ebnf$1$subexpression$1"]},
    {"name": "__lb__$ebnf$1$subexpression$2", "symbols": ["_sws_", (nearleyLexer.has("lbc") ? {type: "lbc"} : lbc), "_sws_"]},
    {"name": "__lb__$ebnf$1", "symbols": ["__lb__$ebnf$1", "__lb__$ebnf$1$subexpression$2"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__lb__", "symbols": ["__lb__$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("lbc") ? {type: "lbc"} : lbc)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("multiline_comment") ? {type: "multiline_comment"} : multiline_comment)]},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", "_$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "_sws_$ebnf$1", "symbols": []},
    {"name": "_sws_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "_sws_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "_sws_$ebnf$1$subexpression$1", "symbols": [(nearleyLexer.has("multiline_comment") ? {type: "multiline_comment"} : multiline_comment)]},
    {"name": "_sws_$ebnf$1", "symbols": ["_sws_$ebnf$1", "_sws_$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_sws_", "symbols": ["_sws_$ebnf$1"]}
  ],
  ParserStart: "Main",
};

export default grammar;
