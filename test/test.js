import { add, sub, mul, div } from '../dist/jamapry.esm.js';

let pi = [ 3.141592653589793116e+00, 1.224646799147353207e-16, -2.994769809718339666e-33, 1.112454220863365282e-49 ];
let e = [ 2.718281828459045091e+00, 1.445646891729250158e-16, -2.127717108038176765e-33, 1.515630159841218954e-49 ];

console.log(pi);
console.log(sub(add(pi, e), e));
console.log(e);
console.log(sub(add(e, pi), pi));