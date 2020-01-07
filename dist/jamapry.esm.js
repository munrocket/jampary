let LO;
const splitter = 134217729.;
function quickSum(a, b) {
    let s = a + b;
    LO = b - (s - a);
    return s;
}
function twoProd(a, b) {
    let t = splitter * a;
    let ah = t + (a - t), al = a - ah;
    t = splitter * b;
    let bh = t + (b - t), bl = b - bh;
    t = a * b;
    LO = ((ah * bh - t) + ah * bl + al * bh) + al * bl;
    return t;
}
function vecMerge(X, Xbegin, Xend, Y, Ybegin, Yend) {
    let len = Xend - Xbegin + Yend - Ybegin;
    let R = new Array(len);
    let i = Xbegin, j = Ybegin, k = 0;
    while (k < len) {
        if (i < Xend && j < Yend) {
            R[k++] = (Math.abs(X[i]) > Math.abs(Y[j])) ? X[i++] : Y[j++];
        }
        else {
            R[k++] = (i < Xend) ? X[i++] : Y[j++];
        }
    }
    return R;
}
function vecMergeNeg(X, Xbegin, Xend, Y, Ybegin, Yend) {
    let len = Xend - Xbegin + Yend - Ybegin;
    let R = new Array(len);
    let i = Xbegin, j = Ybegin, k = 0;
    while (k < len) {
        if (i < Xend && j < Yend) {
            R[k++] = (Math.abs(X[i]) > Math.abs(Y[j])) ? X[i++] : -Y[j++];
        }
        else {
            R[k++] = (i < Xend) ? X[i++] : -Y[j++];
        }
    }
    return R;
}
function vecSum(X) {
    let E = new Array(X.length);
    let s = X[X.length - 1];
    for (let i = X.length - 2; i >= 0; i--) {
        s = quickSum(X[i], s);
        E[i + 1] = LO;
    }
    E[0] = s;
    return E;
}
function vecSumErrBranch(E, outSize) {
    let F = new Array(E.length);
    let e = E[0], j = 0;
    for (let i = 0; i <= E.length - 2; i++) {
        F[j] = quickSum(e, E[i + 1]);
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
        F[j++] = e;
    for (let i = j; i < outSize; i++)
        F[i] = 0;
    return F;
}
function vecSumErr(F, begin, end) {
    let p = F[begin];
    for (let i = begin; i < end - 1; i++) {
        F[i] = quickSum(p, F[i + 1]);
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
    return F.slice(0, outSize);
}
function add(X, Y) {
    let n = Math.max(X.length, Y.length);
    return renormalize(vecMerge(X, 0, X.length, Y, 0, Y.length), n);
}
function sub(X, Y) {
    let n = Math.max(X.length, Y.length);
    return renormalize(vecMergeNeg(X, 0, X.length, Y, 0, Y.length), n);
}
function mul(X, Y) {
    let n = X.length, m = Y.length, d = Math.max(n, m);
    let R = new Array(d);
    let P = new Array(d);
    let S;
    let E = new Array(d * d);
    let E2 = new Array(d);
    for (let i = n; i < d; i++)
        X[i] = 0;
    for (let i = m; i < d; i++)
        Y[i] = 0;
    R[0] = twoProd(X[0], Y[0]);
    R[d] = 0;
    E[0] = LO;
    for (let j = 1; j < d; j++) {
        for (let i = 0; i <= j; i++) {
            P[i] = twoProd(X[i], Y[j - i]);
            E2[i] = LO;
        }
        S = vecSum(vecMerge(P, 0, j + 1, E, 0, j * j));
        R[j] = S[0];
        E = vecMerge(S, 1, j * j + j + 1, E2, 0, j + 1);
    }
    for (let i = 1; i < d; i++)
        R[d] += X[i] * Y[d - i];
    for (let i = 0; i < d * d; i++)
        R[d] += E[i];
    return renormalize(R, d);
}
function div(X, Y) {
    let n = X.length, m = Y.length, d = Math.max(n, m);
    let F;
    let R = new Array(d);
    let Q = new Array(d);
    for (let i = 0; i < n; i++)
        R[i] = X[i];
    for (let i = n; i < d; i++)
        R[i] = 0;
    Q[0] = X[0] / Y[0];
    for (let i = 1; i < d; i++) {
        F = mul([Q[i - 1]], Y);
        R = renormalize(sub(R, F), d);
        Q[i] = R[0] / Y[0];
    }
    return renormalize(Q, d);
}

export { add, div, mul, sub, vecSum };
