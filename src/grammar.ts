// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var lparen: any;
declare var rparen: any;
declare var mult: any;
declare var div: any;
declare var add: any;
declare var sub: any;
declare var float: any;
declare var int: any;
declare var ws: any;

import { test } from "./nodes";
import { lexer } from "./lexer";
// cast the moo lexer to the nearley lexer
const nearleyLexer = (lexer as unknown) as NearleyLexer;
console.log(test);

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
    {"name": "Main", "symbols": ["_", "AddSub", "_"], "postprocess": d => d[1]},
    {"name": "Paren", "symbols": [(nearleyLexer.has("lparen") ? {type: "lparen"} : lparen), "_", "AddSub", "_", (nearleyLexer.has("rparen") ? {type: "rparen"} : rparen)], "postprocess": d => d[2]},
    {"name": "Paren", "symbols": ["Number"], "postprocess": id},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("mult") ? {type: "mult"} : mult), "_", "Paren"], "postprocess": d => [d[0], "*", d[4]]},
    {"name": "MultDiv", "symbols": ["MultDiv", "_", (nearleyLexer.has("div") ? {type: "div"} : div), "_", "Paren"], "postprocess": d => [d[0], "/", d[4]]},
    {"name": "MultDiv", "symbols": ["Paren"], "postprocess": id},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("add") ? {type: "add"} : add), "_", "MultDiv"], "postprocess": d => [d[0], "+", d[4]]},
    {"name": "AddSub", "symbols": ["AddSub", "_", (nearleyLexer.has("sub") ? {type: "sub"} : sub), "_", "MultDiv"], "postprocess": d => [d[0], "-", d[4]]},
    {"name": "AddSub", "symbols": ["MultDiv"]},
    {"name": "Number", "symbols": [(nearleyLexer.has("float") ? {type: "float"} : float)], "postprocess": d => ["float", d[0].value, d[0].line]},
    {"name": "Number", "symbols": [(nearleyLexer.has("int") ? {type: "int"} : int)], "postprocess": d => ["int", d[0].value, d[0].line]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (nearleyLexer.has("ws") ? {type: "ws"} : ws)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"]}
  ],
  ParserStart: "Main",
};

export default grammar;
