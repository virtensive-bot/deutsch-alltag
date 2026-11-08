const ONES = ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf', 'dreizehn', 'vierzehn', 'fünfzehn', 'sechzehn', 'siebzehn', 'achtzehn', 'neunzehn'];
const TENS = ['', '', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig', 'sechzig', 'siebzig', 'achtzig', 'neunzig'];

/** German number words, 0..999999. `standalone` = "eins" vs "ein" (as in "einhundert", "eine Uhr"). */
export function germanNumber(n: number, standalone = true): string {
  if (n < 0) return 'minus ' + germanNumber(-n);
  if (n < 20) return n === 1 && !standalone ? 'ein' : ONES[n];
  if (n < 100) {
    const t = Math.floor(n / 10);
    const o = n % 10;
    return o === 0 ? TENS[t] : `${o === 1 ? 'ein' : ONES[o]}und${TENS[t]}`;
  }
  if (n < 1000) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    return `${h === 1 ? 'ein' : ONES[h]}hundert${r ? germanNumber(r) : ''}`;
  }
  const th = Math.floor(n / 1000);
  const r = n % 1000;
  return `${th === 1 ? 'ein' : germanNumber(th, false)}tausend${r ? germanNumber(r) : ''}`;
}

export function germanYear(y: number): string {
  if (y >= 1100 && y < 2000) {
    return `${germanNumber(Math.floor(y / 100))}hundert${y % 100 ? germanNumber(y % 100) : ''}`;
  }
  return germanNumber(y);
}

const ORD_IRREG: Record<number, string> = { 1: 'ersten', 3: 'dritten', 7: 'siebten', 8: 'achten' };
export function germanOrdinalDative(n: number): string {
  if (ORD_IRREG[n]) return ORD_IRREG[n];
  if (n < 20) return `${germanNumber(n)}ten`;
  return `${germanNumber(n)}sten`;
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

const rand = (a: number, b: number) => a + Math.floor(Math.random() * (b - a + 1));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export interface NumberItem {
  /** What gets spoken */
  speech: string;
  /** The canonical answer to type */
  answer: string;
  /** Accept these too (normalised) */
  accept: string[];
  /** Shown after answering */
  explain: string;
  /** Placeholder for the input */
  placeholder: string;
}

export interface DrillMode {
  id: string;
  title: string;
  desc: string;
  make: () => NumberItem;
}

const pad = (n: number) => String(n).padStart(2, '0');

function priceItem(): NumberItem {
  const euros = pick([rand(1, 9), rand(10, 99), rand(10, 99), rand(100, 999)]);
  const cents = pick([rand(0, 99), rand(10, 99), 50, 90, 95, 99]);
  const style = Math.random();
  const e = germanNumber(euros, true);
  let speech: string;
  if (cents === 0) speech = `${e} Euro`;
  else if (style < 0.45) speech = `${e} ${germanNumber(cents)}`; // cashier style: "dreiundzwanzig neunzig"
  else if (style < 0.8) speech = `${e} Euro ${germanNumber(cents)}`;
  else speech = `Das macht dann ${e} Euro ${germanNumber(cents)}, bitte.`;
  const answer = `${euros},${pad(cents)}`;
  return {
    speech,
    answer,
    accept: [answer, `${euros}.${pad(cents)}`, cents === 0 ? String(euros) : ''].filter(Boolean),
    explain: `${speech} → €${answer}. Note: cashiers often drop "Euro" and "Cent" entirely.`,
    placeholder: 'e.g. 23,90',
  };
}

function clock24Item(): NumberItem {
  const h = rand(0, 23);
  const m = pick([rand(0, 59), rand(0, 59), 0, 15, 30, 45]);
  const hw = h === 1 ? 'ein' : germanNumber(h);
  const train = Math.random() < 0.5;
  const core = m === 0 ? `${hw} Uhr` : `${hw} Uhr ${germanNumber(m)}`;
  const speech = train
    ? pick([`Der Zug um ${core} fällt heute leider aus.`, `Abfahrt ${core} von Gleis ${rand(1, 14)}.`, `Ankunft voraussichtlich ${core}.`])
    : core;
  const answer = `${pad(h)}:${pad(m)}`;
  return {
    speech,
    answer,
    accept: [answer, `${h}:${pad(m)}`, `${h}.${pad(m)}`, `${pad(h)}.${pad(m)}`],
    explain: `${core} = ${answer}. Official times (trains, TV, opening hours) use the 24-hour clock.`,
    placeholder: 'HH:MM',
  };
}

function clockColloqItem(): NumberItem {
  const h = rand(1, 12);
  const next = (h % 12) + 1;
  const hw = (x: number) => (x === 1 ? 'eins' : germanNumber(x));
  const kinds = [
    { m: 0, s: `${hw(h)}`, e: 'Just the hour.' },
    { m: 15, s: `Viertel nach ${hw(h)}`, e: '"Viertel nach X" = quarter past X.' },
    { m: 30, s: `halb ${hw(next)}`, e: `"halb ${hw(next)}" means half TO ${next} — i.e. ${h}:30! The classic trap.` },
    { m: 45, s: `Viertel vor ${hw(next)}`, e: '"Viertel vor X" = quarter to X.' },
    { m: 5, s: `fünf nach ${hw(h)}`, e: '"fünf nach" = five past.' },
    { m: 10, s: `zehn nach ${hw(h)}`, e: '"zehn nach" = ten past.' },
    { m: 20, s: `zwanzig nach ${hw(h)}`, e: 'Also heard: "zehn vor halb" (ten before half).' },
    { m: 25, s: `fünf vor halb ${hw(next)}`, e: `"fünf vor halb ${hw(next)}" = five before half-${next} = ${h}:25.` },
    { m: 35, s: `fünf nach halb ${hw(next)}`, e: `"fünf nach halb ${hw(next)}" = five after half-${next} = ${h}:35.` },
    { m: 50, s: `zehn vor ${hw(next)}`, e: '"zehn vor" = ten to.' },
  ];
  const k = pick(kinds);
  const wrap = pick(['Treffen wir uns um ', 'Komm doch so um ', 'Der Film fängt um ', '']);
  const tail = wrap.startsWith('Der Film') ? ' an.' : wrap.startsWith('Treffen') ? '?' : wrap ? '.' : '';
  const speech = wrap ? `${wrap}${k.s}${tail}` : k.s;
  const answer = `${h}:${pad(k.m)}`;
  return {
    speech,
    answer,
    accept: [answer, `${pad(h)}:${pad(k.m)}`, `${h + 12}:${pad(k.m)}`, `${h}.${pad(k.m)}`],
    explain: `${k.s} → ${answer}. ${k.e}`,
    placeholder: 'H:MM (12h)',
  };
}

function dateItem(): NumberItem {
  const d = rand(1, 28);
  const mo = rand(1, 12);
  const speech = pick([`am ${germanOrdinalDative(d)} ${MONTHS[mo - 1]}`, `am ${germanOrdinalDative(d)} ${germanOrdinalDative(mo)}`]);
  const answer = `${d}.${mo}.`;
  return {
    speech,
    answer,
    accept: [answer, `${d}.${mo}`, `${pad(d)}.${pad(mo)}.`, `${pad(d)}.${pad(mo)}`],
    explain: `${speech} → ${answer} Germans often say the month as an ordinal too: "am dritten fünften" = 3 May.`,
    placeholder: 'D.M.',
  };
}

function bigItem(): NumberItem {
  const n = pick([rand(21, 99), rand(100, 999), rand(1000, 9999), rand(1900, 2030)]);
  const isYear = n >= 1900 && n <= 2030 && Math.random() < 0.6;
  const speech = isYear ? `im Jahr ${germanYear(n)}` : germanNumber(n);
  return {
    speech,
    answer: String(n),
    accept: [String(n)],
    explain: `${speech} → ${n}.${n % 100 > 20 && n % 10 ? ' Remember: units before tens ("vierundsiebzig" = 4-and-70).' : ''}`,
    placeholder: 'number',
  };
}

function phoneItem(): NumberItem {
  // Germans often read phone numbers in pairs
  const digits = Array.from({ length: 8 }, () => rand(0, 9));
  const pairs: string[] = [];
  for (let i = 0; i < digits.length; i += 2) {
    const v = digits[i] * 10 + digits[i + 1];
    pairs.push(digits[i] === 0 ? `null ${germanNumber(digits[i + 1])}` : germanNumber(v));
  }
  const speech = `Meine Nummer ist ${pairs.join(', ')}.`;
  const answer = digits.join('');
  return {
    speech,
    answer,
    accept: [answer],
    explain: `${pairs.join(' · ')} → ${answer}. Numbers are often read in pairs; "zwo" is sometimes used for "zwei" to avoid confusion with "drei".`,
    placeholder: '8 digits',
  };
}

export const DRILL_MODES: DrillMode[] = [
  { id: 'prices', title: 'Prices', desc: 'At the till: "dreiundzwanzig neunzig"', make: priceItem },
  { id: 'clock24', title: 'Train & official times', desc: 'Announcements, 24-hour clock', make: clock24Item },
  { id: 'clockColloq', title: 'Everyday times', desc: '"halb vier", "Viertel vor", "fünf nach halb"', make: clockColloqItem },
  { id: 'dates', title: 'Dates', desc: '"am dritten Mai", "am zwölften achten"', make: dateItem },
  { id: 'big', title: 'Big numbers & years', desc: 'Units-before-tens at speed', make: bigItem },
  { id: 'phone', title: 'Phone numbers', desc: 'Read in pairs, fast', make: phoneItem },
];

export function normaliseAnswer(s: string) {
  return s.trim().toLowerCase().replace(/€|eur|uhr/g, '').replace(/\s+/g, '').replace(/^0(?=\d:)/, '');
}

export function checkNumber(item: NumberItem, input: string) {
  const n = normaliseAnswer(input);
  return item.accept.some((a) => normaliseAnswer(a) === n);
}
