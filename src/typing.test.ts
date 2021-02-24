import { expect } from "chai";
import {
  dimensions,
  binaryTyping,
  unaryTyping,
  ternaryTyping,
  callReturnType,
  builtIns,
} from "./typing";

describe("regex on vec and mat dimensions", () => {
  it("matches matmxn", () => {
    expect(dimensions("mat2x3")).to.deep.equal(["3", "2"]);
  });

  it("matches matm", () => {
    expect(dimensions("mat2")).to.deep.equal(["2", "2"]);
  });

  it("matches vec on left", () => {
    expect(dimensions("vec2", "left")).to.deep.equal(["1", "2"]);
  });

  it("matches vec on right", () => {
    expect(dimensions("vec2", "right")).to.deep.equal(["2", "1"]);
  });

  it("throws when side is unspecified for vec", () => {
    expect(() => dimensions("vec2")).to.throw("side");
  });
});

describe("same type operations", () => {
  it("checks identical types", () => {
    expect(binaryTyping("+", "float", "float")).to.equal("float");
    expect(binaryTyping("-", "int", "int")).to.be.equal("int");
    expect(binaryTyping("/", "uint", "uint")).to.be.equal("uint");
    expect(binaryTyping("*", "mat2x3", "mat2x3")).to.be.equal("mat2x3");
    expect(() => binaryTyping("*", "uint", "float")).to.throw("scalar");
    expect(() => binaryTyping("&", "int", "uint")).to.throw("scalar");
  });

  it("checks equivalent matrix types", () => {
    expect(binaryTyping("*", "mat2", "mat2x2")).to.equal("mat2");
    expect(binaryTyping("*", "mat2x2", "mat2")).to.equal("mat2");
  });
});

describe("bitwise binary operations", () => {
  it("checks valid vector and scalar operations", () => {
    expect(binaryTyping("&", "int", "ivec2")).to.equal("ivec2");
    expect(binaryTyping("|", "ivec2", "int")).to.equal("ivec2");
    expect(binaryTyping("^", "ivec2", "ivec2")).to.equal("ivec2");
    expect(binaryTyping("&", "uint", "uvec2")).to.equal("uvec2");
    expect(binaryTyping("^", "uvec2", "uint")).to.equal("uvec2");
    expect(binaryTyping("|", "uvec2", "uvec2")).to.equal("uvec2");
  });

  it("checks valid scalar and scalar operations", () => {
    expect(binaryTyping("&", "int", "int")).to.equal("int");
    expect(binaryTyping("|", "uint", "uint")).to.equal("uint");
  });

  it("throws when bitwise operators used on non-ints", () => {
    expect(() => binaryTyping("&", "int", "vec2")).to.throw("bitwise");
    expect(() => binaryTyping("|", "uvec2", "float")).to.throw("bitwise");
    expect(() => binaryTyping("^", "vec2", "vec2")).to.throw("bitwise");
    expect(() => binaryTyping("&", "float", "float")).to.throw("bitwise");
    expect(() => binaryTyping("|", "mat2", "mat2")).to.throw("bitwise");
  });
});

describe("scalar and other type operations", () => {
  it("checks floats paired with matrices", () => {
    expect(binaryTyping("+", "float", "mat2")).to.be.equal("mat2");
    expect(binaryTyping("-", "mat4x2", "float")).to.be.equal("mat4x2");
    expect(() => binaryTyping("/", "int", "mat3x3")).to.throw();
    expect(() => binaryTyping("*", "mat3x2", "uint")).to.throw();
  });

  it("checks scalars paired with vecs", () => {
    expect(binaryTyping("*", "float", "vec2")).to.be.equal("vec2");
    expect(binaryTyping("*", "vec3", "float")).to.be.equal("vec3");
    expect(binaryTyping("*", "int", "ivec2")).to.be.equal("ivec2");
    expect(binaryTyping("*", "ivec3", "int")).to.be.equal("ivec3");
    expect(binaryTyping("*", "uint", "uvec2")).to.be.equal("uvec2");
    expect(binaryTyping("*", "uvec3", "uint")).to.be.equal("uvec3");
  });

  it("checks that wrong scalar paired with wrong vec throws", () => {
    expect(() => binaryTyping("*", "int", "vec2")).to.be.throw();
    expect(() => binaryTyping("*", "mat2", "int")).to.be.throw();
  });

  it("checks to see % operations not used on floats", () => {
    expect(() => binaryTyping("%", "vec2", "float")).to.throw("mod");
    expect(() => binaryTyping("%", "float", "mat2")).to.throw("mod");
    expect(() => binaryTyping("%", "float", "int")).to.throw("mod");
    expect(binaryTyping("%", "int", "ivec2")).to.be.equal("ivec2");
    expect(binaryTyping("%", "ivec2", "int")).to.be.equal("ivec2");
    expect(binaryTyping("%", "uvec3", "uvec3")).to.be.equal("uvec3");
  });
});

describe("matrix and vector multiplications", () => {
  it("mults mat2x3 * vec2 -> vec3", () => {
    expect(binaryTyping("*", "mat2x3", "vec2")).to.equal("vec3");
  });

  it("mults vec3 * mat2x3 -> vec2", () => {
    expect(binaryTyping("*", "vec3", "mat2x3")).to.equal("vec2");
  });

  it("mults mat2x3 * mat3x2 -> mat3x3", () => {
    expect(binaryTyping("*", "mat2x3", "mat3x2")).to.equal("mat3");
  });

  it("mults mat3x2 * mat2x3 -> mat2x2", () => {
    expect(binaryTyping("*", "mat3x2", "mat2x3")).to.equal("mat2");
  });

  it("mults mat3x3 * mat3x3 -> mat3x3", () => {
    expect(binaryTyping("*", "mat3x3", "mat3x3")).to.equal("mat3");
    expect(binaryTyping("*", "mat3", "mat3")).to.equal("mat3");
  });

  it("mults mat3x2 * mat4x2 -> throws", () => {
    expect(() => binaryTyping("*", "mat3x2", "mat4x2")).to.throw("matrix");
  });

  it("mults mat2x3 * vec3 -> throws", () => {
    expect(() => binaryTyping("*", "mat2x3", "vec3")).to.throw("matrix");
  });

  it("mults vec2 * mat2x3 -> throws", () => {
    expect(() => binaryTyping("*", "vec2", "mat2x3")).to.throw("matrix");
  });

  it("mults vec2 * vec3 -> throws", () => {
    expect(() => binaryTyping("*", "vec2", "vec3")).to.throw("vector");
  });
});

describe("unary typing", () => {
  it("applies unary operators on valid types", () => {
    expect(unaryTyping("+", "vec2")).to.equal("vec2");
    expect(unaryTyping("-", "int")).to.equal("int");
    expect(unaryTyping("++", "mat2")).to.equal("mat2");
    expect(unaryTyping("--", "uvec4")).to.equal("uvec4");
  });

  it("applies unary operators on booleans and throws", () => {
    expect(() => unaryTyping("+", "bool")).to.throw("boolean");
    expect(() => unaryTyping("-", "bvec2")).to.throw("boolean");
    expect(() => unaryTyping("++", "bvec3")).to.throw("boolean");
    expect(() => unaryTyping("--", "bvec4")).to.throw("boolean");
  });

  it("simplifies matrix types", () => {
    expect(unaryTyping("+", "mat2x2")).to.equal("mat2");
  });

  it("checks unary boolean not operator on bool", () => {
    expect(unaryTyping("!", "bool")).to.equal("bool");
  });

  it("checks unary boolean not operator throwing on non-bool", () => {
    expect(() => unaryTyping("!", "int")).to.throw("scalar booleans");
  });

  it("checks unary bitwise not operator on valid types", () => {
    expect(unaryTyping("~", "int")).to.equal("int");
    expect(unaryTyping("~", "uint")).to.equal("uint");
    expect(unaryTyping("~", "ivec2")).to.equal("ivec2");
    expect(unaryTyping("~", "uvec2")).to.equal("uvec2");
  });

  it("checks unary bitwise not operator on floating point types, throws", () => {
    expect(() => unaryTyping("~", "float")).to.throw("floating");
    expect(() => unaryTyping("~", "vec2")).to.throw("floating");
    expect(() => unaryTyping("~", "mat2")).to.throw("floating");
  });

  it("checks unary not operator", () => {
    expect(() => unaryTyping("!", "int")).to.throw("scalar booleans");
    expect(unaryTyping("!", "bool")).to.equal("bool");
  });
});

describe("relational and equality typing", () => {
  it("compares valid values", () => {
    expect(binaryTyping(">", "int", "int")).to.equal("int");
    expect(binaryTyping("<", "float", "float")).to.equal("float");
    expect(binaryTyping(">=", "uint", "uint")).to.equal("uint");
    expect(binaryTyping(">=", "int", "int")).to.equal("int");
  });

  it("compares mismatching values which throws", () => {
    expect(() => binaryTyping(">", "int", "uint")).to.throw("same");
    expect(() => binaryTyping("<", "float", "int")).to.throw("same");
  });

  it("compares vectors and matrices which throws", () => {
    expect(() => binaryTyping(">", "vec2", "vec2")).to.throw("greaterThan");
    expect(() => binaryTyping("<", "mat2", "mat2")).to.throw("lessThan");
    expect(() => binaryTyping(">=", "vec3", "vec3")).to.throw(
      "greaterThanEqual"
    );
    expect(() => binaryTyping("<=", "mat3", "mat3")).to.throw("lessThanEqual");
  });

  it("compares for equality valid types", () => {
    expect(binaryTyping("==", "int", "int")).to.equal("bool");
    expect(binaryTyping("!=", "mat4x2", "mat4x2")).to.equal("bool");
  });

  it("compares for equality different types, throws", () => {
    expect(() => binaryTyping("==", "int", "float")).to.throw("equality");
    expect(() => binaryTyping("!=", "mat4x2", "mat2x4")).to.throw("equality");
  });
});

describe("logical operators", () => {
  it("checks valid logical operations on booleans", () => {
    expect(binaryTyping("&&", "bool", "bool")).to.equal("bool");
    expect(binaryTyping("||", "bool", "bool")).to.equal("bool");
    expect(binaryTyping("^^", "bool", "bool")).to.equal("bool");
  });

  it("checks illegal logical operations on booleans", () => {
    expect(() => binaryTyping("&&", "bool", "int")).to.throw("logical");
    expect(() => binaryTyping("||", "vec2", "vec3")).to.throw("logical");
    expect(() => binaryTyping("^^", "mat4x3", "bool")).to.throw("logical");
  });
});

describe("logical operators", () => {
  it("checks that both sides are integer based", () => {
    expect(() => binaryTyping("<<", "int", "float")).to.throw(
      "signed or unsigned"
    );
    expect(() => binaryTyping(">>", "vec2", "uvec2")).to.throw(
      "signed or unsigned"
    );
  });

  it("checks if right expr is scalar if left is scalar", () => {
    expect(() => binaryTyping("<<", "int", "ivec3")).to.throw(
      "scalar if expression"
    );
    expect(binaryTyping("<<", "uint", "int")).to.equal("uint");
  });

  it("checks if right expr is scalar or same-length vec if left is vec", () => {
    expect(binaryTyping("<<", "ivec2", "int")).to.equal("ivec2");
    expect(() => binaryTyping(">>", "ivec2", "uvec3")).to.throw(
      "scalar or same-length"
    );
  });
});

describe("ternary operator", () => {
  it("checks valid ternary operations", () => {
    expect(ternaryTyping("bool", "int", "int")).to.equal("int");
  });

  it("throws when non-boolean condition expression", () => {
    expect(() => ternaryTyping("vec2", "int", "int")).to.throw(
      "condition expression"
    );
  });

  it("throws when non-matching ending expressions", () => {
    expect(() => ternaryTyping("bool", "int", "float")).to.throw(
      "ending expressions"
    );
  });

  it("simplifies matrix types", () => {
    expect(ternaryTyping("bool", "mat2x2", "mat2")).to.equal("mat2");
    expect(ternaryTyping("bool", "mat2", "mat2x2")).to.equal("mat2");
    expect(ternaryTyping("bool", "mat2x2", "mat2x2")).to.equal("mat2");
  });
});

describe("typing overloaded generic function calls", () => {
  it("checks sin", () => {
    expect(callReturnType(["float"], builtIns["sin"])).to.equal("float");
    expect(callReturnType(["vec2"], builtIns["sin"])).to.equal("vec2");
    expect(() => callReturnType(["mat2"], builtIns["sin"])).to.throw(
      "no matching"
    );
  });

  it("checks clamp", () => {
    expect(
      callReturnType(["vec2", "float", "float"], builtIns["clamp"])
    ).to.equal("vec2");
    expect(
      callReturnType(["vec2", "vec2", "vec2"], builtIns["clamp"])
    ).to.equal("vec2");
    expect(callReturnType(["ivec3", "int", "int"], builtIns["clamp"])).to.equal(
      "ivec3"
    );
    expect(
      callReturnType(["ivec3", "ivec3", "ivec3"], builtIns["clamp"])
    ).to.equal("ivec3");
    expect(
      callReturnType(["uvec4", "uint", "uint"], builtIns["clamp"])
    ).to.equal("uvec4");
    expect(
      callReturnType(["uvec4", "uvec4", "uvec4"], builtIns["clamp"])
    ).to.equal("uvec4");
  });

  it("checks clamp with no matching overload, throws", () => {
    expect(() =>
      callReturnType(["vec2", "vec2", "vec3"], builtIns["clamp"])
    ).to.throw("no matching");
  });

  it("throws when has generic return type with no matching arg", () => {
    expect(() =>
      callReturnType(["int"], { params: ["genIType"], ret: "genBType" })
    ).to.throw("generic");
  });

  it("tests multiple gen types with mix", () => {
    expect(callReturnType(["vec2", "vec2", "bvec2"], builtIns["mix"])).to.equal(
      "vec2"
    );
  });

  it("array param type and return type", () => {
    expect(
      callReturnType([{ typ: "int", size: 8 }], {
        params: [{ typ: "genIType", size: 8 }],
        ret: { typ: "genIType", size: 8 },
      })
    ).to.deep.equal({ typ: "int", size: 8 });
  });
});
