(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (global = global || self, factory(global.Jampary = {}));
}(this, (function (exports) { 'use strict';

  let LO;
  const splitter = 134217729.;
  function twoSum(a, b) {
      let s = a + b;
      let a1 = s - b;
      LO = (a - a1) + (b - (s - a1));
      return s;
  }
  function twoProd(a, b) {
      let t = splitter * a;
      let ah = t + (a - t), al = a - ah;
      t = splitter * b;
      let bh = t + (b - t), bl = b - bh;
      t = a * b;
      LO = (((ah * bh - t) + ah * bl) + al * bh) + al * bl;
      return t;
  }
  function vecMix(X, Xbegin, Xend, Y, Ybegin, Yend) {
      let len = Xend - Xbegin + Yend - Ybegin;
      let R = new Array(len);
      let i = Xbegin, j = Ybegin, k = 0;
      while (k < len) {
          if (i < Xend && j < Yend) {
              R[k++] = (X[i] > Y[j]) ? X[i++] : Y[j++];
          }
          else {
              R[k++] = (i < Xend) ? X[i++] : Y[j++];
          }
      }
      return R;
  }
  function vecSum(X) {
      let E = new Array(X.length);
      let s = X[X.length - 1];
      for (let i = X.length - 2; i >= 0; i--) {
          s = twoSum(X[i], s);
          E[i + 1] = LO;
      }
      E[0] = s;
      return E;
  }
  function vecSumErrBranch(E, outSize) {
      let F = new Array(E.length);
      let e = E[0], j = 0;
      for (let i = 0; i <= E.length - 2; i++) {
          F[j] = twoSum(e, E[i + 1]);
          e = LO;
          if (e != 0.) {
              if (j++ >= outSize - 1)
                  return F;
          }
          else {
              e = F[j];
          }
      }
      if (e != 0. && j < outSize)
          F[j] = e;
      return F;
  }
  function vecSumErr(F, begin, end) {
      let p = F[begin];
      for (let i = begin; i < end - 1; i++) {
          F[i] = twoSum(p, F[i + 1]);
          p = LO;
      }
      F[end - 1] = p;
      return F;
  }
  function renormalize(X, outSize) {
      let F = vecSumErrBranch(vecSum(X), outSize + 1);
      for (let i = 0; i < outSize; i++) {
          F = vecSumErr(F, i, outSize);
      }
      return F;
  }
  function mul(X, Y) {
      let n = X.length;
      let R = new Array(n + 1);
      let P = new Array(n + 1);
      let S = new Array(n + 1);
      let E = new Array(n * n);
      let E2 = new Array(n + 1);
      R[0] = twoProd(X[0], Y[0]);
      E[0] = LO;
      for (let j = 1; j < n; j++) {
          for (let i = 0; i <= j; i++) {
              P[i] = twoProd(X[i], Y[j - i]);
              E2[i] = LO;
          }
          S = vecSum(vecMix(P, 0, j + 1, E, 0, j * j));
          R[j] = S[0];
          E = vecMix(E, 1, j * j + j + 1, E2, 0, j + 1);
      }
      for (let i = 1; i < n; i++)
          R[n] += X[i] * Y[n - i];
      for (let i = 1; i < n * n; i++)
          R[n] += E[i];
      return renormalize(R, n);
  }

  exports.mul = mul;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
