/* initialization */

let wasm;
window.onload = function() {

  // set params
  let maxIter = 1000;
  let target = { x: -1.7490863748149415, y: -1e-25, dx: 3e-15, dy: 2e-15};

  // load wasm
  let imports = { env: { abort() { console.error("abort called");}}};
  fetch('/dist/jampary.wasm').then(response =>
    response.arrayBuffer()
  ).then(bytes => WebAssembly.instantiate(bytes, imports)).then(results => {
    wasm = results.instance.exports;
    console.log('wasm loaded, test=' + wasm.test());
  }).catch(() => {
    wasm = { mandelbrot: () => 1 };
    console.log('wasm not supported or some error!');
  }).finally(() => {

    document.getElementById('title').innerHTML = 'Benchmarking...';
    setTimeout(() => {

      // set equal precision and params
      Big.DP = 46;
      Decimal.set({ precision: 46 });
      BigNumber.set({ DECIMAL_PLACES: 46 });

      // benchmark
      let popups = document.getElementsByClassName('bench-popup');
      popups[0].style.display = 'block';
      let now = () => (typeof performance != 'undefined') ? performance.now() : Date.now();
      let calculators = [ //withJampary_Wasm,
        withJampary, withBigNumberJs, withDecimalJs, withBigJs, withBigFloat32
      ]
      calculators.forEach(calculator => {
        let start = now();
        let end = start;
        let counter = 0;
        while (end < start + 1000) {
          counter++;
          draw(calculator, maxIter, target);
          end = now();
        };
        calculator.benchmark = (end - start) / counter;
      });

      // draw charts
      drawCharts(calculators);
      document.getElementById('title').innerHTML = 'Drawing split test...';

      // draw split test
      setTimeout(() => {
        drawSplitTest(withJampary, withNumber, maxIter, target);
        document.getElementById('title').innerHTML = 'Split test and benchmark';
      }, 10);

    }, 10);
  });
}

/* different calculators */

function withJampary_Wasm(maxIter, target, buffer, pixel) {
  let iter = wasm.mandelbrot(
    maxIter,
    buffer.width,
    buffer.height,
    pixel.i,
    pixel.j,
    target.x,
    target.y,
    target.dx,
    target.dy
  );
  colorizer(maxIter, iter - 1, buffer, pixel);
}

function withJampary(maxIter, target, buffer, pixel) {
  let J = Jampary
  let iter = 0;
  let x = [0,0,0], y = [0,0,0];
  let xx = [0,0,0], xy = [0,0,0], yy = [0,0,0];
  let tx = [target.x,0,0], ty = [target.y,0,0];
  let tdx = [target.dx,0,0], tdy = [target.dy,0,0];
  let cx = J.add(J.sub(tx, tdx), J.div(J.mul(tdx, [2 * pixel.i]), [buffer.width]));
  let cy = J.sub(J.add(ty, tdy), J.div(J.mul(tdy, [2 * pixel.j]), [buffer.height]));
  while (iter++ < maxIter && J.add(xx, yy)[0] < 4) {
    x = J.add(J.sub(xx, yy), cx);
    y = J.add(J.add(xy, xy), cy);
    xx = J.mul(x, x);
    yy = J.mul(y, y);
    xy = J.mul(x, y);
  }
  colorizer(maxIter, iter - 1, buffer, pixel); 
}

function withNumber(maxIter, target, buffer, pixel) {
  let iter = 0;
  let x = 0, y = 0;
  let xx = 0, xy = 0, yy = 0;
  let cx = target.x - target.dx + 2 * target.dx * pixel.i / buffer.width;
  let cy = target.y + target.dy - 2 * target.dy * pixel.j / buffer.height;
  while (iter++ < maxIter && xx + yy < 4) {
    x = xx - yy + cx;
    y = xy + xy + cy;
    xx = x * x;
    yy = y * y;
    xy = x * y;
  }
  colorizer(maxIter, iter - 1, buffer, pixel)
}

function withDoubleJs(maxIter, target, buffer, pixel) {
  let D = Double;
  let iter = 0;
  let x = D.Zero, y = D.Zero;
  let xx = D.Zero, xy = D.Zero, yy = D.Zero;
  let tx = new D(target.x), ty = new D(target.y);
  let tdx = new D(target.dx), tdy = new D(target.dy);
  let cx = tx.sub(tdx).add(tdx.mul(new D(2 * pixel.i)).div(new D(buffer.width)));
  let cy = ty.add(tdy).sub(tdy.mul(new D(2 * pixel.j)).div(new D(buffer.height)));
  while (iter++ < maxIter && xx.add(yy).lt(4)) {
    x = xx.sub(yy).add(cx);
    y = xy.add(xy).add(cy);
    xx = x.sqr();
    yy = y.sqr();
    xy = x.mul(y);
  }
  colorizer(maxIter, iter - 1, buffer, pixel);
}

function withDecimalJs(maxIter, target, buffer, pixel) {
  let iter = 0;
  let x = new Decimal(0), y = new Decimal(0);
  let xx = new Decimal(0), xy = new Decimal(0), yy = new Decimal(0);
  let tx = new Decimal(target.x), ty = new Decimal(target.y);
  let tdx = new Decimal(target.dx), tdy = new Decimal(target.dy);
  let cx = tx.sub(tdx).add(tdx.mul(2 * pixel.i).div(buffer.width));
  let cy = ty.add(tdy).sub(tdy.mul(2 * pixel.j).div(buffer.height));
  while (iter++ < maxIter && xx.add(yy).toString() < 4) {
    x = xx.sub(yy).add(cx);
    y = xy.add(xy).add(cy);
    xx = x.mul(x);
    yy = y.mul(y);
    xy = x.mul(y);
  }
  colorizer(maxIter, iter - 1, buffer, pixel);
}

function withBigNumberJs(maxIter, target, buffer, pixel) {
  let BN = BigNumber;
  let iter = 0;
  let x = new BN(0), y = new BN(0);
  let xx = new BN(0), xy = new BN(0), yy = new BN(0);
  let tx = new BN(target.x), ty = new BN(target.y);
  let tdx = new BN(target.dx), tdy = new BN(target.dy);
  let cx = tx.minus(tdx).plus(tdx.times(2 * pixel.i).div(buffer.width)).dp(31);
  let cy = ty.plus(tdy).minus(tdy.times(2 * pixel.j).div(buffer.height)).dp(31);
  while (iter++ < maxIter && xx.plus(yy).toString() < 4) {
    x = xx.minus(yy).plus(cx);
    y = xy.plus(xy).plus(cy);
    xx = x.times(x).dp(31);
    yy = y.times(y).dp(31);
    xy = x.times(y).dp(31);
  }
  colorizer(maxIter, iter - 1, buffer, pixel); 
}

function withBigJs(maxIter, target, buffer, pixel) {
  let iter = 0;
  let x = new Big(0), y = new Big(0);
  let xx = new Big(0), xy = new Big(0), yy = new Big(0);
  let tx = new Big(target.x), ty = new Big(target.y);
  let tdx = new Big(target.dx), tdy = new Big(target.dy);
  let cx = tx.sub(tdx).add(tdx.mul(2 * pixel.i).div(buffer.width)).round(31);
  let cy = ty.add(tdy).sub(tdy.mul(2 * pixel.j).div(buffer.height)).round(31);
  while (iter++ < maxIter && xx.add(yy).toString() < 4) {
    x = xx.sub(yy).add(cx);
    y = xy.add(xy).add(cy);
    xx = x.mul(x).round(31);
    yy = y.mul(y).round(31);
    xy = x.mul(y).round(31);
  }
  colorizer(maxIter, iter - 1, buffer, pixel); 
}

function withBigFloat32(maxIter, target, buffer, pixel) {
  let BF = bigfloat.BigFloat32;
  let iter = 0;
  let x = new BF(0), y = new BF(0);
  let xx = new BF(0), xy = new BF(0), yy = new BF(0);
  let tx = new BF(target.x), ty = new BF(target.y);
  let tdx = new BF(target.dx), tdy = new BF(target.dy);
  let cx = tx.sub(tdx).add(tdx.mul(2 * pixel.i).mul(1/buffer.width)).round(31);
  let cy = ty.add(tdy).sub(tdy.mul(2 * pixel.j).mul(1/buffer.height)).round(31);
  while (iter++ < maxIter && xx.add(yy).toString() < 4) {
    x = xx.sub(yy).add(cx);
    y = xy.add(xy).add(cy);
    xx = x.mul(x).round(31);
    yy = y.mul(y).round(31);
    xy = x.mul(y).round(31);
  }
  colorizer(maxIter, iter - 1, buffer, pixel);
}


/* mandelbrot drawing */

function colorizer(maxIter, iter, buffer, pixel) {
  color = (iter == maxIter) ? 0 : 256 * (maxIter - (iter * 25) % maxIter) / maxIter;
  buffer.data[pixel.id++] = color;
  buffer.data[pixel.id++] = color;
  buffer.data[pixel.id++] = color;
  buffer.data[pixel.id++] = 255;
}

function mandelbrot(calculator, maxIter, target, buffer, pixel) {
  for (pixel.j = 0; pixel.j < buffer.height; pixel.j++) {
    for (pixel.i = 0; pixel.i < buffer.width; pixel.i++) {
      calculator(maxIter, target, buffer, pixel);
    }
  }
}

function mandelbrotSplitTest(calculator1, calculator2, maxIter, target, buffer, pixel) {
  for (pixel.j = 0; pixel.j < buffer.height; pixel.j++) {
    for (pixel.i = 0; pixel.i < buffer.width; pixel.i++) {
      if (pixel.i / buffer.width > pixel.j / buffer.height) {
        calculator1(maxIter, target, buffer, pixel);
      } else {
        calculator2(maxIter, target, buffer, pixel);
      }
    }
  }
}

function draw(calculator, maxIter, target) {
  let canvas = document.getElementById(calculator.name);
  let buffer = canvas.getContext('2d').createImageData(canvas.width, canvas.height);
  let pixel = { i: 0, j: 0, id: 0 };
  mandelbrot(calculator, maxIter, target, buffer, pixel);
  canvas.getContext('2d').putImageData(buffer, 0, 0);
}

function drawSplitTest(calc1, calc2, maxIter, target) {
  let canvas = document.getElementById("split-test");
  let ctx = canvas.getContext('2d');
  let pixel = { i: 0, j: 0, id: 0 };
  let buffer = ctx.createImageData(canvas.width, canvas.height);
  mandelbrotSplitTest(calc1, calc2, maxIter, target, buffer, pixel);
  ctx.putImageData(buffer, 0, 0);
  ctx.beginPath();
  ctx.moveTo(0,0);
  ctx.lineTo(buffer.width, buffer.height);
  ctx.stroke();
  ctx.font = 'bold 15px Open Sans';
  ctx.fillStyle = '#FFF';
  ctx.fillText(calc1.name.slice(4), canvas.width - 63, 15);
  ctx.fillText(calc2.name.slice(4), 6, canvas.height - 8);
}

/* chart drawing */

function drawCharts(calculators) {
  google.charts.load('current', {'packages':['bar']});
  google.charts.setOnLoadCallback(drawChart);
  function drawChart() {
    let array = [['', 'ms']];
    calculators.forEach(calc => array.push([ calc.name.slice(4), calc.benchmark]));
    let data = google.visualization.arrayToDataTable(array);
    let options = {
      //title: 'Mandelbrot benchmark (ms)',
      bars: 'horizontal'
    };
    let chart = new google.charts.Bar(document.getElementById('bar-chart'));
    chart.draw(data, google.charts.Bar.convertOptions(options));
  };

  document.getElementById('title').innerHTML = 'Split test and benchmark';
}