import type { Phrase, Scenario } from '../types';

export interface SmalltalkTopic {
  id: string;
  emoji: string;
  title: string;
  /** Interview prompt shown to the learner (they answer in any language) */
  ask: string;
  askEt: string;
  /** How Germans actually ask this — from textbook to colloquial */
  questions: Phrase[];
  /** Typical reactions/comments you'll get on this topic */
  reactions?: Phrase[];
}

export const SMALLTALK_TOPICS: SmalltalkTopic[] = [
  {
    id: 'origin',
    emoji: '🇪🇪',
    title: 'Where you’re from',
    ask: 'Where are you from? City, what it’s like, anything people find surprising.',
    askEt: 'Kust sa pärit oled? Linn, milline see on, mis inimesi üllatab.',
    questions: [
      { de: 'Woher kommst du?', en: 'Where are you from?' },
      { de: 'Wo kommst du eigentlich her?', en: 'Where are you actually from?', note: '"eigentlich" softens the question — very common.' },
      { de: 'Du bist nicht von hier, oder?', en: 'You’re not from here, are you?' },
      { de: 'Woher aus Estland genau?', en: 'Where in Estonia exactly?' },
    ],
    reactions: [
      { de: 'Ach, Estland! Da wollte ich schon immer mal hin.', en: 'Oh, Estonia! I’ve always wanted to go there.' },
      { de: 'Das ist doch neben Finnland, oder?', en: 'That’s next to Finland, isn’t it?' },
    ],
  },
  {
    id: 'visit',
    emoji: '✈️',
    title: 'Why you’re here & how often',
    ask: 'Why are you in Germany, how often do you visit, how long do you stay, how do you travel?',
    askEt: 'Miks sa Saksamaal oled, kui tihti käid, kui kauaks jääd, kuidas reisid?',
    questions: [
      { de: 'Was machst du hier in Deutschland?', en: 'What are you doing here in Germany?' },
      { de: 'Wie oft bist du so hier?', en: 'How often are you here, roughly?', note: '"so" = roughly/usually, filler in questions.' },
      { de: 'Wie lange bleibst du diesmal?', en: 'How long are you staying this time?' },
      { de: 'Wann geht’s wieder zurück?', en: 'When are you heading back?' },
      { de: 'Bist du geflogen?', en: 'Did you fly?' },
    ],
  },
  {
    id: 'met',
    emoji: '💑',
    title: 'How you two met',
    ask: 'How did you and your girlfriend meet? When? Tell it like a short story.',
    askEt: 'Kuidas sa oma tüdruksõbraga tuttavaks said? Millal? Räägi nagu lühike lugu.',
    questions: [
      { de: 'Wie habt ihr euch kennengelernt?', en: 'How did you two meet?' },
      { de: 'Wie lange seid ihr schon zusammen?', en: 'How long have you been together?' },
      { de: 'Und woher kennt ihr euch?', en: 'And how do you know each other?' },
    ],
    reactions: [{ de: 'Oh, wie süß!', en: 'Oh, how sweet!' }],
  },
  {
    id: 'longdistance',
    emoji: '🗺️',
    title: 'Long distance',
    ask: 'What is it like having a relationship across countries? Hard parts, how you manage.',
    askEt: 'Milline on suhe üle riigipiiri? Rasked kohad, kuidas hakkama saate.',
    questions: [
      { de: 'Ist das nicht anstrengend, so eine Fernbeziehung?', en: 'Isn’t that exhausting, a long-distance relationship?' },
      { de: 'Wie kriegt ihr das hin?', en: 'How do you manage that?', note: '"hinkriegen" = to manage (colloquial).' },
      { de: 'Sprecht ihr zwei eigentlich Estnisch miteinander?', en: 'Do you two actually speak Estonian with each other?' },
    ],
  },
  {
    id: 'future',
    emoji: '🔮',
    title: 'Moving to Germany?',
    ask: 'Will you move to Germany, or she to Estonia? What are your plans? (Everyone asks this!)',
    askEt: 'Kas kolid Saksamaale või tema Eestisse? Mis plaanid on? (Kõik küsivad seda!)',
    questions: [
      { de: 'Willst du irgendwann nach Deutschland ziehen?', en: 'Do you want to move to Germany at some point?' },
      { de: 'Und, wie sieht’s aus – ziehst du bald her?', en: 'So, what’s the plan – are you moving here soon?' },
      { de: 'Habt ihr schon Pläne?', en: 'Do you have plans yet?' },
    ],
  },
  {
    id: 'job',
    emoji: '💼',
    title: 'Your work',
    ask: 'What do you do for work? Explain it simply, as you would at a party. What do you like about it?',
    askEt: 'Mis tööd sa teed? Seleta lihtsalt, nagu peol. Mis sulle selle juures meeldib?',
    questions: [
      { de: 'Was machst du beruflich?', en: 'What do you do for a living?' },
      { de: 'Und was machst du so?', en: 'And what do you do?', note: 'At a party this almost always means work.' },
      { de: 'Was machst’n du so?', en: 'So what do you do?', note: '"machst’n" = machst denn.' },
      { de: 'Kannst du das auch von hier aus machen?', en: 'Can you do that from here too?' },
    ],
  },
  {
    id: 'german',
    emoji: '🗣️',
    title: 'Learning German',
    ask: 'Why and how are you learning German? How long? What’s hardest?',
    askEt: 'Miks ja kuidas sa saksa keelt õpid? Kui kaua? Mis on kõige raskem?',
    questions: [
      { de: 'Wo hast du Deutsch gelernt?', en: 'Where did you learn German?' },
      { de: 'Wie lange lernst du schon Deutsch?', en: 'How long have you been learning German?' },
      { de: 'Ist Deutsch schwer für dich?', en: 'Is German hard for you?' },
    ],
    reactions: [
      { de: 'Dein Deutsch ist echt gut!', en: 'Your German is really good!' },
      { de: 'Wir können auch Englisch reden, wenn’s einfacher ist.', en: 'We can switch to English if it’s easier.' },
    ],
  },
  {
    id: 'estonia',
    emoji: '❄️',
    title: 'Life in Estonia',
    ask: 'What is Estonia like? Things Germans ask about: digital state, winter darkness, sauna, language, Finland.',
    askEt: 'Milline on Eesti? Sakslased küsivad: digiriik, talvepimedus, saun, keel, Soome.',
    questions: [
      { de: 'Wie ist es so in Estland?', en: 'What’s it like in Estonia?' },
      { de: 'Ist Estland nicht total digital?', en: 'Isn’t Estonia totally digital?' },
      { de: 'Ist es da im Winter nicht super dunkel?', en: 'Isn’t it super dark there in winter?' },
      { de: 'Ist Estnisch so ähnlich wie Finnisch?', en: 'Is Estonian similar to Finnish?' },
    ],
  },
  {
    id: 'germany',
    emoji: '🇩🇪',
    title: 'What you think of Germany',
    ask: 'What do you like about Germany? What’s strange or different from Estonia? Be honest and a bit funny.',
    askEt: 'Mis sulle Saksamaal meeldib? Mis on imelik või Eestist erinev? Ole aus ja natuke naljakas.',
    questions: [
      { de: 'Und, wie gefällt’s dir in Deutschland?', en: 'So, how do you like Germany?' },
      { de: 'Was ist hier anders als in Estland?', en: 'What’s different here compared to Estonia?' },
      { de: 'Was findest du an Deutschland komisch?', en: 'What do you find strange about Germany?' },
    ],
  },
  {
    id: 'hobbies',
    emoji: '🏃',
    title: 'Free time',
    ask: 'What do you do in your free time? Sports, interests, anything you could talk about for a while.',
    askEt: 'Mida sa vabal ajal teed? Sport, huvid, millest saaksid pikemalt rääkida.',
    questions: [
      { de: 'Was machst du so in deiner Freizeit?', en: 'What do you do in your free time?' },
      { de: 'Machst du Sport?', en: 'Do you do any sport?' },
      { de: 'Worauf hast du am Wochenende Bock?', en: 'What do you feel like doing at the weekend?', note: '"Bock haben auf" = to feel like (casual).' },
    ],
  },
  {
    id: 'weekend',
    emoji: '📅',
    title: 'What you did / will do',
    ask: 'What have you done on this visit so far, and what are your plans? (Practise the past tense!)',
    askEt: 'Mida sa sel külastusel juba teinud oled ja mis plaanid on? (Harjuta minevikku!)',
    questions: [
      { de: 'Was habt ihr heute so gemacht?', en: 'What did you do today?' },
      { de: 'Was habt ihr am Wochenende vor?', en: 'What are you up to at the weekend?' },
      { de: 'Warst du schon mal in …?', en: 'Have you ever been to …?' },
    ],
  },
  {
    id: 'food',
    emoji: '🥨',
    title: 'Food & drink',
    ask: 'German food you like or don’t, Estonian food you miss, what you drink.',
    askEt: 'Saksa toit, mis meeldib või ei meeldi, Eesti toit, mida igatsed, mida jood.',
    questions: [
      { de: 'Hast du schon mal … probiert?', en: 'Have you ever tried …?' },
      { de: 'Was isst man so in Estland?', en: 'What do people eat in Estonia?' },
      { de: 'Trinkst du noch ein Bier mit?', en: 'Will you have another beer with us?' },
    ],
  },
  {
    id: 'family',
    emoji: '👨‍👩‍👧',
    title: 'Family',
    ask: 'Your family: siblings, parents, where they live.',
    askEt: 'Sinu pere: õed-vennad, vanemad, kus nad elavad.',
    questions: [
      { de: 'Hast du Geschwister?', en: 'Do you have siblings?' },
      { de: 'Wohnt deine Familie auch in Tallinn?', en: 'Does your family live in Tallinn too?' },
    ],
  },
];

export const topicById = (id: string) => SMALLTALK_TOPICS.find((t) => t.id === id);

/** Not shown in the Phase 1 grid — used for the AI "rapid-fire" small-talk partner. */
export const SMALLTALK_SCENARIO: Scenario = {
  id: 'smalltalk',
  emoji: '🍻',
  title: 'Party small talk',
  titleDe: 'Smalltalk auf einer Party',
  level: 'A2',
  intro: [],
  say: [],
  hear: [],
  grammar: { title: '', points: [], examples: [] },
  dialogue: [],
  roleplay: {
    character:
      'Jonas, early 30s, a German friend of the learner’s girlfriend (she is Estonian and lives in Germany). Curious, friendly, talks fast and casually, uses "du" and spoken forms (hab, is, ’ne, machst’n, halt, eben).',
    setting: 'The kitchen at a house party, drinks in hand. Jonas has just met the learner and wants to know everything about them.',
    goals: [
      'Answer the classic getting-to-know-you questions with more than one sentence',
      'Ask at least three questions back (Und du? …)',
      'React naturally (Echt? Krass! Ach so. Na klar.)',
      'Tell one short story in the Perfekt',
    ],
    curveballs: [
      'Rapid follow-up questions that dig into details of the learner’s answers',
      'Mixes up Estonia with Finland or Latvia',
      'Asks directly whether the learner will move to Germany',
      'A second friend (Anna) joins and asks one of the same questions again',
    ],
  },
};
