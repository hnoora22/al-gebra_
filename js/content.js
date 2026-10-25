/* Course content: units, lessons, and problem generators.
   Every lesson has a generator, so practice, worksheets and exam review
   produce fresh problems every time (no problem bank to maintain). */
(function (root) {
  const AP = (root.AP = root.AP || {});

  // ---------- helpers ----------
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[R(0, arr.length - 1)];
  const nz = (a, b) => { let n = 0; while (n === 0) n = R(a, b); return n; };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const n2s = (n) => (n < 0 ? '\u2212' + Math.abs(n) : '' + n);
  const SUP = ['\u2070', '\u00b9', '\u00b2', '\u00b3', '\u2074', '\u2075', '\u2076', '\u2077', '\u2078', '\u2079'];
  const sup = (n) => (n < 0 ? '\u207b' : '') + String(Math.abs(n)).split('').map((d) => SUP[+d]).join('');
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const T = (c, v) => { const a = Math.abs(c); return v ? (a === 1 ? v : a + v) : '' + a; };
  const join = (ts) => { let s = ''; ts.forEach(([c, v], i) => { s += i === 0 ? (c < 0 ? '\u2212' : '') + T(c, v) : (c < 0 ? ' \u2212 ' : ' + ') + T(c, v); }); return s; };
  const lin = (m, n, v) => { v = v || 'x'; return m === 0 ? n2s(n) : n === 0 ? join([[m, v]]) : join([[m, v], [n, '']]); };
  const px = (list) => {
    const l = list.filter((t) => t[0] !== 0);
    if (!l.length) return '0';
    return l.map(([c, e], i) => {
      const a = Math.abs(c);
      const body = e === 0 ? '' + a : (a === 1 ? '' : a) + 'x' + (e === 1 ? '' : sup(e));
      return i === 0 ? (c < 0 ? '\u2212' : '') + body : (c < 0 ? ' \u2212 ' : ' + ') + body;
    }).join('');
  };
  const poly = (coeffs) => px(coeffs.map((c, i) => [c, coeffs.length - 1 - i]));
  const fac = (r) => (r < 0 ? '(x + ' + -r + ')' : r > 0 ? '(x \u2212 ' + r + ')' : 'x');
  const par = (n) => (n < 0 ? '(' + n2s(n) + ')' : '' + n);

  function num(q, answer, why) { return { type: 'num', q, answer, why }; }
  function mc(q, answer, wrongs, why) {
    const opts = [];
    [answer, ...wrongs].forEach((o) => { o = String(o); if (!opts.includes(o)) opts.push(o); });
    if (opts.length < 2) throw new Error('not enough options for: ' + q);
    return { type: 'mc', q, answer: String(answer), options: shuffle(opts.slice(0, 4).includes(String(answer)) ? opts.slice(0, 4) : [String(answer), ...opts.slice(0, 3)]), why };
  }
  const pairStr = (pts) => pts.map(([x, y]) => '(' + n2s(x) + ', ' + n2s(y) + ')').join(', ');

  // ---------- units ----------
  AP.UNITS = [
    { id: 1, title: 'Foundations of Algebra', icon: '\ud83e\uddf1', blurb: 'Order of operations, expressions, like terms' },
    { id: 2, title: 'Solving Equations', icon: '\u2696\ufe0f', blurb: 'One-step to multi-step equations' },
    { id: 3, title: 'Inequalities', icon: '\u2194\ufe0f', blurb: 'Solving, flipping signs, absolute value' },
    { id: 4, title: 'Introduction to Functions', icon: '\ud83c\udf9b\ufe0f', blurb: 'Function notation and evaluating' },
    { id: 5, title: 'Linear Equations and Graphs', icon: '\ud83d\udcc8', blurb: 'Slope, intercepts, lines' },
    { id: 6, title: 'Systems of Equations', icon: '\ud83d\udd00', blurb: 'Substitution, elimination, solution types' },
    { id: 7, title: 'Exponents', icon: '\ud83d\ude80', blurb: 'Exponent rules and scientific notation' },
    { id: 8, title: 'Polynomials', icon: '\ud83e\uddee', blurb: 'Degree, adding, multiplying' },
    { id: 9, title: 'Factoring', icon: '\ud83e\udde9', blurb: 'GCF, trinomials, difference of squares' },
    { id: 10, title: 'Quadratics', icon: '\ud83c\udfaf', blurb: 'Solving and the vertex' },
    { id: 11, title: 'Radicals', icon: '\u221a', blurb: 'Roots and the Pythagorean theorem' },
    { id: 12, title: 'Data and Statistics', icon: '\ud83d\udcca', blurb: 'Mean, median, lines of best fit' },
  ];

  AP.ALG2 = ['Review and Real/Complex Numbers', 'Linear Systems and Matrices', 'Functions and Transformations', 'Quadratic Functions', 'Polynomial Functions', 'Rational Expressions', 'Radical and Rational Exponents', 'Exponential Functions', 'Logarithmic Functions', 'Sequences and Series', 'Trigonometry Foundations', 'The Unit Circle', 'Trigonometric Identities', 'Probability and Statistics', 'Modeling'];

  // ---------- lessons ----------
  const L = [];
  const add = (id, unit, title, idea, example, visual, tip, gen) => L.push({ id, unit, title, idea, example, visual, tip, gen });

  add('1.1', 1, 'Order of operations',
    'Do operations in a fixed order so everyone gets the same answer: parentheses, exponents, multiplication and division (left to right), then addition and subtraction (left to right).',
    ['Evaluate 3 + 4 \u00d7 5 \u2212 2', 'Multiply first: 4 \u00d7 5 = 20', 'Then go left to right: 3 + 20 \u2212 2 = 21'],
    'Think of a staircase: parentheses on the top step, then exponents, then \u00d7 \u00f7, then + \u2212 at the bottom. Always start at the top.',
    'Multiplication does not beat division. They share a step, so go left to right.',
    () => {
      const A = R(2, 12), B = R(2, 9), C = R(2, 9), D = R(1, 15), f = R(0, 4); let q, ans, why;
      if (f === 0) { ans = A + B * C - D; q = `${A} + ${B} \u00d7 ${C} \u2212 ${D}`; why = `Multiply first: ${B} \u00d7 ${C} = ${B * C}. Then ${A} + ${B * C} \u2212 ${D} = ${ans}.`; }
      else if (f === 1) { ans = (A + B) * C - D; q = `(${A} + ${B}) \u00d7 ${C} \u2212 ${D}`; why = `Parentheses first: ${A + B}. Then ${A + B} \u00d7 ${C} = ${(A + B) * C}, minus ${D} = ${ans}.`; }
      else if (f === 2) { ans = A * B - C * D; q = `${A} \u00d7 ${B} \u2212 ${C} \u00d7 ${D}`; why = `Do both products: ${A * B} and ${C * D}. Then ${A * B} \u2212 ${C * D} = ${ans}.`; }
      else if (f === 3) { ans = (A - B) * C + D; q = `(${A} \u2212 ${B}) \u00d7 ${C} + ${D}`; why = `Parentheses first: ${A - B}. Then ${A - B} \u00d7 ${C} = ${(A - B) * C}, plus ${D} = ${ans}.`; }
      else { ans = A + B * B - C; q = `${A} + ${B}${sup(2)} \u2212 ${C}`; why = `Exponent first: ${B}${sup(2)} = ${B * B}. Then ${A} + ${B * B} \u2212 ${C} = ${ans}.`; }
      return num('Evaluate: ' + q, ans, why);
    });

  add('1.2', 1, 'Evaluating expressions',
    'To evaluate an expression, replace each variable with its value and then use the order of operations. Put negative values in parentheses so you do not lose the sign.',
    ['Evaluate 2x + 3y \u2212 4 when x = 3 and y = \u22122', 'Substitute: 2(3) + 3(\u22122) \u2212 4', 'Compute: 6 \u2212 6 \u2212 4 = \u22124'],
    'A variable is a box holding a number. Open the box, put the number in, then calculate.',
    'Always write negative substitutions inside parentheses.',
    () => {
      const a = nz(2, 6), b = nz(-5, 5), c = R(1, 9), X = nz(-5, 5), Y = nz(-5, 5);
      const ans = a * X + b * Y - c;
      return num(`Evaluate ${join([[a, 'x'], [b, 'y']])} \u2212 ${c} when x = ${n2s(X)} and y = ${n2s(Y)}`, ans,
        `Substitute: ${a}(${n2s(X)}) + ${par(b)}(${n2s(Y)}) \u2212 ${c} = ${a * X} + ${par(b * Y)} \u2212 ${c} = ${ans}.`);
    });

  add('1.3', 1, 'Combining like terms',
    'Like terms have the same variable part. You can add their coefficients. Numbers combine with numbers, x terms with x terms.',
    ['Simplify 3x + 5 + 2x \u2212 1', 'x terms: 3x + 2x = 5x', 'Numbers: 5 \u2212 1 = 4', 'Answer: 5x + 4'],
    'Sort into two piles: a pile of x\u2019s and a pile of plain numbers. Add each pile separately.',
    'Carry the sign in front of each term with it when you sort.',
    () => {
      let a, b, c, d;
      do { a = nz(-6, 6); b = nz(-9, 9); c = nz(-6, 6); d = nz(-9, 9); } while (a + c === 0 || b + d === 0 || Math.abs(a + c) === 1 && false);
      const ans = lin(a + c, b + d);
      return mc('Simplify: ' + join([[a, 'x'], [b, ''], [c, 'x'], [d, '']]), ans,
        [lin(a + c, b - d), lin(a - c, b + d), lin(a + b + c + d, 0)],
        `Add the x terms: ${n2s(a)}x + ${par(c)}x = ${n2s(a + c)}x. Add the numbers: ${n2s(b)} + ${par(d)} = ${n2s(b + d)}. So the answer is ${ans}.`);
    });

  add('2.1', 2, 'One- and two-step equations',
    'Solve an equation by undoing operations in reverse order. Undo addition or subtraction first, then undo multiplication or division. Whatever you do to one side, do to the other.',
    ['Solve 3x + 5 = 20', 'Subtract 5 from both sides: 3x = 15', 'Divide both sides by 3: x = 5', 'Check: 3(5) + 5 = 20'],
    'An equation is a balanced scale. Keep it balanced by doing the same thing on both sides.',
    'Always check by putting your answer back into the original equation.',
    () => {
      const x = nz(-9, 9), a = nz(2, 8) * (R(0, 1) ? 1 : -1), b = nz(-12, 12), c = a * x + b;
      return num(`Solve for x: ${lin(a, b)} = ${n2s(c)}`, x,
        `Undo the ${b > 0 ? '+' : '\u2212'} ${Math.abs(b)}: ${n2s(a)}x = ${n2s(c - b)}. Divide both sides by ${n2s(a)}: x = ${n2s(x)}.`);
    });

  add('2.2', 2, 'Variables on both sides',
    'Move all the variable terms to one side and the plain numbers to the other, then solve like a two-step equation.',
    ['Solve 5x + 2 = 2x + 14', 'Subtract 2x: 3x + 2 = 14', 'Subtract 2: 3x = 12', 'Divide by 3: x = 4'],
    'Pull every x to the left side of the scale and every plain number to the right.',
    'Subtract the smaller x coefficient so you avoid negative coefficients.',
    () => {
      const x = nz(-8, 8), a = R(3, 9); let c = R(-4, a - 1); if (c === a) c = a - 1;
      const b = nz(-10, 10), d = (a - c) * x + b;
      return num(`Solve for x: ${lin(a, b)} = ${lin(c, d)}`, x,
        `Collect the x terms: ${lin(a - c, b)} = ${n2s(d)}. Then ${n2s(a - c)}x = ${n2s(d - b)}, so x = ${n2s(x)}.`);
    });

  add('2.3', 2, 'Equations with parentheses',
    'Use the distributive property to remove parentheses: a(x + b) = ax + ab. Then solve as usual.',
    ['Solve 3(x + 2) = 18', 'Distribute: 3x + 6 = 18', 'Subtract 6: 3x = 12', 'Divide by 3: x = 4'],
    'Picture the number outside the parentheses handing one copy to everything inside.',
    'Multiply the number outside by EVERY term inside, including the sign.',
    () => {
      const a = R(2, 7), b = nz(-8, 8), x = nz(-8, 8), c = a * (x + b);
      return num(`Solve for x: ${a}(x ${b < 0 ? '\u2212' : '+'} ${Math.abs(b)}) = ${n2s(c)}`, x,
        `Distribute: ${lin(a, a * b)} = ${n2s(c)}. Then ${a}x = ${n2s(c - a * b)}, so x = ${n2s(x)}.`);
    });

  const FLIP = { '<': '>', '>': '<', '\u2264': '\u2265', '\u2265': '\u2264' };
  add('3.1', 3, 'Solving inequalities',
    'Solve an inequality like an equation, with one big rule: when you multiply or divide both sides by a negative number, flip the inequality sign.',
    ['Solve \u22122x + 3 < 11', 'Subtract 3: \u22122x < 8', 'Divide by \u22122 and flip the sign: x > \u22124'],
    'On a number line, the sign points toward the solutions. Dividing by a negative mirrors the line, so the arrow turns around.',
    'Only flip when multiplying or dividing by a NEGATIVE.',
    () => {
      const a = nz(2, 6) * (R(0, 1) ? 1 : -1), b = nz(-10, 10), k = nz(-8, 8), c = a * k + b, op = pick(['<', '>', '\u2264', '\u2265']);
      const res = a < 0 ? FLIP[op] : op;
      return mc(`Solve: ${lin(a, b)} ${op} ${n2s(c)}`, `x ${res} ${n2s(k)}`,
        ['<', '>', '\u2264', '\u2265'].filter((o) => o !== res).map((o) => `x ${o} ${n2s(k)}`),
        `Subtract ${n2s(b)}: ${n2s(a)}x ${op} ${n2s(c - b)}. Divide by ${n2s(a)}${a < 0 ? ' (a negative, so the sign flips)' : ''}: x ${res} ${n2s(k)}.`);
    });

  add('3.2', 3, 'Absolute-value inequalities',
    '|x| is the distance from zero. |x| < n means x is within n of zero (one connected interval). |x| > n means x is farther than n from zero (two separate pieces).',
    ['|x| < 3 means \u22123 < x < 3', '|x| > 3 means x < \u22123 or x > 3'],
    'Stand at 0 on a number line. "Less than" keeps you close to home; "greater than" sends you out past both ends.',
    'Less than \u2192 "and" (between). Greater than \u2192 "or" (outside).',
    () => {
      const n = R(2, 9), lt = R(0, 1) === 1;
      return lt
        ? mc(`Which describes |x| < ${n}?`, `${-n} < x < ${n}`.replace('-', '\u2212'), [`x < \u2212${n} or x > ${n}`, `x < ${n}`, `x > \u2212${n}`], `Distance from 0 less than ${n} means x is between \u2212${n} and ${n}.`)
        : mc(`Which describes |x| > ${n}?`, `x < \u2212${n} or x > ${n}`, [`\u2212${n} < x < ${n}`, `x > ${n}`, `x < \u2212${n}`], `Distance from 0 greater than ${n} means x is below \u2212${n} or above ${n}.`);
    });

  add('4.1', 4, 'Function notation',
    'f(x) is read "f of x". It names a rule that turns an input x into an output. To find f(3), replace every x in the rule with 3.',
    ['If f(x) = 2x + 1, find f(3)', 'Replace x with 3: f(3) = 2(3) + 1', 'f(3) = 7'],
    'A function is a machine. Drop in an input, follow the rule, and out comes exactly one output.',
    'f(3) does not mean f times 3. It means "the output when the input is 3".',
    () => {
      const a = nz(-6, 6), b = nz(-9, 9), k = nz(-6, 6);
      return num(`If f(x) = ${lin(a, b)}, what is f(${n2s(k)})?`, a * k + b, `Replace x with ${n2s(k)}: ${n2s(a)}(${n2s(k)}) ${b < 0 ? '\u2212' : '+'} ${Math.abs(b)} = ${n2s(a * k + b)}.`);
    });

  add('4.2', 4, 'Evaluating quadratic functions',
    'Evaluate other rules the same way: substitute the input everywhere, square first, then finish the arithmetic.',
    ['If f(x) = x\u00b2 + 2x \u2212 3, find f(2)', 'f(2) = 2\u00b2 + 2(2) \u2212 3 = 4 + 4 \u2212 3 = 5'],
    'Same machine, different rule. The input still goes in every place x appears.',
    'Square the input before multiplying: (\u22123)\u00b2 = 9, not \u22129.',
    () => {
      const b = nz(-5, 5), c = nz(-8, 8), k = nz(-4, 4);
      return num(`If f(x) = ${poly([1, b, c])}, what is f(${n2s(k)})?`, k * k + b * k + c,
        `f(${n2s(k)}) = (${n2s(k)})${sup(2)} + ${par(b)}(${n2s(k)}) + ${par(c)} = ${k * k} + ${par(b * k)} + ${par(c)} = ${n2s(k * k + b * k + c)}.`);
    });

  add('4.3', 4, 'What makes a function?',
    'A relation is a function when every input x has exactly one output y. If one x value appears with two different y values, it is not a function.',
    ['{(1, 2), (2, 4), (3, 6)} is a function: each x appears once', '{(1, 2), (1, 5)} is not: x = 1 gives two outputs'],
    'Each x can only point to one y, like each person having exactly one birthday.',
    'Look for repeated x values. Repeated y values are fine.',
    () => {
      const xs = shuffle([-3, -2, -1, 0, 1, 2, 3, 4, 5]).slice(0, 4), isFn = R(0, 1) === 1;
      let pts = xs.map((x) => [x, R(-4, 6)]);
      if (!isFn) { const i = R(0, 2); let y2; do { y2 = R(-4, 6); } while (y2 === pts[i][1]); pts.push([pts[i][0], y2]); }
      pts = shuffle(pts);
      const dup = pts.map((p) => p[0]).find((x, i, a) => a.indexOf(x) !== i);
      return mc(`Is this relation a function? {${pairStr(pts)}}`, isFn ? 'Yes, it is a function' : 'No, it is not a function', [isFn ? 'No, it is not a function' : 'Yes, it is a function'],
        isFn ? 'Every x value appears only once, so each input has one output.' : `The input x = ${n2s(dup)} appears twice with different outputs, so it is not a function.`);
    });

  add('5.1', 5, 'Slope from two points',
    'Slope measures steepness: rise over run. Given two points, slope = (y\u2082 \u2212 y\u2081) \u00f7 (x\u2082 \u2212 x\u2081).',
    ['Find the slope through (1, 2) and (3, 8)', 'Rise: 8 \u2212 2 = 6. Run: 3 \u2212 1 = 2', 'Slope = 6 \u00f7 2 = 3'],
    'Walk from the left point to the right point: how far up (rise), how far across (run)?',
    'Subtract in the same order on top and bottom.',
    () => {
      const m = nz(-5, 5), x1 = R(-5, 3), dx = R(1, 4), y1 = R(-5, 5), x2 = x1 + dx, y2 = y1 + m * dx;
      return num(`Find the slope of the line through (${n2s(x1)}, ${n2s(y1)}) and (${n2s(x2)}, ${n2s(y2)})`, m,
        `Slope = (${n2s(y2)} \u2212 ${par(y1)}) \u00f7 (${n2s(x2)} \u2212 ${par(x1)}) = ${n2s(y2 - y1)} \u00f7 ${dx} = ${n2s(m)}.`);
    });

  add('5.2', 5, 'Slope-intercept form',
    'y = mx + b describes a line. m is the slope and b is the y-intercept, where the line crosses the y-axis (x = 0).',
    ['Line through (1, 5) and (2, 7)', 'Slope = (7 \u2212 5) \u00f7 (2 \u2212 1) = 2', 'Use y = 2x + b with (1, 5): 5 = 2 + b, so b = 3', 'Equation: y = 2x + 3'],
    'm tells you how to step from point to point; b tells you where you begin on the y-axis.',
    'Find the slope first, then plug in one point to get b.',
    () => {
      const m = nz(-4, 4), b = nz(-8, 8), x1 = R(1, 3), x2 = x1 + R(1, 3);
      return num(`A line passes through (${x1}, ${n2s(m * x1 + b)}) and (${x2}, ${n2s(m * x2 + b)}). What is its y-intercept?`, b,
        `Slope = ${n2s(m)}. Use y = ${n2s(m)}x + b with the first point: ${n2s(m * x1 + b)} = ${n2s(m * x1)} + b, so b = ${n2s(b)}.`);
    });

  add('5.3', 5, 'Intercepts from standard form',
    'In Ax + By = C, find the x-intercept by setting y = 0 and the y-intercept by setting x = 0.',
    ['Find the x-intercept of 2x + 3y = 12', 'Set y = 0: 2x = 12', 'x = 6'],
    'The x-intercept sits on the horizontal axis, so its height (y) is zero.',
    'For the x-intercept, cover up the y term and solve what is left.',
    () => {
      const a = R(2, 6), b = nz(-6, 6), k = nz(-6, 6), c = a * k;
      return num(`Find the x-intercept of ${join([[a, 'x'], [b, 'y']])} = ${n2s(c)}`, k, `Set y = 0: ${a}x = ${n2s(c)}, so x = ${n2s(k)}.`);
    });

  add('6.1', 6, 'Substitution method',
    'When one equation says y = something, substitute that expression for y in the other equation. You get one equation with one variable.',
    ['y = 2x + 1 and x + y = 7', 'Substitute: x + (2x + 1) = 7', '3x + 1 = 7, so x = 2'],
    'Swap the variable for what it equals, like replacing a nickname with the real name.',
    'Put the substituted expression in parentheses.',
    () => {
      let x, y, a, b, c, d, e;
      do { x = nz(-5, 5); y = nz(-8, 8); a = nz(-4, 4); b = y - a * x; c = R(1, 4); d = R(1, 3); e = c * x + d * y; } while (c + d * a === 0);
      return num(`Solve the system and give x:\ny = ${lin(a, b)}\n${join([[c, 'x'], [d, 'y']])} = ${n2s(e)}`, x,
        `Substitute: ${c}x + ${d}(${lin(a, b)}) = ${n2s(e)}. That simplifies to ${n2s(c + d * a)}x = ${n2s(e - d * b)}, so x = ${n2s(x)}.`);
    });

  add('6.2', 6, 'Elimination method',
    'If one equation has +By and the other has \u2212By, add the equations to eliminate y. Then solve for x.',
    ['2x + 3y = 13 and 4x \u2212 3y = 5', 'Add: 6x = 18', 'x = 3'],
    'Line the equations up like columns and add straight down: matching opposites cancel.',
    'If nothing cancels, multiply an equation first to create opposites.',
    () => {
      const b = R(1, 4), a1 = R(1, 5), a2 = R(1, 5), x = nz(-6, 6), y = nz(-6, 6), c1 = a1 * x + b * y, c2 = a2 * x - b * y;
      return num(`Solve the system and give x:\n${a1}x + ${b}y = ${n2s(c1)}\n${a2}x \u2212 ${b}y = ${n2s(c2)}`, x,
        `Add the equations: ${a1 + a2}x = ${n2s(c1 + c2)}, so x = ${n2s(x)}.`);
    });

  add('6.3', 6, 'Types of solutions',
    'Two lines can cross once (one solution), be parallel (no solution), or be the same line (infinitely many). Compare slopes and intercepts.',
    ['y = 2x + 1 and y = 2x \u2212 3: same slope, different intercepts \u2192 parallel \u2192 no solution'],
    'Different slopes cross. Same slope, different start: parallel. Same slope and same start: one line on top of the other.',
    'Look at the slope first. Only if slopes match do you need to compare intercepts.',
    () => {
      const m = nz(-4, 4), b = nz(-6, 6), kind = pick(['one', 'none', 'inf']); let m2 = m, b2 = b;
      if (kind === 'one') { do { m2 = nz(-4, 4); } while (m2 === m); b2 = nz(-6, 6); }
      if (kind === 'none') { do { b2 = nz(-6, 6); } while (b2 === b); }
      const ans = { one: 'One solution', none: 'No solution', inf: 'Infinitely many solutions' }[kind];
      return mc(`How many solutions does this system have?\ny = ${lin(m, b)}\ny = ${lin(m2, b2)}`, ans, Object.values({ one: 'One solution', none: 'No solution', inf: 'Infinitely many solutions' }).filter((o) => o !== ans),
        kind === 'one' ? 'The slopes are different, so the lines cross exactly once.' : kind === 'none' ? 'Same slope but different y-intercepts: parallel lines never meet.' : 'Same slope and same y-intercept: it is the same line.');
    });

  add('7.1', 7, 'Product, quotient and power rules',
    'Same base: multiply \u2192 add exponents. Divide \u2192 subtract exponents. Power of a power \u2192 multiply exponents.',
    ['x\u00b3 \u00b7 x\u2074 = x\u2077', 'x\u2079 \u00f7 x\u00b3 = x\u2076', '(x\u00b2)\u00b3 = x\u2076'],
    'x\u00b3 means x\u00b7x\u00b7x. Multiplying x\u00b3 by x\u2074 just lines up seven x\u2019s.',
    'Add for multiply, subtract for divide, multiply for a power of a power.',
    () => {
      const f = R(0, 2); let q, ans, why;
      if (f === 0) { const a = R(2, 9), b = R(2, 9); q = `x${sup(a)} \u00b7 x${sup(b)}`; ans = a + b; why = `Same base, multiply: add the exponents. ${a} + ${b} = ${ans}.`; }
      else if (f === 1) { const a = R(2, 5), b = R(2, 5); q = `(x${sup(a)})${sup(b)}`; ans = a * b; why = `Power of a power: multiply the exponents. ${a} \u00d7 ${b} = ${ans}.`; }
      else { const b = R(2, 5), a = b + R(1, 4); q = `x${sup(a)} \u00f7 x${sup(b)}`; ans = a - b; why = `Same base, divide: subtract the exponents. ${a} \u2212 ${b} = ${ans}.`; }
      return num(`Simplify ${q}. The result is x to what power? (Type the exponent.)`, ans, why);
    });

  add('7.2', 7, 'Zero and negative exponents',
    'Anything (not zero) to the power 0 is 1. A negative exponent means flip to the reciprocal: b\u207b\u207f = 1 \u00f7 b\u207f.',
    ['5\u2070 = 1', '2\u207b\u00b3 = 1 \u00f7 2\u00b3 = 1/8'],
    'A negative exponent sends the base downstairs into the denominator. It does not make the answer negative.',
    'Negative exponent \u2260 negative number.',
    () => {
      const b = pick([2, 3, 4, 5, 10]);
      if (R(0, 3) === 0) return mc(`Evaluate ${b}\u2070`, '1', ['0', '' + b, '\u22121'], 'Any non-zero number to the power 0 equals 1.');
      const n = R(1, 3);
      return mc(`Evaluate ${b}${sup(-n)}`, `1/${b ** n}`, [`\u2212${b ** n}`, `1/${b * n}`, `${b ** n}`], `${b}${sup(-n)} = 1 \u00f7 ${b}${sup(n)} = 1/${b ** n}.`);
    });

  add('7.3', 7, 'Scientific notation',
    'Write a number as a \u00d7 10\u207f where 1 \u2264 a < 10. Big numbers have a positive n; tiny decimals have a negative n. n counts how many places the decimal moves.',
    ['4,500,000 = 4.5 \u00d7 10\u2076', '0.0003 = 3 \u00d7 10\u207b\u2074'],
    'Slide the decimal point until one non-zero digit is in front of it. Count the slides.',
    'Moving the decimal left gives a positive exponent; right gives a negative one.',
    () => {
      if (R(0, 1)) { const k = R(3, 8), N = R(12, 99) * 10 ** (k - 1); return num(`Write ${N.toLocaleString('en-US')} as a \u00d7 10\u207f. What is n?`, k, `Move the decimal point ${k} places left to get ${(N / 10 ** k).toString()}, so n = ${k}.`); }
      const j = R(3, 7), d = R(2, 9); return num(`Write ${(d / 10 ** j).toFixed(j)} as a \u00d7 10\u207f. What is n?`, -j, `Move the decimal point ${j} places right to get ${d}, so n = \u2212${j}.`);
    });

  add('8.1', 8, 'Degree of a polynomial',
    'A polynomial is a sum of terms with whole-number exponents. Its degree is the highest exponent on the variable.',
    ['5x\u00b3 \u2212 2x + 7x\u2075 \u2212 1 has degree 5'],
    'Scan every term and find the tallest exponent. That is the degree, no matter where the term sits.',
    'The terms may be out of order. Check all of them.',
    () => {
      const exps = shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, R(3, 4)); const terms = exps.map((e) => [nz(-9, 9), e]);
      return num(`What is the degree of ${px(terms)}?`, Math.max(...exps), `The highest exponent is ${Math.max(...exps)}.`);
    });

  add('8.2', 8, 'Adding polynomials',
    'Add polynomials by combining like terms: x\u00b2 with x\u00b2, x with x, and numbers with numbers.',
    ['(2x\u00b2 + 3x + 1) + (x\u00b2 \u2212 5x + 4)', '= 3x\u00b2 \u2212 2x + 5'],
    'Stack the two polynomials in columns by power and add each column.',
    'Keep each power in its own column so nothing gets mixed up.',
    () => {
      let A, B, S;
      do { A = [nz(-5, 5), nz(-5, 5), nz(-8, 8)]; B = [nz(-5, 5), nz(-5, 5), nz(-8, 8)]; S = [A[0] + B[0], A[1] + B[1], A[2] + B[2]]; } while (S[0] === 0 || S[1] === 0 || S[2] === 0);
      return mc(`Add: (${poly(A)}) + (${poly(B)})`, poly(S), [poly([S[0], A[1] - B[1], S[2]]), poly([S[0], S[1], A[2] - B[2]]), poly([A[0] - B[0], S[1], S[2]])],
        `Add each column: x\u00b2: ${n2s(S[0])}, x: ${n2s(S[1])}, numbers: ${n2s(S[2])}.`);
    });

  add('8.3', 8, 'Multiplying binomials (FOIL)',
    'Multiply (x + p)(x + q) with FOIL: First, Outer, Inner, Last. The result is x\u00b2 + (p + q)x + pq.',
    ['(x + 2)(x + 3)', 'First: x\u00b2. Outer + Inner: 3x + 2x = 5x. Last: 6', '= x\u00b2 + 5x + 6'],
    'Draw a 2\u00d72 box. Each corner is one product; add the matching middle pieces.',
    'The middle coefficient is the SUM of the numbers; the last term is their PRODUCT.',
    () => {
      let p, q; do { p = nz(-7, 7); q = nz(-7, 7); } while (p + q === 0 || p * q === p + q);
      return mc(`Multiply: (x ${p < 0 ? '\u2212' : '+'} ${Math.abs(p)})(x ${q < 0 ? '\u2212' : '+'} ${Math.abs(q)})`, poly([1, p + q, p * q]),
        [poly([1, p * q, p + q]), poly([1, p + q, -p * q]), poly([1, p - q, p * q])], `Sum = ${n2s(p + q)}, product = ${n2s(p * q)}, so ${poly([1, p + q, p * q])}.`);
    });

  add('9.1', 9, 'Greatest common factor',
    'The GCF is the largest number that divides every term. Factoring it out is always the first step in factoring.',
    ['GCF of 12 and 18: factors of 12 are 1, 2, 3, 4, 6, 12; of 18 are 1, 2, 3, 6, 9, 18', 'The largest shared factor is 6'],
    'List the factors of each number and circle the biggest one they share.',
    'Always look for a GCF before anything else.',
    () => {
      const g = R(2, 9), [m, n] = pick([[2, 3], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 7], [2, 7]]);
      return num(`What is the greatest common factor of ${g * m} and ${g * n}?`, g, `Both numbers are multiples of ${g} (${g * m} = ${g} \u00d7 ${m} and ${g * n} = ${g} \u00d7 ${n}), and ${m} and ${n} share nothing else.`);
    });

  add('9.2', 9, 'Factoring trinomials',
    'To factor x\u00b2 + bx + c, find two numbers that multiply to c and add to b. Then write (x + p)(x + q).',
    ['Factor x\u00b2 + 7x + 12', 'Numbers that multiply to 12 and add to 7: 3 and 4', '= (x + 3)(x + 4)'],
    'It is FOIL in reverse: the last number is the product, the middle number is the sum.',
    'Check by multiplying your factors back together.',
    () => {
      let p, q; do { p = nz(-8, 8); q = nz(-8, 8); } while (p === q || p + q === 0);
      const f = (a, b) => { const [s, t] = [a, b].sort((u, v) => u - v); return `(x ${s < 0 ? '\u2212' : '+'} ${Math.abs(s)})(x ${t < 0 ? '\u2212' : '+'} ${Math.abs(t)})`; };
      return mc(`Factor: ${poly([1, p + q, p * q])}`, f(p, q), [f(-p, -q), f(p, -q), f(-p, q)], `We need two numbers with product ${n2s(p * q)} and sum ${n2s(p + q)}: ${n2s(p)} and ${n2s(q)}.`);
    });

  add('9.3', 9, 'Difference of squares',
    'A\u00b2 \u2212 B\u00b2 factors as (A \u2212 B)(A + B). It only works with a subtraction between two perfect squares.',
    ['x\u00b2 \u2212 25 = (x \u2212 5)(x + 5)'],
    'Imagine cutting a small square out of a big one and rearranging the leftover pieces into a rectangle.',
    'x\u00b2 + 25 does NOT factor this way. It must be a difference.',
    () => {
      const n = R(2, 12);
      return mc(`Factor: x${sup(2)} \u2212 ${n * n}`, `(x \u2212 ${n})(x + ${n})`, [`(x \u2212 ${n})(x \u2212 ${n})`, `(x + ${n})(x + ${n})`, `(x \u2212 ${n * n})(x + 1)`], `${n * n} is ${n}${sup(2)}, so x${sup(2)} \u2212 ${n * n} = (x \u2212 ${n})(x + ${n}).`);
    });

  add('10.1', 10, 'Solving by factoring',
    'Set the quadratic equal to 0, factor it, then use the zero-product rule: if A \u00b7 B = 0, then A = 0 or B = 0.',
    ['x\u00b2 \u2212 5x + 6 = 0', '(x \u2212 2)(x \u2212 3) = 0', 'x = 2 or x = 3'],
    'The product is zero, so at least one factor has to be zero. Solve each factor on its own.',
    'Flip the sign inside each factor to get the solution.',
    () => {
      let p, q; do { p = R(-7, 7); q = R(-7, 7); } while (p === q);
      return num(`Solve ${poly([1, -(p + q), p * q])} = 0. What is the LARGER solution?`, Math.max(p, q), `Factor: ${fac(p)}${fac(q)} = 0, so x = ${n2s(p)} or x = ${n2s(q)}. The larger is ${n2s(Math.max(p, q))}.`);
    });

  add('10.2', 10, 'Solving with square roots',
    'If x\u00b2 equals a number, take the square root of both sides. Remember there is a positive and a negative solution.',
    ['x\u00b2 \u2212 4 = 12', 'x\u00b2 = 16', 'x = 4 or x = \u22124'],
    'Squaring loses the sign, so undoing it brings back both signs (\u00b1).',
    'Isolate x\u00b2 first, then take the root.',
    () => {
      const s = R(2, 9), a = R(1, s * s - 1), b = s * s - a;
      return num(`Solve x${sup(2)} \u2212 ${a} = ${b}. What is the POSITIVE solution?`, s, `Add ${a}: x${sup(2)} = ${s * s}. The square root of ${s * s} is ${s} (or \u2212${s}). The positive solution is ${s}.`);
    });

  add('10.3', 10, 'Vertex and discriminant',
    'The vertex of y = ax\u00b2 + bx + c has x-coordinate \u2212b \u00f7 (2a). The discriminant b\u00b2 \u2212 4ac tells how many real solutions there are: positive = 2, zero = 1, negative = none.',
    ['y = x\u00b2 \u2212 6x + 5: vertex x = \u2212(\u22126) \u00f7 2 = 3', 'Discriminant: 36 \u2212 20 = 16 (two real solutions)'],
    'The vertex is the tip of the U-shape, exactly halfway between the two x-intercepts.',
    'Watch the sign: it is NEGATIVE b over 2a.',
    () => {
      if (R(0, 1)) { const a = pick([1, 2, -1, -2]), h = nz(-5, 5), b = -2 * a * h, c = nz(-6, 6); return num(`Find the x-coordinate of the vertex of y = ${poly([a, b, c])}`, h, `x = \u2212b \u00f7 (2a) = \u2212(${n2s(b)}) \u00f7 ${n2s(2 * a)} = ${n2s(h)}.`); }
      const a = nz(1, 3), b = nz(-6, 6), c = nz(-4, 4); return num(`Find the discriminant (b\u00b2 \u2212 4ac) of ${poly([a, b, c])} = 0`, b * b - 4 * a * c, `b\u00b2 \u2212 4ac = (${n2s(b)})\u00b2 \u2212 4(${a})(${n2s(c)}) = ${b * b} \u2212 ${n2s(4 * a * c)} = ${n2s(b * b - 4 * a * c)}.`);
    });

  add('11.1', 11, 'Square roots',
    'The square root of n is the number that, multiplied by itself, gives n. Perfect squares like 1, 4, 9, 16, 25 have whole-number roots.',
    ['\u221a49 = 7 because 7 \u00d7 7 = 49'],
    'A square with area 49 has side length \u221a49 = 7.',
    'Memorize the squares up to 15\u00b2 = 225.',
    () => { const s = R(2, 15); return num(`Evaluate \u221a${s * s}`, s, `${s} \u00d7 ${s} = ${s * s}, so \u221a${s * s} = ${s}.`); });

  add('11.2', 11, 'Simplifying radicals',
    'Pull perfect-square factors out of the radical: \u221a(k\u00b2 \u00b7 m) = k\u221am.',
    ['\u221a72 = \u221a(36 \u00b7 2) = 6\u221a2'],
    'Split the radicand into a perfect square times a leftover; the perfect square escapes the radical.',
    'Look for the largest perfect square that divides evenly.',
    () => {
      const m = pick([2, 3, 5, 6, 7]), k = R(2, 6);
      return mc(`Simplify \u221a${k * k * m}`, `${k}\u221a${m}`, [`${m}\u221a${k}`, `${k * k}\u221a${m}`, `${k + m}\u221a${k * m}`], `${k * k * m} = ${k * k} \u00d7 ${m}, so \u221a${k * k * m} = ${k}\u221a${m}.`);
    });

  add('11.3', 11, 'The Pythagorean theorem',
    'In a right triangle with legs a and b and hypotenuse c: a\u00b2 + b\u00b2 = c\u00b2. The hypotenuse is the side opposite the right angle.',
    ['Legs 3 and 4: 9 + 16 = 25, so c = 5'],
    'Build a square on each side of the triangle: the two small squares together have the same area as the big one.',
    'The hypotenuse is always the longest side.',
    () => {
      const [a, b, c] = pick([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10]]), s = R(1, 3);
      return R(0, 1) ? num(`A right triangle has legs ${a * s} and ${b * s}. How long is the hypotenuse?`, c * s, `${a * s}\u00b2 + ${b * s}\u00b2 = ${(a * s) ** 2 + (b * s) ** 2}, and \u221a${(c * s) ** 2} = ${c * s}.`)
        : num(`A right triangle has hypotenuse ${c * s} and one leg ${a * s}. How long is the other leg?`, b * s, `${c * s}\u00b2 \u2212 ${a * s}\u00b2 = ${(c * s) ** 2 - (a * s) ** 2}, and \u221a${(b * s) ** 2} = ${b * s}.`);
    });

  add('12.1', 12, 'Mean',
    'The mean (average) is the sum of the values divided by how many values there are.',
    ['Mean of 4, 8, 6, 10, 2: sum = 30, count = 5, mean = 6'],
    'Imagine leveling off the stacks so that every stack is the same height. That height is the mean.',
    'Add first, then divide by the count.',
    () => {
      const n = 5, v = Array.from({ length: n }, () => R(3, 20)), s = v.reduce((a, b) => a + b, 0); v[n - 1] += (n - (s % n)) % n; const tot = v.reduce((a, b) => a + b, 0);
      return num(`Find the mean of: ${v.join(', ')}`, tot / n, `Sum = ${tot}. Divide by ${n}: ${tot} \u00f7 ${n} = ${tot / n}.`);
    });

  add('12.2', 12, 'Median',
    'Put the numbers in order. The median is the middle value.',
    ['Median of 9, 3, 7, 1, 5: ordered 1, 3, 5, 7, 9 \u2192 median 5'],
    'Line everyone up by height and pick the person standing in the exact middle.',
    'Sort the numbers before you pick the middle.',
    () => {
      const n = pick([5, 7]), v = shuffle(Array.from({ length: 25 }, (_, i) => i + 1)).slice(0, n), s = v.slice().sort((a, b) => a - b);
      return num(`Find the median of: ${v.join(', ')}`, s[(n - 1) / 2], `Ordered: ${s.join(', ')}. The middle value is ${s[(n - 1) / 2]}.`);
    });

  add('12.3', 12, 'Predicting with a line of best fit',
    'A line of best fit models a trend. To predict, substitute your x value into the equation and compute y.',
    ['y = 3x + 50, predict for x = 4: y = 3(4) + 50 = 62'],
    'The line is a trend arrow through the dots. Slide along it to the x you care about and read y.',
    'Predictions are estimates, not guarantees.',
    () => {
      const m = R(2, 8), b = R(40, 65), k = R(1, 5);
      return num(`A line of best fit for test scores is y = ${m}x + ${b}, where x is hours studied. Predict the score for ${k} hours.`, m * k + b, `y = ${m}(${k}) + ${b} = ${m * k + b}.`);
    });

  AP.LESSONS = L;
  AP.lessonById = (id) => L.find((l) => l.id === id);
  AP.lessonsInUnit = (u) => L.filter((l) => l.unit === u);
  AP.unitById = (id) => AP.UNITS.find((u) => u.id === id);
  AP.util = { R, pick, shuffle, n2s };

  // ---------- answer checking ----------
  AP.check = function (p, input) {
    if (p.type === 'mc') return String(input) === p.answer;
    let s = String(input).trim().replace(/\u2212/g, '-').replace(/^[a-z]\s*=\s*/i, '').replace(/,/g, '');
    if (s === '') return false;
    if (/^-?\d+\s*\/\s*\d+$/.test(s)) { const [a, b] = s.split('/').map(Number); return b !== 0 && Math.abs(a / b - p.answer) < 1e-6; }
    const v = Number(s);
    return Number.isFinite(v) && Math.abs(v - p.answer) < 1e-6;
  };

  // ---------- placement + learning-preference surveys ----------
  AP.PLACEMENT = ['1.1', '2.1', '2.2', '3.1', '5.1', '6.2', '9.2', '10.1'];

  AP.STYLE_QS = [
    { q: 'You have to learn a new game. What do you do first?', o: [['visual', 'Look at a picture or watch someone play'], ['verbal', 'Read the instructions or have someone explain it'], ['hands', 'Just start playing and figure it out'], ['logic', 'Ask for the rules and how scoring works']] },
    { q: 'When a math problem is hard, what helps most?', o: [['visual', 'A drawing, graph or color-coded steps'], ['verbal', 'Hearing or reading an explanation in plain words'], ['hands', 'Trying a similar problem myself'], ['logic', 'A numbered list of steps to follow']] },
    { q: 'You remember things best when you...', o: [['visual', 'See them in a diagram or picture'], ['verbal', 'Say them out loud or write them down'], ['hands', 'Do them with your hands'], ['logic', 'Understand why they work']] },
    { q: 'Your ideal lesson looks like...', o: [['visual', 'Lots of visuals and examples'], ['verbal', 'A short story or clear explanation'], ['hands', 'A quick intro, then lots of practice'], ['logic', 'Clear rules, then proofs and patterns']] },
    { q: 'When you get an answer wrong, you want...', o: [['visual', 'To see the mistake highlighted in the work'], ['verbal', 'A sentence explaining what went wrong'], ['hands', 'A chance to try again right away'], ['logic', 'The exact rule that was broken']] },
    { q: 'How do you like to study for a test?', o: [['visual', 'Color-coded notes and flashcards'], ['verbal', 'Explaining the topic to someone'], ['hands', 'Working lots of practice problems'], ['logic', 'Making a checklist of rules and formulas']] },
  ];

  AP.STYLE_INFO = {
    visual: { name: 'Visual learner', emoji: '\ud83d\udc40', how: 'Lessons lead with pictures, number lines and color-coded steps.' },
    verbal: { name: 'Word-first learner', emoji: '\ud83d\udcac', how: 'Lessons lead with plain-language explanations and stories.' },
    hands: { name: 'Hands-on learner', emoji: '\u270b', how: 'Lessons start with a try-it problem, then explain.' },
    logic: { name: 'Step-by-step learner', emoji: '\ud83e\uddee', how: 'Lessons lead with rules and numbered procedures.' },
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = AP;
})(typeof window !== 'undefined' ? window : globalThis);
