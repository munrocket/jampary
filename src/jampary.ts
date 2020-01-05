type float = number;
type int = number;
let LO: float;
const splitter = 134217729.; // = 2^27+1 for 64-bit float

// 2do: inline in all places
function quickSum(a: float, b: float): float {
  let s = a + b;
  LO = b - (s - a);
  return s;
}

// Algorithm 4.4 from [2]
function twoSum(a: float, b: float): float {
  let s = a + b;
  let a1  = s - b;
  LO = (a - a1) + (b - (s - a1));
  return s;
}

// Algorithm 4.7 with inlined 4.6 from [2]
function twoProd(a: float, b: float): float {
  let t = splitter * a;
  let ah = t + (a - t), al = a - ah;
  t = splitter * b;
  let bh = t + (b - t), bl = b - bh;
  t = a * b;
  LO = (((ah * bh - t) + ah * bl) + al * bh) + al * bl;
  return t;
}

// Merge two descending sorted arrays of floats into one sorted array
function vecMix(X: Array<float>, Xbegin: int, Xend: int, Y: Array<float>, Ybegin: int, Yend: int): Array<float> {
  let len = Xend - Xbegin + Yend - Ybegin;
  let R = new Array<float>(len);
  let i = Xbegin, j = Ybegin, k = 0;
  while (k < len) {
    if (i < Xend   && j < Yend) {
      R[k++] = (X[i] > Y[j]) ? X[i++] : Y[j++];
    } else {
      R[k++] = (i < Xend) ? X[i++] : Y[j++];
    }
  }
  return R;
}

// Algorithm 3 from [1]
// 2do: quickSum optimization
function vecSum(X: Array<float>): Array<float> {
  let E = new Array<float>(X.length);
  let s = X[X.length - 1];
  for (let i = X.length - 2; i >= 0; i--) {
    s = twoSum(X[i], s);
    E[i + 1] = LO;
  }
  E[0] = s;
  return E;
}

// Algorithm 7 from [1]
// 2do: quickSum optimization
function vecSumErrBranch(E: Array<float>, outSize: int): Array<float> {
  let F = new Array<float>(E.length);
  let e = E[0], j = 0;
  for (let i = 0; i <= E.length - 2; i++) {
    F[j] = twoSum(e, E[i+1]);
    e = LO;
    if (e != 0.) {
      if (j++ >= outSize - 1) return F;
    } else {
      e = F[j];
    }
  }
  if (e != 0. && j < outSize) F[j] = e;
  return F;
}

// Algorithm 8 
// 2do: inline
function vecSumErr(F: Array<float>, begin: int, end: int): Array<float> {
  let p = F[begin];
  for (let i = begin; i < end - 1; i++) {
    F[i] = twoSum(p, F[i + 1]);
    p = LO;
  }
  F[end - 1] = p;
  return F;
}

// Algorithm 6 with inlined Algorithm 8 from [1]
// 2do: revision
function renormalize(X: Array<float>, outSize: int): Array<float> {
  let F = vecSumErrBranch(vecSum(X), outSize + 1);
  for (let i = 0; i < outSize; i++) {
    F = vecSumErr(F, i, outSize);
  }
  return F;
}

/* === Arbitrary-precision operations === */

// Algorithm 4 from [1]
export function add(X: Array<float>, Y: Array<float>): Array<float> {
  return renormalize(vecMix(X, 0, X.length, Y, 0, Y.length), Math.max(X.length, Y.length));
}

// Negated Algorithm 4 from [1]
export function sub(X: Array<float>, Y: Array<float>): Array<float> {
  let size = Math.max(X.length, Y.length);
  for (let i = 0; i < Y.length; i++) Y[i] = -Y[i];
  return renormalize(vecMix(X, 0, X.length, Y, 0, Y.length), Math.max(X.length, Y.length));
}

// Algorithm 5 from [1]
// 2do: memory optimization
export function mul(X: Array<float>, Y: Array<float>): Array<float> {
  let n = X.length;
  let R = new Array<float>(n + 1);
  let P = new Array<float>(n + 1);
  let S = new Array<float>(n + 1);
  let E = new Array<float>(n * n);
  let E2 = new Array<float>(n + 1);
  R[0] = twoProd(X[0], Y[0]);
  E[0] = LO;
  for (let j = 1; j < n; j++) {
    for (let i = 0; i <= j; i++) {
      P[i] = twoProd(X[i], Y[j - i]);
      E2[i] = LO;
    }
    S = vecSum(vecMix(P, 0, j + 1, E, 0, j*j));
    R[j] = S[0];
    E = vecMix(E, 1, j*j + j + 1, E2, 0, j + 1);
  }
  for (let i = 1; i < n; i++) R[n] += X[i] * Y[n - i];
  for (let i = 1; i < n * n; i++) R[n] += E[i];
  return renormalize(R, n);
}

// export function test(Eh: float, El: float, Lh: float, Ll: float): float {
//   let result: float = 0.;
//   let Rh = sub(sub(add(Eh, El, Lh, Ll), LO, Lh, Ll), LO, Eh, El); let Rl = LO;
//   let diff: float = abs(Rh, Rl);
//   if (diff > 1e-30) result += 1.;
//   Rh = sub(div(mul(Eh, El, Lh, Ll), LO, Lh, Ll), LO, Eh, El); Rl = LO;
//   diff = abs(Rh, Rl);
//   if (diff > 1e-30) result += 2.;
//   return result;
// }

// export function mandelbrot(maxIteration: int, width: float, height: float,
//     TXh: float, TYh: float, DXh: float, DYh: float, i: float, j: float): int {
//   let Xh = 0., Xl = 0., Yh = 0., Yl = 0.;
//   let XXh = 0., XXl = 0., XYh = 0., XYl = 0., YYh = 0., YYl = 0.;
//   let CXh = add(sub(TXh, 0., DXh, 0.), LO,
//                   div(mul(DXh, 0., 2 * i, 0.), LO, width, 0.), LO), CXl = LO;
//   let CYh = sub(add(TYh, 0., DYh, 0.), LO,
//                   div(mul(DYh, 0., 2 * j, 0.), LO, height, 0.), LO), CYl = LO;
//   let iteration: int = 0;
//   while (iteration++ < maxIteration && lt(add(XXh, XXl, YYh, YYl), LO, 4.)) {
//     Xh = add(sub(XXh, XXl, YYh, YYl), LO, CXh, CXl); Xl = LO;
//     Yh = add(add(XYh, XYl, XYh, XYl), LO, CYh, CYl); Yl = LO;
//     XXh = mul(Xh, Xl, Xh, Xl); XXl = LO;
//     YYh = mul(Yh, Yl, Yh, Yl); YYl = LO;
//     XYh = mul(Xh, Xl, Yh, Yl); XYl = LO;
//   }
//   return iteration;
// }