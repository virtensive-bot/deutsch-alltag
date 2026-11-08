import type { Phrase } from '../types';

/** A reply-choice step in a mini-dialogue at the end of a lesson. */
export interface DialogueStep {
  them: Phrase;
  reply: Phrase;
  /** Wrong (but plausible-looking) German replies */
  wrong: string[];
}

export interface PathLesson {
  id: string;
  title: string;
  /** One-line "why it works like this" tip (Language Transfer style) */
  tip?: string;
  items: Phrase[];
  dialogue?: DialogueStep[];
}

export interface PathUnit {
  id: string;
  emoji: string;
  title: string;
  /** What you can do after this unit */
  goal: string;
  lessons: PathLesson[];
  /** Related Phase 1 situation (for "explore more" and AI role-play) */
  scenario?: string;
}

const P = (de: string, en: string, note?: string): Phrase => (note ? { de, en, note } : { de, en });

export const PATH: PathUnit[] = [
  {
    id: 'u1',
    emoji: '👋',
    title: 'First words',
    goal: 'Greet people, say yes, no, please and thank you.',
    lessons: [
      {
        id: 'u1l1',
        title: 'Hello & bye',
        tip: '“Hallo” works almost everywhere. In shops you’ll also hear “Guten Tag” or, in the morning, “Guten Morgen”.',
        items: [
          P('Hallo!', 'Hello!'),
          P('Guten Morgen!', 'Good morning!'),
          P('Guten Tag!', 'Good day!', 'A polite hello, e.g. in shops.'),
          P('Tschüss!', 'Bye!'),
          P('Auf Wiedersehen!', 'Goodbye!', 'More formal than Tschüss.'),
        ],
      },
      {
        id: 'u1l2',
        title: 'Please & thanks',
        tip: '“Bitte” is a magic word: please, you’re welcome, and here you go.',
        items: [
          P('Ja.', 'Yes.'),
          P('Nein.', 'No.'),
          P('Bitte.', 'Please.'),
          P('Danke!', 'Thanks!'),
          P('Danke schön!', 'Thank you very much!'),
          P('Bitte schön!', 'You’re welcome!', 'Also: “Here you go.”'),
        ],
      },
      {
        id: 'u1l3',
        title: 'Quick reactions',
        tip: '“Gern” means “gladly” – “Ja, gern” is the friendliest way to say yes to an offer.',
        items: [
          P('Ja, gern.', 'Yes, gladly.'),
          P('Nein, danke.', 'No, thanks.'),
          P('Entschuldigung!', 'Excuse me!', 'Also means “Sorry!”'),
          P('Kein Problem.', 'No problem.'),
          P('Alles klar.', 'All right.', 'Also: “Got it.”'),
        ],
        dialogue: [
          { them: P('Hallo! Guten Morgen!', 'Hello! Good morning!'), reply: P('Guten Morgen!', 'Good morning!'), wrong: ['Tschüss!', 'Nein, danke.'] },
          { them: P('Möchten Sie einen Kaffee?', 'Would you like a coffee?'), reply: P('Ja, gern.', 'Yes, gladly.'), wrong: ['Guten Tag!', 'Entschuldigung!'] },
          { them: P('Bitte schön!', 'Here you go!'), reply: P('Danke schön!', 'Thank you very much!'), wrong: ['Auf Wiedersehen!', 'Kein Problem.'] },
        ],
      },
    ],
  },
  {
    id: 'u2',
    emoji: '🛟',
    title: 'When you don’t understand',
    goal: 'Ask people to repeat, slow down or switch language.',
    scenario: 'repair',
    lessons: [
      {
        id: 'u2l1',
        title: 'Sorry, what?',
        tip: 'Germans speak fast. Saying “Langsamer, bitte” is completely normal – people will happily slow down.',
        items: [
          P('Wie bitte?', 'Sorry, what?', 'The polite “pardon?”'),
          P('Ich verstehe nicht.', 'I don’t understand.'),
          P('Langsamer, bitte.', 'Slower, please.'),
          P('Noch einmal, bitte.', 'Once more, please.'),
          P('Ich spreche nur ein bisschen Deutsch.', 'I only speak a little German.'),
        ],
      },
      {
        id: 'u2l2',
        title: 'What does that mean?',
        tip: '“Sie” (capital S) is the polite “you” – use it with strangers, staff and older people.',
        items: [
          P('Sprechen Sie Englisch?', 'Do you speak English?'),
          P('Was heißt das?', 'What does that mean?'),
          P('Was ist das?', 'What is that?'),
          P('Ich weiß nicht.', 'I don’t know.'),
          P('Moment, bitte.', 'One moment, please.'),
        ],
      },
      {
        id: 'u2l3',
        title: 'I’m learning',
        tip: 'In German the verb is always in position 2: “Jetzt verstehe ich” (now understand I).',
        items: [
          P('Ich lerne Deutsch.', 'I am learning German.'),
          P('Jetzt verstehe ich.', 'Now I understand.'),
          P('Können Sie das wiederholen?', 'Can you repeat that?'),
          P('Können Sie das aufschreiben?', 'Can you write that down?'),
          P('Danke für Ihre Geduld!', 'Thanks for your patience!'),
        ],
        dialogue: [
          { them: P('Möchten Sie das mit Karte oder bar bezahlen?', 'Would you like to pay by card or cash?'), reply: P('Langsamer, bitte.', 'Slower, please.'), wrong: ['Danke schön!', 'Guten Morgen!'] },
          { them: P('Karte oder bar?', 'Card or cash?'), reply: P('Ah, jetzt verstehe ich.', 'Ah, now I understand.'), wrong: ['Tschüss!', 'Ich weiß nicht, danke.'] },
          { them: P('Kein Problem!', 'No problem!'), reply: P('Danke für Ihre Geduld!', 'Thanks for your patience!'), wrong: ['Sprechen Sie Englisch?', 'Was ist das?'] },
        ],
      },
    ],
  },
  {
    id: 'u3',
    emoji: '🔢',
    title: 'Numbers & prices',
    goal: 'Understand prices up to 20 euros.',
    lessons: [
      {
        id: 'u3l1',
        title: '1 to 6',
        items: [P('eins', 'one (1)'), P('zwei', 'two (2)'), P('drei', 'three (3)'), P('vier', 'four (4)'), P('fünf', 'five (5)'), P('sechs', 'six (6)')],
      },
      {
        id: 'u3l2',
        title: '7 to 12',
        tip: '“zwei” is often said “zwo” on the phone and at the train station, so it isn’t confused with “drei”.',
        items: [P('sieben', 'seven (7)'), P('acht', 'eight (8)'), P('neun', 'nine (9)'), P('zehn', 'ten (10)'), P('elf', 'eleven (11)'), P('zwölf', 'twelve (12)')],
      },
      {
        id: 'u3l3',
        title: 'How much?',
        tip: 'Prices: euros first, then cents, no “and”: €2.50 = “zwei Euro fünfzig”.',
        items: [
          P('Wie viel kostet das?', 'How much is that?'),
          P('Das kostet zwei Euro.', 'That costs two euros.'),
          P('Das macht fünf Euro.', 'That comes to five euros.'),
          P('fünfzig', 'fifty (50)'),
          P('Zwei Euro fünfzig.', 'Two euros fifty.'),
          P('Zehn Euro, bitte.', 'Ten euros, please.'),
        ],
        dialogue: [
          { them: P('Das macht sechs Euro.', 'That comes to six euros.'), reply: P('Sechs Euro? Hier, bitte.', 'Six euros? Here you go.'), wrong: ['Zwölf Euro? Hier, bitte.', 'Drei Euro? Hier, bitte.'] },
          { them: P('Zwei Euro fünfzig, bitte.', 'Two euros fifty, please.'), reply: P('Alles klar. Bitte schön.', 'All right. Here you go.'), wrong: ['Wie viel kostet das?', 'Nein, danke.'] },
        ],
      },
    ],
  },
  {
    id: 'u4',
    emoji: '🥨',
    title: 'At the bakery',
    goal: 'Buy bread and pastries and pay.',
    scenario: 'bakery',
    lessons: [
      {
        id: 'u4l1',
        title: 'Bread & cake',
        tip: 'German has different words for “a”: ein Brötchen, but eine Brezel. Learn each word together with its “ein/eine”.',
        items: [
          P('ein Brötchen', 'a bread roll'),
          P('zwei Brötchen', 'two bread rolls'),
          P('eine Brezel', 'a pretzel'),
          P('ein Croissant', 'a croissant'),
          P('ein Stück Kuchen', 'a piece of cake'),
        ],
      },
      {
        id: 'u4l2',
        title: 'Ordering',
        tip: '“Ich hätte gern …” (I would like …) is the most useful shop phrase in German.',
        items: [
          P('Was darf’s sein?', 'What can I get you?', 'You’ll hear this at every counter.'),
          P('Ich hätte gern ein Brötchen.', 'I would like a bread roll.'),
          P('Ich nehme eine Brezel.', 'I will take a pretzel.'),
          P('Sonst noch etwas?', 'Anything else?'),
          P('Das ist alles.', 'That is all.'),
        ],
      },
      {
        id: 'u4l3',
        title: 'Take away & pay',
        items: [
          P('Zum Mitnehmen, bitte.', 'To take away, please.'),
          P('Zum Hier-Essen.', 'To eat here.'),
          P('Kann ich mit Karte zahlen?', 'Can I pay by card?'),
          P('Ja, natürlich.', 'Yes, of course.'),
          P('Nur bar.', 'Cash only.'),
        ],
        dialogue: [
          { them: P('Hallo! Was darf’s sein?', 'Hello! What can I get you?'), reply: P('Ich hätte gern zwei Brötchen.', 'I would like two bread rolls.'), wrong: ['Ich verstehe nicht, danke.', 'Auf Wiedersehen!'] },
          { them: P('Sonst noch etwas?', 'Anything else?'), reply: P('Nein, danke. Das ist alles.', 'No, thanks. That is all.'), wrong: ['Ja, natürlich.', 'Guten Morgen!'] },
          { them: P('Zum Mitnehmen?', 'To take away?'), reply: P('Ja, bitte.', 'Yes, please.'), wrong: ['Nur bar.', 'Wie bitte, danke.'] },
          { them: P('Das macht drei Euro.', 'That comes to three euros.'), reply: P('Kann ich mit Karte zahlen?', 'Can I pay by card?'), wrong: ['Was darf’s sein?', 'Sonst noch etwas?'] },
        ],
      },
    ],
  },
  {
    id: 'u5',
    emoji: '☕',
    title: 'At the café',
    goal: 'Order drinks, pay, find the toilet.',
    scenario: 'bakery',
    lessons: [
      {
        id: 'u5l1',
        title: 'Drinks',
        items: [
          P('ein Kaffee', 'a coffee'),
          P('ein Tee', 'a tea'),
          P('ein Wasser', 'a water'),
          P('mit Milch', 'with milk'),
          P('ohne Zucker', 'without sugar'),
        ],
      },
      {
        id: 'u5l2',
        title: 'A coffee, please',
        tip: 'When you order, “ein Kaffee” becomes “einen Kaffee” (masculine words get -en). “ein Wasser” stays the same.',
        items: [
          P('Einen Kaffee, bitte.', 'A coffee, please.'),
          P('Einen Tee mit Milch, bitte.', 'A tea with milk, please.'),
          P('Groß oder klein?', 'Large or small?'),
          P('Klein, bitte.', 'Small, please.'),
          P('Für hier oder zum Mitnehmen?', 'For here or to go?'),
        ],
      },
      {
        id: 'u5l3',
        title: 'Paying & toilet',
        tip: 'Tipping: round up about 5–10% and say the total, or say “Stimmt so” (keep the change).',
        items: [
          P('Ich möchte zahlen.', 'I would like to pay.'),
          P('Zusammen oder getrennt?', 'Together or separately?'),
          P('Zusammen, bitte.', 'Together, please.'),
          P('Stimmt so.', 'Keep the change.'),
          P('Wo ist die Toilette?', 'Where is the toilet?'),
        ],
        dialogue: [
          { them: P('Hallo! Was möchtest du?', 'Hi! What would you like?'), reply: P('Einen Kaffee mit Milch, bitte.', 'A coffee with milk, please.'), wrong: ['Zusammen, bitte.', 'Wo ist die Toilette?'] },
          { them: P('Groß oder klein?', 'Large or small?'), reply: P('Klein, bitte.', 'Small, please.'), wrong: ['Ohne Zucker, danke.', 'Nur bar.'] },
          { them: P('Für hier oder zum Mitnehmen?', 'For here or to go?'), reply: P('Für hier, bitte.', 'For here, please.'), wrong: ['Getrennt, bitte.', 'Ich nehme eine Brezel.'] },
          { them: P('Das macht drei Euro sechzig.', 'That’s €3.60.'), reply: P('Vier Euro. Stimmt so.', 'Four euros. Keep the change.'), wrong: ['Groß, bitte.', 'Einen Tee, bitte.'] },
        ],
      },
    ],
  },
  {
    id: 'u6',
    emoji: '🛒',
    title: 'Supermarket',
    goal: 'Find things and get through the checkout.',
    scenario: 'supermarket',
    lessons: [
      {
        id: 'u6l1',
        title: 'Where is…?',
        items: [
          P('Wo finde ich Milch?', 'Where do I find milk?'),
          P('Wo finde ich Brot?', 'Where do I find bread?'),
          P('Im Gang drei.', 'In aisle three.'),
          P('Da hinten.', 'Back there.'),
          P('Danke für die Hilfe!', 'Thanks for the help!'),
        ],
      },
      {
        id: 'u6l2',
        title: 'At the checkout',
        tip: 'Cashiers ask the same 3 questions: bag? loyalty card? receipt? Learn to recognise them and you’re done.',
        items: [
          P('Brauchen Sie eine Tüte?', 'Do you need a bag?'),
          P('Nein, danke, ich habe eine.', 'No, thanks, I have one.'),
          P('Haben Sie eine Payback-Karte?', 'Do you have a Payback card?', 'A loyalty card – most people just say no.'),
          P('Nein, habe ich nicht.', 'No, I don’t.'),
          P('Brauchen Sie den Bon?', 'Do you need the receipt?'),
          P('Mit Karte, bitte.', 'By card, please.'),
        ],
        dialogue: [
          { them: P('Hallo! Brauchen Sie eine Tüte?', 'Hi! Do you need a bag?'), reply: P('Nein, danke, ich habe eine.', 'No, thanks, I have one.'), wrong: ['Im Gang drei.', 'Wo finde ich Milch?'] },
          { them: P('Haben Sie eine Payback-Karte?', 'Do you have a Payback card?'), reply: P('Nein, habe ich nicht.', 'No, I don’t.'), wrong: ['Ja, gern. Zwei Brötchen.', 'Da hinten.'] },
          { them: P('Zwölf Euro achtzig. Bar oder mit Karte?', '€12.80. Cash or card?'), reply: P('Mit Karte, bitte.', 'By card, please.'), wrong: ['Klein, bitte.', 'Danke für die Hilfe!'] },
        ],
      },
      {
        id: 'u6l3',
        title: 'Numbers 20–100',
        tip: 'German says 21 as “one-and-twenty”: einundzwanzig. Listen for the LAST part first – it’s the tens.',
        items: [
          P('zwanzig', 'twenty (20)'),
          P('dreißig', 'thirty (30)'),
          P('vierzig', 'forty (40)'),
          P('hundert', 'a hundred (100)'),
          P('einundzwanzig', 'twenty-one (21)'),
          P('fünfundvierzig', 'forty-five (45)'),
        ],
      },
    ],
  },
  {
    id: 'u7',
    emoji: '🚆',
    title: 'Train & tickets',
    goal: 'Buy a ticket and understand delays.',
    scenario: 'transport',
    lessons: [
      {
        id: 'u7l1',
        title: 'Tickets',
        items: [
          P('Eine Fahrkarte nach Berlin, bitte.', 'A ticket to Berlin, please.'),
          P('Hin und zurück.', 'Return trip.'),
          P('Nur hin.', 'One way.'),
          P('Wann fährt der nächste Zug?', 'When does the next train leave?'),
          P('Von welchem Gleis?', 'From which platform?'),
        ],
      },
      {
        id: 'u7l2',
        title: 'Announcements',
        tip: 'You don’t need to understand everything: listen for the platform (Gleis), the number of minutes, and “fällt aus” (cancelled).',
        items: [
          P('Gleis drei', 'platform three'),
          P('Der Zug hat zehn Minuten Verspätung.', 'The train is ten minutes late.'),
          P('Der Zug fällt aus.', 'The train is cancelled.'),
          P('Bitte einsteigen!', 'Please get on!'),
          P('Nächster Halt: Hauptbahnhof.', 'Next stop: main station.'),
        ],
      },
      {
        id: 'u7l3',
        title: 'On the train',
        items: [
          P('Ist hier noch frei?', 'Is this seat free?'),
          P('Ja, klar.', 'Yes, sure.'),
          P('Nein, hier ist besetzt.', 'No, this one is taken.'),
          P('Fährt dieser Zug nach München?', 'Does this train go to Munich?'),
          P('Muss ich umsteigen?', 'Do I have to change trains?'),
        ],
        dialogue: [
          { them: P('Hallo, ist hier noch frei?', 'Hi, is this seat free?'), reply: P('Ja, klar.', 'Yes, sure.'), wrong: ['Nur hin.', 'Gleis drei.'] },
          { them: P('Die Fahrkarten, bitte!', 'Tickets, please!'), reply: P('Hier, bitte.', 'Here you go.'), wrong: ['Hin und zurück.', 'Nein, hier ist besetzt.'] },
          { them: P('Danke. Gute Fahrt!', 'Thanks. Have a good trip!'), reply: P('Danke! Muss ich umsteigen?', 'Thanks! Do I have to change trains?'), wrong: ['Bitte einsteigen!', 'Der Zug fällt aus.'] },
          { them: P('Nein, der fährt direkt.', 'No, it goes direct.'), reply: P('Super, danke!', 'Great, thanks!'), wrong: ['Von welchem Gleis?', 'Ich hätte gern ein Brötchen.'] },
        ],
      },
    ],
  },
  {
    id: 'u8',
    emoji: '🧭',
    title: 'Getting around',
    goal: 'Ask the way and buy something at the pharmacy.',
    scenario: 'directions',
    lessons: [
      {
        id: 'u8l1',
        title: 'Left, right',
        items: [
          P('links', 'left'),
          P('rechts', 'right'),
          P('geradeaus', 'straight ahead'),
          P('Ist das weit?', 'Is it far?'),
          P('Nein, nicht weit.', 'No, not far.'),
          P('Zwei Minuten zu Fuß.', 'Two minutes on foot.'),
        ],
      },
      {
        id: 'u8l2',
        title: 'Where is…?',
        tip: 'Start with “Entschuldigung” to get someone’s attention – then ask. People expect it.',
        items: [
          P('Wo ist der Bahnhof?', 'Where is the station?'),
          P('Entschuldigung, ich suche die U-Bahn.', 'Excuse me, I am looking for the underground.'),
          P('Die erste Straße links.', 'The first street on the left.'),
          P('Dann immer geradeaus.', 'Then keep going straight.'),
          P('Gleich da vorne.', 'Just up ahead.'),
        ],
      },
      {
        id: 'u8l3',
        title: 'Pharmacy',
        tip: '“Ich habe …” (I have) works for most problems: Ich habe Kopfschmerzen, Ich habe Halsschmerzen.',
        items: [
          P('Ich habe Kopfschmerzen.', 'I have a headache.'),
          P('Haben Sie etwas gegen Kopfschmerzen?', 'Do you have something for a headache?'),
          P('Ich habe Halsschmerzen.', 'I have a sore throat.'),
          P('Wie oft am Tag?', 'How often a day?'),
          P('Dreimal am Tag.', 'Three times a day.'),
        ],
        dialogue: [
          { them: P('Hallo, wie kann ich helfen?', 'Hello, how can I help?'), reply: P('Haben Sie etwas gegen Kopfschmerzen?', 'Do you have something for a headache?'), wrong: ['Die erste Straße links.', 'Ist das weit?'] },
          { them: P('Ja, die hier. Zwei Tabletten, dreimal am Tag.', 'Yes, these. Two tablets, three times a day.'), reply: P('Dreimal am Tag. Alles klar, danke!', 'Three times a day. Got it, thanks!'), wrong: ['Nur hin, bitte.', 'Wo ist der Bahnhof?'] },
        ],
      },
    ],
  },
  {
    id: 'u9',
    emoji: '🍽️',
    title: 'Restaurant',
    goal: 'Get a table, order, and pay.',
    scenario: 'restaurant',
    lessons: [
      {
        id: 'u9l1',
        title: 'A table',
        items: [
          P('Einen Tisch für zwei, bitte.', 'A table for two, please.'),
          P('Haben Sie reserviert?', 'Do you have a reservation?'),
          P('Die Karte, bitte.', 'The menu, please.'),
          P('Was empfehlen Sie?', 'What do you recommend?'),
          P('Ich nehme das Schnitzel.', 'I will have the schnitzel.'),
        ],
      },
      {
        id: 'u9l2',
        title: 'Drinks & cheers',
        tip: 'When you say “Prost!”, look the other person in the eye – Germans take this seriously!',
        items: [
          P('Ein Bier, bitte.', 'A beer, please.'),
          P('Ein Glas Wein.', 'A glass of wine.'),
          P('Noch ein Wasser, bitte.', 'Another water, please.'),
          P('Prost!', 'Cheers!'),
          P('Guten Appetit!', 'Enjoy your meal!'),
        ],
      },
      {
        id: 'u9l3',
        title: 'The bill',
        tip: 'In Germany you usually have to ask for the bill – the waiter won’t bring it on their own.',
        items: [
          P('Es war sehr lecker.', 'It was very tasty.'),
          P('Die Rechnung, bitte.', 'The bill, please.'),
          P('Wir zahlen getrennt.', 'We will pay separately.'),
          P('Ist das scharf?', 'Is it spicy?'),
          P('Hat es geschmeckt?', 'Did you enjoy it?', 'Waiters always ask this.'),
        ],
        dialogue: [
          { them: P('Guten Abend! Haben Sie reserviert?', 'Good evening! Do you have a reservation?'), reply: P('Nein. Einen Tisch für zwei, bitte.', 'No. A table for two, please.'), wrong: ['Die Rechnung, bitte.', 'Prost!'] },
          { them: P('Was darf ich Ihnen bringen?', 'What can I bring you?'), reply: P('Ein Bier und ein Wasser, bitte.', 'A beer and a water, please.'), wrong: ['Es war sehr lecker.', 'Wir zahlen getrennt.'] },
          { them: P('Hat es geschmeckt?', 'Did you enjoy it?'), reply: P('Ja, es war sehr lecker!', 'Yes, it was very tasty!'), wrong: ['Ist das scharf?', 'Was empfehlen Sie?'] },
          { them: P('Zusammen oder getrennt?', 'Together or separately?'), reply: P('Zusammen, bitte.', 'Together, please.'), wrong: ['Guten Appetit!', 'Ein Glas Wein.'] },
        ],
      },
    ],
  },
  {
    id: 'u10',
    emoji: '🤝',
    title: 'Meeting her friends',
    goal: 'Introduce yourself and ask the basics.',
    scenario: 'meeting',
    lessons: [
      {
        id: 'u10l1',
        title: 'Who are you?',
        tip: 'Among friends always use “du” (you, informal): “Wie heißt du?”, “Woher kommst du?”.',
        items: [
          P('Ich heiße Mart.', 'My name is Mart.'),
          P('Wie heißt du?', 'What is your name?'),
          P('Freut mich!', 'Nice to meet you!'),
          P('Ich komme aus Estland.', 'I come from Estonia.'),
          P('Woher kommst du?', 'Where do you come from?'),
        ],
      },
      {
        id: 'u10l2',
        title: 'Why I’m here',
        items: [
          P('Ich wohne in Tallinn.', 'I live in Tallinn.'),
          P('Ich bin zu Besuch.', 'I am visiting.'),
          P('Meine Freundin wohnt hier.', 'My girlfriend lives here.'),
          P('Wie lange bleibst du?', 'How long are you staying?'),
          P('Eine Woche.', 'One week.'),
        ],
      },
      {
        id: 'u10l3',
        title: 'How are you?',
        tip: '“Und du?” (and you?) keeps any conversation going – use it after every answer.',
        items: [
          P('Wie geht’s?', 'How are you?'),
          P('Gut, danke. Und dir?', 'Good, thanks. And you?'),
          P('Was machst du beruflich?', 'What do you do for work?'),
          P('Und du?', 'And you?'),
          P('Echt? Das ist interessant.', 'Really? That is interesting.'),
        ],
        dialogue: [
          { them: P('Hi! Ich bin Jonas. Und du?', 'Hi! I’m Jonas. And you?'), reply: P('Ich heiße Mart. Freut mich!', 'My name is Mart. Nice to meet you!'), wrong: ['Eine Woche.', 'Gut, danke.'] },
          { them: P('Freut mich auch! Woher kommst du?', 'Nice to meet you too! Where are you from?'), reply: P('Ich komme aus Estland. Und du?', 'I’m from Estonia. And you?'), wrong: ['Ich bin zu Besuch.', 'Wie lange bleibst du?'] },
          { them: P('Ich bin aus Köln. Wie lange bleibst du?', 'I’m from Cologne. How long are you staying?'), reply: P('Eine Woche. Meine Freundin wohnt hier.', 'One week. My girlfriend lives here.'), wrong: ['Was machst du beruflich?', 'Wie heißt du?'] },
          { them: P('Cool! Ich bin Lehrer.', 'Cool! I’m a teacher.'), reply: P('Echt? Das ist interessant.', 'Really? That’s interesting.'), wrong: ['Ich komme aus Estland.', 'Tschüss!'] },
        ],
      },
    ],
  },
  {
    id: 'u11',
    emoji: '💬',
    title: 'Small talk',
    goal: 'Chat about Germany, hobbies and plans.',
    scenario: 'meeting',
    lessons: [
      {
        id: 'u11l1',
        title: 'Your German',
        tip: '“seit” + present tense = “have been … for”: “Ich lerne seit drei Monaten” (I’ve been learning for three months).',
        items: [
          P('Wie gefällt dir Deutschland?', 'How do you like Germany?'),
          P('Sehr gut!', 'Very much!'),
          P('Mein Deutsch ist nicht so gut.', 'My German is not so good.'),
          P('Ich lerne seit drei Monaten.', 'I have been learning for three months.'),
          P('Dein Deutsch ist echt gut!', 'Your German is really good!'),
        ],
      },
      {
        id: 'u11l2',
        title: 'What you like',
        tip: 'Add “gern” after the verb to say you like doing it: Ich koche gern = I like cooking.',
        items: [
          P('Was machst du am Wochenende?', 'What are you doing at the weekend?'),
          P('Ich mache gern Sport.', 'I like doing sport.'),
          P('Ich koche gern.', 'I like cooking.'),
          P('Was machst du gern?', 'What do you like doing?'),
          P('Ich auch!', 'Me too!'),
        ],
      },
      {
        id: 'u11l3',
        title: 'At a party',
        items: [
          P('Möchtest du etwas trinken?', 'Would you like something to drink?'),
          P('Ja, gern, ein Bier.', 'Yes, please, a beer.'),
          P('Wir sprechen Estnisch zusammen.', 'We speak Estonian together.'),
          P('Es war schön, dich kennenzulernen!', 'It was nice to meet you!'),
          P('Bis bald!', 'See you soon!'),
        ],
        dialogue: [
          { them: P('Hey! Möchtest du etwas trinken?', 'Hey! Would you like something to drink?'), reply: P('Ja, gern, ein Bier.', 'Yes, please, a beer.'), wrong: ['Bis bald!', 'Ich lerne seit drei Monaten.'] },
          { them: P('Und, wie gefällt dir Deutschland?', 'So, how do you like Germany?'), reply: P('Sehr gut! Aber mein Deutsch ist nicht so gut.', 'Very much! But my German isn’t so good.'), wrong: ['Ich koche gern.', 'Es war schön, dich kennenzulernen!'] },
          { them: P('Ach was, dein Deutsch ist echt gut! Sprecht ihr zu Hause Deutsch?', 'Nonsense, your German is really good! Do you speak German at home?'), reply: P('Nein, wir sprechen Estnisch zusammen.', 'No, we speak Estonian together.'), wrong: ['Ja, gern, ein Bier.', 'Ich auch!'] },
          { them: P('Okay, ich muss los. Tschüss!', 'OK, I have to go. Bye!'), reply: P('Es war schön, dich kennenzulernen! Bis bald!', 'It was nice to meet you! See you soon!'), wrong: ['Was machst du am Wochenende?', 'Möchtest du etwas trinken?'] },
        ],
      },
    ],
  },
];

// ---------------- Index ----------------

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export const pathItemKey = (lessonId: string, p: Phrase) => `p:${lessonId}:${hash(p.de)}`;

export interface PathItemRef {
  key: string;
  phrase: Phrase;
  unit: PathUnit;
  lesson: PathLesson;
}

const ITEMS = new Map<string, PathItemRef>();
for (const unit of PATH) for (const lesson of unit.lessons) for (const phrase of lesson.items) {
  const key = pathItemKey(lesson.id, phrase);
  ITEMS.set(key, { key, phrase, unit, lesson });
}

export const lookupPathItem = (key: string) => ITEMS.get(key);
export const allPathItems = () => [...ITEMS.values()];

/** Flat ordered list of steps: every lesson, then the unit test. */
export interface PathStep {
  id: string; // lesson id, or `${unitId}:test`
  unit: PathUnit;
  lesson?: PathLesson;
  test?: boolean;
}

export const PATH_STEPS: PathStep[] = PATH.flatMap((unit) => [
  ...unit.lessons.map((lesson) => ({ id: lesson.id, unit, lesson })),
  { id: `${unit.id}:test`, unit, test: true },
]);
