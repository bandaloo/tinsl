import chai, { expect } from "chai";
import { dimensions, scalarOp, operators } from "./typing";

describe("regex on vec and mat dimensions", () => {
  it("matches matmxn", () => {
    expect(dimensions("mat2x3")).to.deep.equal(["3", "2"]);
  });

  it("matches matmxn", () => {
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
    expect(operators("+", "float", "float")).to.equal("float");
    expect(operators("-", "int", "int")).to.be.equal("int");
    expect(operators("/", "uint", "uint")).to.be.equal("uint");
    expect(operators("*", "mat2x3", "mat2x3")).to.be.equal("mat2x3");
    expect(() => operators("*", "uint", "float")).to.throw("scalar");
  });
});

describe("scalar and other type operations", () => {
  it("checks floats paired with matrices", () => {
    expect(operators("+", "float", "mat2")).to.be.equal("mat2");
    expect(operators("-", "mat4x2", "float")).to.be.equal("mat4x2");
    expect(() => operators("/", "int", "mat3x3")).to.throw();
    expect(() => operators("*", "mat3x2", "uint")).to.throw();
  });

  it("checks scalars paired with vecs", () => {
    expect(operators("*", "float", "vec2")).to.be.equal("vec2");
    expect(operators("*", "vec3", "float")).to.be.equal("vec3");
    expect(operators("*", "int", "ivec2")).to.be.equal("ivec2");
    expect(operators("*", "ivec3", "int")).to.be.equal("ivec3");
    expect(operators("*", "uint", "uvec2")).to.be.equal("uvec2");
    expect(operators("*", "uvec3", "uint")).to.be.equal("uvec3");
  });
});

describe("matrix and vector multiplications", () => {
  it("mults mat2x3 * vec2 -> vec3", () => {
    expect(operators("*", "mat2x3", "vec2")).to.equal("vec3");
  });

  it("mults vec3 * mat2x3 -> vec2", () => {
    expect(operators("*", "vec3", "mat2x3")).to.equal("vec2");
  });

  it("mults mat2x3 * mat3x2 -> mat3x3", () => {
    expect(operators("*", "mat2x3", "mat3x2")).to.equal("mat3x3");
  });

  it("mults mat3x2 * mat2x3 -> mat2x2", () => {
    expect(operators("*", "mat3x2", "mat2x3")).to.equal("mat2x2");
  });

  it("mults mat3x3 * mat3x3 -> mat3x3", () => {
    expect(operators("*", "mat3x3", "mat3x3")).to.equal("mat3x3");
    expect(operators("*", "mat3", "mat3")).to.equal("mat3");
  });

  it("mults mat3x2 * mat4x2 -> throws", () => {
    expect(() => operators("*", "mat3x2", "mat4x2")).to.throw("matrix");
  });

  it("mults mat2x3 * vec3 -> throws", () => {
    expect(() => operators("*", "mat2x3", "vec3")).to.throw("matrix");
  });

  it("mults vec2 * mat2x3 -> throws", () => {
    expect(() => operators("*", "vec2", "mat2x3")).to.throw("matrix");
  });

  it("mults vec2 * vec3 -> throws", () => {
    expect(() => operators("*", "vec2", "vec3")).to.throw("vector");
  });
});
