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

// Algorithm 3.1 from [2]
function twoSum(a: float, b: float): float {
  let s = a + b;
  let a1  = s - b;
  LO = (a - a1) + (b - (s - a1));
  return s;
}

// Algorithm 3.3 with inlined 4.6 from [2]
function twoProd(a: float, b: float): float {
  let t = splitter * a;
  let ah = t + (a - t), al = a - ah;
  t = splitter * b;
  let bh = t + (b - t), bl = b - bh;
  t = a * b;
  LO = ((ah * bh - t) + ah * bl + al * bh) + al * bl;
  return t;
}

// Merge two descending sorted arrays of floats into one sorted array
function vecMerge(X: Array<float>, Xbegin: int, Xend: int,
                  Y: Array<float>, Ybegin: int, Yend: int): Array<float> {
  let k = 0, R = new Array<float>(Xend - Xbegin + Yend - Ybegin);
  for (let i = Xbegin; i < Xend; i++) R[k++] = X[i];
  for (let j = Ybegin; j < Yend; j++) R[k++] = Y[j];
  return R;
}

// Previous merge with negated Y
function vecMergeNeg(X: Array<float>, Xbegin: int, Xend: int,
                     Y: Array<float>, Ybegin: int, Yend: int): Array<float> {
  let k = 0, R = new Array<float>(Xend - Xbegin + Yend - Ybegin);
  for (let i = Xbegin; i < Xend; i++) R[k++] = X[i];
  for (let j = Ybegin; j < Yend; j++) R[k++] = -Y[j];
  return R;
}

// Algorithm 3
export function vecSum(X: Array<float>): Array<float> {
  let E = new Array<float>(X.length);
  let s = X[X.length - 1];
  for (let i = X.length - 2; i >= 0; i--) {
    s = quickSum(X[i], s);
    E[i + 1] = LO;
  }
  E[0] = s;
  return E;
}

// Algorithm 7
function vecSumErrBranch(E: Array<float>, outSize: int): Array<float> {
  let F = new Array<float>(E.length);
  let e = E[0], j = 0;
  for (let i = 0; i <= E.length - 2; i++) {
    F[j] = quickSum(e, E[i+1]);
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
function vecSumErr(F: Array<float>, begin: int, end: int): Array<float> {
  let p = F[begin];
  for (let i = begin; i < end - 1; i++) {
    F[i] = quickSum(p, F[i + 1]);
    p = LO;
  }
  F[end - 1] = p;
  return F;
}

// Algorithm 6 with inlined Algorithm 8
function renormalize(X: Array<float>, outSize: int): Array<float> {
  let F = vecSumErrBranch(vecSum(X), outSize + 1);
  for (let i = 0; i < outSize; i++) {
    F = vecSumErr(F, i, outSize);
  }
  return (X.length == outSize) ? F : F.slice(0, outSize);
}

/* === Arbitrary-precision operations === */

// Algorithm 4
export function add(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  return renormalize(vecMerge(X, 0, X.length, Y, 0, Y.length), n);
}
// export function addFull(X: Array<float>, Y: Array<float>): Array<float> {
//   let n = X.length + Y.length;
//   return renormalize(vecMerge(X, 0, X.length, Y, 0, Y.length), n);
// }

// Negated Algorithm 4
export function sub(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  return renormalize(vecMergeNeg(X, 0, X.length, Y, 0, Y.length), n);
}
// export function subFull(X: Array<float>, Y: Array<float>): Array<float> {
//   let n = X.length + Y.length;
//   return renormalize(vecMergeNeg(X, 0, X.length, Y, 0, Y.length), n);
// }

// Algorithm 5
// 2do: get rid of P
export function mul(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  let R = new Array<float>(n);
  let P = new Array<float>(n);
  let S = new Array<float>(n * n);
  let E = new Array<float>(n * n);
  let E2 = new Array<float>(n);
  R[0] = twoProd(X[0], Y[0]);
  E[0] = LO;
  for (let j = 1; j < n; j++) {
    for (let i = 0; i <= j; i++) {
      P[i] = twoProd(X[i], Y[j - i]);
      E2[i] = LO;
    }
    S = vecSum(vecMerge(P, 0, j + 1, E, 0, j*j));
    R[j] = S[0];
    E = vecMerge(S, 1, j*j + j + 1, E2, 0, j + 1);
  }
  R[n] = 0;
  for (let i = 1; i < n; i++) R[n] += X[i] * Y[n - i];
  for (let i = 0; i < n * n; i++) R[n] += E[i];
  return renormalize(R, n);
}

// Algorithm 
export function div(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  let q = X[0] / Y[0];
  let R = new Array<float>(n);
  return R;
}
