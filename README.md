## JAMPARY: JAvascript Multiple Precision Arithmetic libraRY

Modern arbitrary-precision arithmetic library using floating-point expansions.

### Early stage results without wasm and FMA
![](https://habrastorage.org/webt/ky/ag/px/kyagpxlqqxcezuszpfn6qna83rc.png)
[online benchmark](https://munrocket.github.io/jampary/test/benchmark.html)

### 2do
- [x] mvp
- [x] mandel test
- [x] fix mul/div
- [ ] optimization

### References
1. Mioara Joldes, Olivier Marty, Jean-Michel Muller, Valentina Popescu,
  *Arithmetic algorithms for extended precision using floating-point expansions*, 2015.
  [[pdf](https://hal.archives-ouvertes.fr/hal-01111551v2/document)]
2. J.-M. Muller, Valentina Popescu, Ping Tak Peter Tang
  *A new multiplication algorithm for extended precision using floating-point expansions*, 2016.
  [[pdf](http://perso.ens-lyon.fr/jean-michel.muller/Expansions_ARITH_23.pdf)]
3. J.-M. Muller, N. Brisebarre, F. deDinechin, C.-P. Jeannerod, V. Lefevre etc.,
  *Handbook of Floating-Point Arithmetic*, Chapter 14.1.2, 2010.
