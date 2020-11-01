import { test } from '../node_modules/zora/dist/bundle/index.mjs';
import { add, sub, mul, div } from '../dist/jamapry.esm.js';

let expected, actual, diff, eps = 1e-47;
let pi = [ 3.141592653589793116e+00, 1.224646799147353207e-16, -2.994769809718339666e-33, 1.112454220863365282e-49 ];
let e = [ 2.718281828459045091e+00, 1.445646891729250158e-16, -2.127717108038176765e-33, 1.515630159841218954e-49 ];
let pi2 = [ 6.283185307179586232e+00, 2.449293598294706414e-16, -5.989539619436679332e-33, 2.224908441726730563e-49 ];

function residual(x, y) {
  return Math.abs(sub(x, y)[0]);
}

// import { vecSum, renormalize } from '../dist/jamapry.esm.js';
//
// test('helpers', t => {
//   expected = pi;
//   actual = vecSum(pi);
//   diff = residual(expected, actual);
//   t.ok(diff < eps, 'vecSum (diff=' + diff + ')');
//
//   expected = pi;
//   actual = renormalize(pi, 4);
//   diff = residual(expected, actual);
//   t.ok(diff < eps, 'renormalize (diff=' + diff + ')');
// });

test('4-1 operations', t => {
  let x = 1412.3400;

  expected = pi;
  actual = add(add(pi, [x]), [-x]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'add41 (diff=' + diff + ')');

  expected = pi;
  actual = sub(sub(pi, [x]), [-x]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'sub41 (diff=' + diff + ')');

  expected = pi;
  actual = add(sub(pi, [x]), [x]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'add41/sub41 (diff=' + diff + ')');

  expected = pi2;
  actual = mul(pi, [2]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'mul41 (diff=' + diff + ')');

  expected = pi;
  actual = div(pi2, [2]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'div41 (diff=' + diff + ')');

  expected = e;
  actual = mul(div(e, [x]), [x]);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'mul41/div41 inverse (diff=' + diff + ')');
});

test('4-4 operations', t => {
  expected = pi2;
  actual = add(pi, pi);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'add (diff=' + diff + ')');

  expected = pi;
  actual = sub(pi2, pi);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'sub (diff=' + diff + ')');

  expected = [2];
  actual = div(pi2, pi);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'div (diff=' + diff + ')');
  
  expected = pi;
  actual = sub(add(pi, e), e);
  diff = residual(expected, actual);
  t.ok(diff < eps, 'additive inverse (diff=' + diff + ')');

  // expected = pi;
  // actual = mul(div(e, pi), pi);
  // diff = residual(expected, actual);
  // t.ok(diff < eps, 'multiplicative inverse (diff=' + diff + ')');
});