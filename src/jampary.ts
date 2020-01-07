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
function vecMerge(X: Array<float>, Xbegin: int, Xend: int, Y: Array<float>, Ybegin: int, Yend: int): Array<float> {
  let len = Xend - Xbegin + Yend - Ybegin;
  let R = new Array<float>(len);
  let i = Xbegin, j = Ybegin, k = 0;
  while (k < len) {
    if (i < Xend   && j < Yend) {
      R[k++] = (Math.abs(X[i]) > Math.abs(Y[j])) ? X[i++] : Y[j++];
    } else {
      R[k++] = (i < Xend) ? X[i++] : Y[j++];
    }
  }
  return R;
}

// Merge and negate Y
function vecMergeNeg(X: Array<float>, Xbegin: int, Xend: int, Y: Array<float>, Ybegin: int, Yend: int): Array<float> {
  let len = Xend - Xbegin + Yend - Ybegin;
  let R = new Array<float>(len);
  let i = Xbegin, j = Ybegin, k = 0;
  while (k < len) {
    if (i < Xend   && j < Yend) {
      R[k++] = (Math.abs(X[i]) > Math.abs(Y[j])) ? X[i++] : -Y[j++];
    } else {
      R[k++] = (i < Xend) ? X[i++] : -Y[j++];
    }
  }
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
export function vecSumErrBranch(E: Array<float>, outSize: int): Array<float> {
  let F = new Array<float>(E.length);
  let e = E[0], j = 0;
  for (let i = 0; i <= E.length - 2; i++) {
    F[j] = quickSum(e, E[i + 1]);
    e = LO;
    if (e != 0.) {
      if (j++ >= outSize - 1) return F;
    } else {
      e = F[j];
    }
  }
  if (e != 0. && j < outSize) F[j++] = e;
  for (let i = j; i < outSize; i++) F[i] = 0;
  return F;
}

// Algorithm 8
// 2do: inline
function vecSumErr(F: Array<float>, begin: int, end: int): Array<float> {
  let p = F[begin];
  for (let i = begin; i < end - 1; i++) {
    F[i] = quickSum(p, F[i + 1]);
    p = LO;
  }
  F[end - 1] = p;
  return F;
}

// Algorithm 6
function renormalize(X: Array<float>, outSize: int): Array<float> {
  let F = vecSumErrBranch(vecSum(X), outSize + 1);//why?
  for (let i = 0; i < outSize; i++) {
    F = vecSumErr(F, i, outSize);
  }
  return F.slice(0, outSize);//why?
}

/* === Arbitrary-precision operations === */

// Algorithm 4
export function add(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  return renormalize(vecMerge(X, 0, X.length, Y, 0, Y.length), n);
}

// Negated Algorithm 4
export function sub(X: Array<float>, Y: Array<float>): Array<float> {
  let n = Math.max(X.length, Y.length);
  return renormalize(vecMergeNeg(X, 0, X.length, Y, 0, Y.length), n);
}

// Algorithm 5
// 2do: revisit memory
export function mul(X: Array<float>, Y: Array<float>): Array<float> {
  let n = X.length, m = Y.length, d = Math.max(n, m);
  let R = new Array<float>(d);
  let P = new Array<float>(d);
  let S: Array<float>;
  let E = new Array<float>(d * d);
  let E2 = new Array<float>(d);
  for (let i = n; i < d; i++) X[i] = 0;
  for (let i = m; i < d; i++) Y[i] = 0;
  R[0] = twoProd(X[0], Y[0]);
  R[d] = 0;
  E[0] = LO;
  for (let j = 1; j < d; j++) {
    for (let i = 0; i <= j; i++) {
      P[i] = twoProd(X[i], Y[j - i]);
      E2[i] = LO;
    }
    S = vecSum(vecMerge(P, 0, j+1, E, 0, j*j));
    R[j] = S[0];
    E = vecMerge(S, 1, j*j + j + 1, E2, 0, j+1);
  }
  for (let i = 1; i < d; i++) R[d] += X[i] * Y[d - i];
  for (let i = 0; i < d * d; i++) R[d] += E[i];
  return renormalize(R, d);
}

// Algorithm 
export function div(X: Array<float>, Y: Array<float>): Array<float> {
  let n = X.length, m = Y.length, d = Math.max(n, m);
  let F: Array<float>;
  let R = new Array<float>(d);
  let Q = new Array<float>(d);
  for (let i = 0; i < n; i++) R[i] = X[i];
  for (let i = n; i < d; i++) R[i] = 0;
  Q[0] = X[0] / Y[0];
  for (let i = 1; i < d; i++) {
    F = mul([Q[i - 1]], Y);
    R = renormalize(sub(R, F), d);
    Q[i] = R[0] / Y[0];
  }
  return renormalize(Q, d);
}
