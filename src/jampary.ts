// type float = number;
// type int = number;
// let max = Math.max;
// let sqrt = Math.sqrt;

type float = f64;
type int = i32;

type Vec = Array<float>;
const splitter = 134217729.; // = 2^27+1 for 64-bit float
let EE: float; // global variable for storing temp error

/* === Basic EFT bricks === */

// 2do: inline
@inline
function quickSum(a: float, b: float): float {
  let s = a + b;
  EE = b - (s - a);
  return s;
}

// Algorithm 3.1 from [2]
@inline
function twoSum(a: float, b: float): float {
  let s = a + b;
  let t  = s - b;
  EE = (a - t) + (b - (s - t));
  return s;
}

// Algorithm 3.3 with inlined 3.2 from [2]
@inline
function twoProd(a: float, b: float): float {
  let t = splitter * a;
  let ah = t + (a - t), al = a - ah;
  t = splitter * b;
  let bh = t + (b - t), bl = b - bh;
  t = a * b;
  EE = al * bl - (((t - ah * bh) - ah * bl) - al * bh);
  return t;
}

/* === Vectorized helpers === */

// Merge two descending sorted Arrays of floats into one sorted Array
// opt hypo: simple merge (concat) with twoSum
function vecMerge(A: Vec, Al: int, Ar: int, B: Vec, Bl: int, Br: int): Vec {
  let len = Ar - Al + Br - Bl;
  let R = new Array<float>(len);
  let i = Al, j = Bl, k = 0;
  while (k < len) {
    if (i < Ar && j < Br) {
      R[k++] = (Math.abs(A[i]) > Math.abs(B[j])) ? A[i++] : B[j++];
    } else {
      R[k++] = (i < Ar) ? A[i++] : B[j++];
    }
  }
  return R;
}

// Merge and negate B
function vecMergeNeg(A: Vec, Al: int, Ar: int, B: Vec, Bl: int, Br: int): Vec {
  let len = Ar - Al + Br - Bl;
  let R = new Array<float>(len);
  let i = Al, j = Bl, k = 0;
  while (k < len) {
    if (i < Ar && j < Br) {
      R[k++] = (Math.abs(A[i]) > Math.abs(B[j])) ? A[i++] : -B[j++];
    } else {
      R[k++] = (i < Ar) ? A[i++] : -B[j++];
    }
  }
  return R;
}

// Algorithm 3
function vecSum(A: Vec): Vec {
  let E = new Array<float>(A.length);
  let s = A[A.length - 1];
  for (let i = A.length - 2; i >= 0; i--) {
    s = quickSum(A[i], s);
    E[i + 1] = EE;
  }
  E[0] = s;
  return E;
}

// Algorithm 7
function vecSumErrBranch(E: Vec, outSize: int): Vec {
  let F = new Array<float>(E.length);
  let e = E[0], j = 0;
  for (let i = 0; i <= E.length - 2; i++) {
    F[j] = quickSum(e, E[i + 1]);
    e = EE;
    if (e != 0.) {
      if (j++ >= outSize - 1) return F;
    } else {
      e = F[j];
    }
  }
  if (e != 0. && j < outSize) F[j++] = e;
  for (let i = j; i < outSize; i++) F[i] = 0.;
  return F;
}

// Algorithm 8
// 2do in release: inline
function vecSumErr(F: Vec, begin: int, end: int): Vec {
  let p = F[begin];
  for (let i = begin; i < end - 1; i++) {
    F[i] = quickSum(p, F[i + 1]);
    p = EE;
  }
  F[end - 1] = p;
  return F;
}

// Algorithm 6
function renormalize(A: Vec, outSize: int): Vec {
  let F = vecSumErrBranch(vecSum(A), outSize + 1);//why?
  for (let i = 0; i < outSize; i++) {
    F = vecSumErr(F, i, outSize);
  }
  return F.slice(0, outSize);
}

/* === Arbitrary-precision operations === */

// Algorithm 4 (rounded)
export function add(A: Vec, B: Vec): Vec {
  let n = max(A.length, B.length);
  return renormalize(vecMerge(A, 0, A.length, B, 0, B.length), n);
}

// Negated Algorithm 4 (rounded)
export function sub(A: Vec, B: Vec): Vec {
  let n = max(A.length, B.length);
  return renormalize(vecMergeNeg(A, 0, A.length, B, 0, B.length), n);
}

// Algorithm 5 (rounded)
// 2do: revisit memory consumtion
export function mul(A: Vec, B: Vec): Vec {
  let n = A.length, m = B.length, d = max(n, m);
  let R = new Array<float>(d + 1);
  let P = new Array<float>(d);
  let E = new Array<float>(d * d);
  let E2 = new Array<float>(d);
  let S: Array<float>;
  if (n < d) {
    let T = A;
    A = new Array<float>(d);
    for (let i = 0; i < n; i++) A[i] = T[i];
    for (let i = n; i < d; i++) A[i] = 0.;
  }
  if (m < d) {
    let T = B;
    B = new Array<float>(d);
    for (let i = 0; i < m; i++) B[i] = T[i];
    for (let i = m; i < d; i++) B[i] = 0.;
  }
  R[0] = twoProd(A[0], B[0]);
  E[0] = EE;
  R[d] = 0.;
  for (let n = 1; n < d; n++) {
    for (let i = 0; i <= n; i++) {
      P[i] = twoProd(A[i], B[n - i]);
      E2[i] = EE;
    }
    S = vecSum(vecMerge(P, 0, n + 1, E, 0, n * n));//opt:vecMerge?
    R[n] = S[0];
    E = vecMerge(S, 1, n * n + n + 1, E2, 0, n + 1);
  }
  for (let i = 1; i < d; i++) R[d] += A[i] * B[d - i];
  for (let i = 0; i < d * d; i++) R[d] += E[i];
  return renormalize(R, d);
}

// Algorithm 9 (rounded)
export function div(A: Vec, B: Vec): Vec {
  let n = A.length, m = B.length, d = max(n, m);
  let T: Array<float>;
  let R = new Array<float>(d);
  let Q = new Array<float>(d);
  for (let i = 0; i < n; i++) R[i] = A[i];
  for (let i = n; i < d; i++) R[i] = 0.;
  for (let i = m; i < d; i++) B[i] = 0.;
  if (m < d) {
    T = B;
    B = new Array<float>(d);
    for (let i = 0; i < m; i++) B[i] = T[i];
    for (let i = m; i < d; i++) B[i] = 0.;
  }
  Q[0] = A[0] / B[0];
  for (let i = 1; i < d; i++) {
    T = mul([Q[i - 1]], B);
    R = renormalize(sub(R, T), d);
    Q[i] = R[0] / B[0];
  }
  return renormalize(Q, d);
}

/*
// Algorithm 10
export function div10(A: Vec, B: Vec): Vec {
  let n = A.length, m = B.length, d = max(n, m);
  for (let i = n; i < d; i++) A[i] = 0.;
  for (let i = m; i < d; i++) B[i] = 0.;
  let X: Array<float> = [1. / B[0]];
  for (let i = 0; i < 4; i++) {
    X = mul(X, sub([4.], mul(X, B)));
  }
  return mul(A, X);
}

// Argorithm 11
export function rsqrt(A: Vec): Vec {
  let X: Array<float> = [1. / sqrt(A[0])];
  for (let i = 0; i < 4; i++) {
    X = mul(div(X, [2.]), sub([3.], mul(X, mul(X, A))));
  }
  return X;
}
*/

export function mandelbrot(maxIteration: int, width: float, height: float, i: float, j: float,
    x0: float, y0: float, dx: float, dy: float): int {
  let iteration: int = 0;
  let x: Array<float> = [0.,0.]; let y: Array<float> = [0.,0.];
  let xx: Array<float> = [0.,0.]; let xy: Array<float> = [0.,0.]; let yy: Array<float> = [0.,0.];
  let tx: Array<float> = [x0,0.]; let ty: Array<float> = [y0,0.];
  let tdx: Array<float> = [dx,0.]; let tdy: Array<float> = [dy,0.];
  let I: Array<float> = [2.*i,0.]; let J: Array<float> = [2.*j,0.];
  let W: Array<float> = [width,0.]; let H: Array<float> = [height,0.];
  let cx: Array<float> = add(sub(tx, tdx), div(mul(tdx, I), W));
  let cy: Array<float> = sub(add(ty, tdy), div(mul(tdy, J), H));
  while (iteration++ < maxIteration && add(xx, yy)[0] < 4.) {
    x = add(sub(xx, yy), cx);
    y = add(add(xy, xy), cy);
    xx = mul(x, x);
    yy = mul(y, y);
    xy = mul(x, y);
  }
  return iteration; 
}

export function test(): float {
  return 42.;
}