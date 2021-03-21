// dwitter sim
let C = Math.cos;
let S = Math.sin;
let T = Math.tan;

let R = (r?: any, g?: any, b?: any, a: any = 1) =>
  `rgba(${r | 0},${g | 0},${b | 0},${a})`;

export const stripes = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  if (frames === 0) {
    x.fillStyle = "black";
    x.fillRect(0, 0, 960, 540);
    x.font = "99px Helvetica, sans-serif";
    x.fillStyle = "white";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("hello world", 960 / 2, 540 / 4);
  }
  const i = ~~(frames / 9);
  const j = ~~(i / 44);
  const k = i % 44;
  x.fillStyle = `hsl(${(k & j) * i},40%,${50 + C(i) * 10}%`;
  x.fillRect(k * 24, 0, 24, k + 2);
  x.drawImage(c, 0, k + 2);
};

export const higherOrderSpiral = (
  dots: [number, number, number],
  background: [number, number, number],
  num = 50,
  size = 1,
  speed = 1
) => (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  x.fillStyle = R(...background);
  x.fillRect(0, 0, 960, 540);
  let d;
  for (let i = num; (i -= 0.5); i > 0) {
    x.beginPath();
    d = 2 * C((2 + S(t / 99)) * 2 * i * speed);
    x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i * size, 0, 44 / 7);
    const fade = i / num;
    x.fillStyle = R(dots[0] * fade, dots[1] * fade, dots[2] * fade);
    x.fill();
  }
};

export const fabric = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  let h = 20 + C(frames / 30) * 9;
  let b = ~~(h / 8);
  for (let i = 240; i--; ) {
    x.fillStyle = `hsl(${(i ^ ~~(t * 60)) % 99},90%,${h}%)`;
    x.fillRect(4 * i, 0, 4, b);
  }
  x.drawImage(c, 1, b);
};

export const shaderLike = (fillFunc: (x: number, y: number) => string) => {
  return (
    t: number,
    frames: number,
    x: CanvasRenderingContext2D,
    c: HTMLCanvasElement
  ) => {
    for (let i = 960; i--; ) {
      x.fillStyle = fillFunc(i, frames);
      x.fillRect(i, 0, 1, 1);
    }
    x.drawImage(c, 0, 1);
  };
};

export const higherOrderWaves = (color: boolean) =>
  shaderLike(
    color
      ? (x: number, y: number) => `hsl(${~~((x + y) / 20) * 100},50%,90%)`
      : (x: number, y: number) =>
          R((256 / 4) * Math.round(2 + S(x / 20) + C(y / 30)))
  );

export const uncommonCheckerboard = shaderLike((x, y) => {
  y /= 60;
  return `hsl(${x / 9 + y * 9},40%,${
    9 + 60 * ~~((1 + C(y) + 4 * C(x / (99 + 20 * C(y / 5))) * S(y / 2)) % 2)
  }%)`;
});

export const bitwiseGrid = () =>
  shaderLike((x: number, y: number) => R((x & y) * 20));

export const higherOrderGoo = (color: boolean) => {
  const colFunc = (i: number, ti: number) =>
    20 * ~~(1 + S(i / 20) + T(ti + S(ti + i / 99)));
  const fillFunc = color
    ? (i: number, ti: number) =>
        `hsl(${i / 9 + 99 * C(ti)},90%,${colFunc(i, ti)}%`
    : (i: number, ti: number) => R(colFunc(i, ti));
  const goo = (
    t: number,
    frames: number,
    x: CanvasRenderingContext2D,
    c: HTMLCanvasElement
  ) => {
    let ti = frames / 60;
    for (let i = 960; i--; ) {
      x.fillStyle = fillFunc(i, ti);
      x.fillRect(i, 0, 1, 1);
    }
    x.drawImage(c, 0, 1);
  };
  return goo;
};

export const vectorSpiral = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  x.fillStyle = "black";
  x.fillRect(0, 0, 960, 540);
  let d;
  x.lineWidth = 2;
  for (let i = 50; (i -= 0.5); ) {
    x.beginPath();
    x.strokeStyle = `hsl(${i * 9},50%,50%)`;
    d = 2 * C((2 + S(t / 99)) * 2 * i);
    x.arc(480 + d * 10 * C(i) * i, 270 + d * 9 * S(i) * i, i, 0, 44 / 7);
    x.stroke();
  }
};

export const pinkishHelix = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  x.fillStyle = "white";
  x.fillRect(0, 0, 960, 540);
  let i, j;
  for (i = 0; i < 960; i += 32) {
    x.fillStyle = R(((1 + C(i)) / 2) * 255, 0, 155);
    for (j = 0; j < 3; j++) x.fillRect(i + j, 266 + C(i + j + t) * 50, 32, 8);
  }
};

export const movingGrid = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  let i, j, s;
  c.width |= 0;
  for (i = 940; (i -= 20); )
    for (j = 520; (j -= 20); )
      (x.fillStyle = R(
        6 *
          (s =
            6 *
            (4 + C(t * 6) + C((C(t) * i) / 99 + t) + S((S(t) * j) / 99 + t))),
        0,
        s + i / 9
      )),
        x.fillRect(i, j, s, s);
};

export const higherOrderPerspective = (color: boolean, normalized = true) => {
  const layerNum = 12;
  const fillFunc = color
    ? (i: number) => `hsl(${i * 99},50%,50%)`
    : (i: number) => R(255 * (normalized ? 1 / (1 + i) : i / layerNum));
  return (
    t: number,
    frames: number,
    x: CanvasRenderingContext2D,
    c: HTMLCanvasElement
  ) => {
    x.fillStyle = !normalized ? R(255) : R(1, color, color);
    x.fillRect(0, 0, 960, 540);
    const d = (xp: number, yp: number, zp: number, w: number, h: number) => {
      x.fillRect(
        Math.round(480 + (xp - w / 2) / zp),
        Math.round(270 + (yp - h / 2) / zp),
        Math.round(w / zp),
        Math.round(h / zp)
      );
      x.fill();
    };
    const offset = 200;
    const size = 64;
    const amplitude = 32;
    for (let i = layerNum; i > 0; i -= 0.5) {
      x.fillStyle = fillFunc(i);
      const span = 14;
      const spacing = 64;
      const f = (off: number) => {
        for (let j = 0; j < span; j++) {
          d(
            (j - span / 2) * spacing + spacing / 2,
            offset * off + amplitude * C(j + frames / 60),
            i,
            size * ((span - j) / span),
            size * ((j + 1) / span)
          );
        }
      };
      f(-1);
      f(C(frames / 60));
      f(1);
    }
  };
};

export const higherOrderDonuts = (color = true, extra = 0) => {
  const rFunc = (i: number, j: number) =>
    255 * ~~((1 + 3 * C(i / (99 + 20 * C(j / 5))) * S(j / 2)) % 2);
  const fillFunc = !color
    ? (i: number, j: number) => {
        let r = 255 - rFunc(i, j);
        return R(r, r, r);
      }
    : (i: number, j: number) => {
        let r = rFunc(i, j);
        return r > 0
          ? R(r / 4, extra)
          : R(extra, 0, 99 * C(i / 10) * S(j / 2) + 30);
      };

  return (
    t: number,
    frames: number,
    x: CanvasRenderingContext2D,
    c: HTMLCanvasElement
  ) => {
    if (!frames) {
      x.fillStyle = "black";
      x.fillRect(0, 0, 960, 540);
    }
    let j = frames / 60;
    for (let i = 960; i--; x.fillStyle = fillFunc(i, j)) x.fillRect(i, 0, 1, 1);
    x.drawImage(c, 0, 1);
  };
};

export const bloomTest = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  const hsize = 32;
  const spacing = 100;
  x.fillStyle = "black";
  x.fillRect(0, 0, 960, 540);
  const num = 8;
  for (let i = 0; i < num; i++) {
    const c = 254 / (i + 1) + 1;
    const position = spacing * i - (spacing * (num - 1)) / 2;
    x.fillStyle = R(c, c, c);
    x.fillRect(
      960 / 2 - hsize + position,
      540 / 2 - hsize,
      hsize * 2,
      hsize * 2
    );
  }
};

export const celTest = (
  t: number,
  frames: number,
  x: CanvasRenderingContext2D,
  c: HTMLCanvasElement
) => {
  x.fillStyle = "white";
  x.fillRect(0, 0, 960, 540);
  const g = x.createRadialGradient(480, 270, 0, 400, 200, 200);
  g.addColorStop(0, "#ff0000");
  g.addColorStop(1, "#330000");
  x.fillStyle = g;
  x.beginPath();
  x.arc(480, 270, 200, 0, 2 * Math.PI);
  x.fill();
};
