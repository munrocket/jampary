var Jampary = (function (exports) {
  'use strict';

  let max = Math.max;
  const splitter = 134217729.;
  let EE;
  function quickSum(a, b) {
      let s = a + b;
      EE = b - (s - a);
      return s;
  }
  function twoProd(a, b) {
      let t = splitter * a;
      let ah = t + (a - t), al = a - ah;
      t = splitter * b;
      let bh = t + (b - t), bl = b - bh;
      t = a * b;
      EE = al * bl - (((t - ah * bh) - ah * bl) - al * bh);
      return t;
  }
  function vecMerge(A, Al, Ar, B, Bl, Br) {
      let len = Ar - Al + Br - Bl;
      let R = new Array(len);
      let i = Al, j = Bl, k = 0;
      while (k < len) {
          if (i < Ar && j < Br) {
              R[k++] = (Math.abs(A[i]) > Math.abs(B[j])) ? A[i++] : B[j++];
          }
          else {
              R[k++] = (i < Ar) ? A[i++] : B[j++];
          }
      }
      return R;
  }
  function vecMergeNeg(A, Al, Ar, B, Bl, Br) {
      let len = Ar - Al + Br - Bl;
      let R = new Array(len);
      let i = Al, j = Bl, k = 0;
      while (k < len) {
          if (i < Ar && j < Br) {
              R[k++] = (Math.abs(A[i]) > Math.abs(B[j])) ? A[i++] : -B[j++];
          }
          else {
              R[k++] = (i < Ar) ? A[i++] : -B[j++];
          }
      }
      return R;
  }
  function vecSum(A) {
      let E = new Array(A.length);
      let s = A[A.length - 1];
      for (let i = A.length - 2; i >= 0; --i) {
          s = quickSum(A[i], s);
          E[i + 1] = EE;
      }
      E[0] = s;
      return E;
  }
  function renormalize(A, outSize) {
      let E = vecSum(A);
      let F = (outSize == E.length) ? E : new Array(outSize);
      let e = E[0], j = 0;
      for (let i = 1; i < E.length && j < outSize; ++i) {
          F[j] = quickSum(e, E[i]);
          e = EE;
          if (e != 0.) {
              ++j;
          }
          else {
              e = F[j];
          }
      }
      if (e != 0. && j < outSize)
          F[j] = e;
      for (let i = j + 1; i < outSize; ++i)
          F[i] = 0.;
      for (let i = 0; i < outSize - 1; ++i) {
          e = F[i];
          for (let j = i; j < outSize - 1; ++j) {
              F[j] = quickSum(e, F[j + 1]);
              e = EE;
          }
          F[outSize - 1] = e;
      }
      return F;
  }
  function add(A, B) {
      let n = max(A.length, B.length);
      return renormalize(vecMerge(A, 0, A.length, B, 0, B.length), n);
  }
  function sub(A, B) {
      let n = max(A.length, B.length);
      return renormalize(vecMergeNeg(A, 0, A.length, B, 0, B.length), n);
  }
  function mul(A, B) {
      let n = A.length, m = B.length, d = max(n, m);
      let R = new Array(d + 1);
      let P = new Array(d);
      let E = new Array(d * d);
      let E2 = new Array(d);
      let S;
      if (n < d) {
          let T = A;
          A = new Array(d);
          for (let i = 0; i < n; ++i)
              A[i] = T[i];
          for (let i = n; i < d; ++i)
              A[i] = 0.;
      }
      if (m < d) {
          let T = B;
          B = new Array(d);
          for (let i = 0; i < m; ++i)
              B[i] = T[i];
          for (let i = m; i < d; ++i)
              B[i] = 0.;
      }
      R[0] = twoProd(A[0], B[0]);
      E[0] = EE;
      R[d] = 0.;
      for (let n = 1; n < d; ++n) {
          for (let i = 0; i <= n; ++i) {
              P[i] = twoProd(A[i], B[n - i]);
              E2[i] = EE;
          }
          S = vecSum(vecMerge(P, 0, n + 1, E, 0, n * n));
          R[n] = S[0];
          E = vecMerge(S, 1, n * n + n + 1, E2, 0, n + 1);
      }
      for (let i = 1; i < d; ++i)
          R[d] += A[i] * B[d - i];
      for (let i = 0; i < d * d; ++i)
          R[d] += E[i];
      return renormalize(R, d);
  }
  function div(A, B) {
      let n = A.length, m = B.length, d = max(n, m);
      let T;
      let R = new Array(d);
      let Q = new Array(d);
      for (let i = 0; i < n; ++i)
          R[i] = A[i];
      for (let i = n; i < d; ++i)
          R[i] = 0.;
      for (let i = m; i < d; ++i)
          B[i] = 0.;
      if (m < d) {
          T = B;
          B = new Array(d);
          for (let i = 0; i < m; ++i)
              B[i] = T[i];
          for (let i = m; i < d; ++i)
              B[i] = 0.;
      }
      Q[0] = A[0] / B[0];
      for (let i = 1; i < d; ++i) {
          T = mul([Q[i - 1]], B);
          R = renormalize(sub(R, T), d);
          Q[i] = R[0] / B[0];
      }
      return renormalize(Q, d);
  }
  function mandelbrot(maxIteration, width, height, i, j, x0, y0, dx, dy) {
      let iteration = 0;
      let x = [0., 0., 0., 0.];
      let y = [0., 0., 0., 0.];
      let xx = [0., 0., 0., 0.];
      let xy = [0., 0., 0., 0.];
      let yy = [0., 0., 0., 0.];
      let tx = [x0, 0., 0., 0.];
      let ty = [y0, 0., 0., 0.];
      let tdx = [dx, 0., 0., 0.];
      let tdy = [dy, 0., 0., 0.];
      let I = [2. * i, 0., 0., 0.];
      let J = [2. * j, 0., 0., 0.];
      let W = [width, 0., 0., 0.];
      let H = [height, 0., 0., 0.];
      let cx = add(sub(tx, tdx), div(mul(tdx, I), W));
      let cy = sub(add(ty, tdy), div(mul(tdy, J), H));
      while (iteration++ < maxIteration && add(xx, yy)[0] < 4.) {
          x = add(sub(xx, yy), cx);
          y = add(add(xy, xy), cy);
          xx = mul(x, x);
          yy = mul(y, y);
          xy = mul(x, y);
      }
      return iteration;
  }

  exports.add = add;
  exports.div = div;
  exports.mandelbrot = mandelbrot;
  exports.mul = mul;
  exports.sub = sub;

  return exports;

}({}));
