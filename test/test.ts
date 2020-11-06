import { add, sub, mul, div, Vec } from '../src/jampary';
type float = f64;
type int = i32;

export function test(): float {

  let expected: Vec, actual: Vec, diff: float, eps = 1e-60, errorcode: float;
  let pi: Vec = [ 3.141592653589793116e+00, 1.224646799147353207e-16, -2.994769809718339666e-33, 1.112454220863365282e-49 ];
  let e: Vec = [ 2.718281828459045091e+00, 1.445646891729250158e-16, -2.127717108038176765e-33, 1.515630159841218954e-49 ];
  let pi2: Vec = [ 6.283185307179586232e+00, 2.449293598294706414e-16, -5.989539619436679332e-33, 2.224908441726730563e-49 ];

  let x = 23452.34563;

  //41
  
  expected = pi;
  actual = add(add(pi, [x]), [-x]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 1.;

  expected = pi;
  actual = sub(sub(pi, [x]), [-x]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 2.;

  expected = pi2;
  actual = mul(pi, [2]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 4.;

  expected = pi;
  actual = div(pi2, [2]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 8.;

  expected = pi;
  actual = add(sub(pi, [x]), [x]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 16.;

  expected = e;
  actual = mul(div(e, [x]), [x]);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 32.;

  //14

  expected = pi;
  actual = add([-x], add([x], pi));
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 64.;

  expected = pi;
  actual = sub([x], sub([x], pi));
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 128.;

  expected = pi2;
  actual = mul([2], pi);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 512.;

  expected = div([1], pi);
  actual = div([2], pi2);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 1024.;

  expected = mul(pi, [-1]);
  actual = sub([x], add([x], pi));
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 2048.;

  expected = e;
  actual = mul([x], div(e, [x]));
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 4096.;

  //44

  expected = pi2;
  actual = add(pi, pi);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 8192.;

  expected = pi;
  actual = sub(pi2, pi);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 16384.;

  expected = e;
  actual = div(pi, div(pi, e));
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 32768.;
  
  expected = pi;
  actual = sub(add(pi, e), e);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 65536.;

  expected = e;
  actual = mul(div(e, pi), pi);
  diff = abs(sub(expected, actual)[0]);
  if (diff > eps) errorcode += 131072.;

  return errorcode;
}