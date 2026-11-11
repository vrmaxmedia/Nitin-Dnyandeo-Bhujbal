import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/* =====================================================================
   SETTINGS & ENGINE CONFIGURATION
   ===================================================================== */
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PARALLEL_CALLS = 2;
const MAX_ROUNDS = 2;
const CALL_TIMEOUT_MS = 12000;
const MAX_OUTPUT_TOKENS = 300;
const HISTORY_SIZE = 60;

/* =====================================================================
   BUSINESS PACK (Mr. Nitin Bhujbal - Organic Farming Advisor)
   ===================================================================== */
const SEO_KEYWORDS = [
  'best organic farming advisor in maharashtra',
  'organic farming consultant in pune',
  'nitin bhujbal agriculture expert',
  'sendriya sheti margdarshan',
  'farm planning and soil testing',
  'increase crop yield organically',
  'organic fertilizers advice',
];

const TOPICS = {
  general: {
    id: 'general',
    text: 'expert guidance on organic farming, good farm planning, and excellent support for farmers',
    must: /farming|sheti|organic|sendriya|guidance|advisor|margdarshan|farm|kheti|jaivik/i,
  }
};

const ALL_TOPICS = ['general'];

const CHIPS = {
  'Organic Farming': { id: 'chip_organic', text: 'switching to successful organic farming (सेंद्रिय शेती)', must: /organic|sendriya|sheti|farming|kheti|jaivik/i },
  'Farm Planning': { id: 'chip_planning', text: 'excellent farm planning and management (शेती नियोजन)', must: /plan|niyojan|manage|vyavasthapan/i },
  'Soil Testing': { id: 'chip_soil', text: 'accurate soil testing and improvement advice (माती परीक्षण)', must: /soil|mati|mitti|test|parikshan/i },
  'Crop Yield Increase': { id: 'chip_yield', text: 'significant increase in crop yield and quality (उत्पादनात वाढ)', must: /yield|utpadan|crop|fasal|pik|increase|badh|vadh/i },
  'Cost Saving': { id: 'chip_cost', text: 'reducing farming costs and saving money (खर्चात बचत)', must: /cost|kharch|save|bachat|money|paise/i },
  'Expert Guidance': { id: 'chip_expert', text: 'great expert guidance and support from Nitin Sir (तज्ञांचे मार्गदर्शन)', must: /expert|guide|margdarshan|support|advice|salla/i },
  'Organic Fertilizers': { id: 'chip_fert', text: 'best advice on using organic fertilizers and pest control', must: /fertilizer|khad|khat|pest|organic|sendriya/i },
  'Govt Schemes': { id: 'chip_govt', text: 'help with agriculture government schemes and certification', must: /govt|government|scheme|yojana|certificate|pramanpatra/i },
};

const PERSONAS = [
  { id: 'local_farmer_mr', text: 'a local Maharashtrian farmer who successfully switched to organic farming' },
  { id: 'young_farmer', text: 'a young progressive farmer looking to increase yield naturally' },
  { id: 'experienced_farmer', text: 'an experienced farmer who reduced costs with Nitin Sirs advice' },
  { id: 'agri_business', text: 'someone doing modern agriculture who needed proper farm planning' },
];

const BUYER_LINES = [
  'You consulted for your own farm.',
  'You attended a training or workshop.',
  'You got farm planning done.',
  'You asked for soil testing advice.',
];

const EXAMPLES = {
  ENGLISH: [
    'Nitin Sir is the best organic farming advisor. His farm planning strategies helped me increase my crop yield significantly.',
    'Highly recommend Mr. Nitin Bhujbal for any agriculture consultation. His advice on organic fertilizers saved me a lot of money.',
    'Great experience! The soil testing and guidance provided were very accurate and helpful for our new organic farm.',
  ],
  MARATHI: [
    'नितीन सरांच्या मार्गदर्शनामुळे मी यशस्वीरित्या सेंद्रिय शेती सुरू केली. उत्पादनात खूप चांगली वाढ झाली आहे.',
    'शेती नियोजनासाठी आणि माती परीक्षणासाठी नितीन भुजबळ सर सर्वोत्तम आहेत. त्यांच्या सल्ल्यामुळे शेतीचा खर्च कमी झाला.',
    'सेंद्रिय शेती करायची असेल तर नक्की सरांचा सल्ला घ्या. खूप मोलाचे मार्गदर्शन मिळते आणि खतांचा खर्चही वाचतो.',
  ],
  HINDI: [
    'नितिन सर ने जैविक खेती के लिए बहुत अच्छा मार्गदर्शन दिया। हमारी फसल का उत्पादन काफी बढ़ गया है।',
    'खर्च कम करने और पैदावार बढ़ाने के लिए सर की सलाह बहुत काम आई। खेती की प्लानिंग के लिए बेस्ट हैं।',
    'मिट्टी की जांच और जैविक खाद के बारे में बहुत सही जानकारी दी। हर किसान को इनसे सलाह लेनी चाहिए।',
  ],
};

/* =====================================================================
   HELPER FUNCTIONS
   ===================================================================== */
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const chance = (p) => Math.random() < p;
const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

function pickWeighted(items) {
  const total = items.reduce((s, i) => s + i.w, 0);
  let r = Math.random() * total;
  for (const i of items) {
    if ((r -= i.w) <= 0) return i;
  }
  return items[0];
}

const LENGTHS = [
  { w: 12, lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 16, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 30, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 28, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool);
}

function choosePersona(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-4);
  const pool = PERSONAS.filter((v) => !last.includes(v.id));
  return pick(pool.length ? pool : PERSONAS);
}

function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'The staff here',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me', 'Wow', 'Absolutely', 'Really'
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|paisa vasool|—|–/i;

const HISTORY = [];
const HITS = new Map();

const openingOf = (text) => text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2));

function tooSimilar(text, recentOpenings) {
  const open = openingOf(text);
  if (recentOpenings.includes(open)) return true;
  const ws = wordSet(text);
  for (const h of HISTORY) {
    if (h.open === open) return true;
    let inter = 0;
    for (const w of ws) if (h.ws.has(w)) inter++;
    const union = ws.size + h.ws.size - inter || 1;
    if (inter / union > 0.45) return true;
  }
  return false;
}

function remember(text) {
  HISTORY.push({ open: openingOf(text), ws: wordSet(text) });
  while (HISTORY.length > HISTORY_SIZE) HISTORY.shift();
}

function rateLimited(request) {
  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const arr = (HITS.get(ip) || []).filter((t) => now - t < 5 * 60 * 1000);
  arr.push(now);
  HITS.set(ip, arr);
  if (HITS.size > 2000) {
    for (const [k, v] of HITS) if (!v.some((t) => now - t < 5 * 60 * 1000)) HITS.delete(k);
  }
  return arr.length > 25;
}

function cleanReview(text) {
  return text
    .replace(/^["'`\s]+|["'`\s]+$/g, '')
    .replace(/\s*\n+\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\.{2,}/g, ' ')
    .replace(/\.\s+/g, ', ')
    .replace(/\.+$/g, '')
    .replace(/,\s*,/g, ',')
    .trim();
}

function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (last === 'aur' || last === 'and' || last === 'the' || last === 'a' || last === 'ki' || last === 'ke') break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  return /[,\-]$/.test(text.trim());
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

/* =====================================================================
   PROMPT BUILDER
   ===================================================================== */
function buildPrompt(body, recent) {
  let language = body.language || 'MARATHI';
  if (!['MARATHI', 'ENGLISH', 'HINDI'].includes(language)) language = 'MARATHI';

  const businessName = String(body.businessName || 'Mr. Nitin Bhujbal').slice(0, 120);
  const category = String(body.category || 'Organic Farming Advisor').slice(0, 200);
  
  let chips = chosenChips(body);
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 2;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : TOPICS.general;
  
  const extraChips = chips.slice(1);
  const buyerLine = chance(0.6) ? pick(BUYER_LINES) + ' ' : '';
  const mentionName = chance(0.5);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.35) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  let languageBlock = '';
  if (language === 'MARATHI') {
    languageBlock = `LANGUAGE (MOST IMPORTANT): Write ONLY in natural, fluent Marathi language (मराठी) using Devanagari script. Speak like a real farmer from Maharashtra.`;
  } else if (language === 'HINDI') {
    languageBlock = `LANGUAGE (MOST IMPORTANT): Write ONLY in natural Hindi language (हिंदी) using Devanagari script. Speak like a real Indian farmer.`;
  } else {
    languageBlock = `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian farmer. Do not use Hindi/Marathi words.`;
  }

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');  const prompt = `${languageBlock}

You are ${persona.text}.${buyerLine}You are writing a Google Maps review for this Agriculture Consultant.
Business: ${businessName} \vert{}${category}

Tone samples from other farmers (only for feel, never copy words):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}.${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : '- Stick to the main topic only.'}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention "Nitin Sir" or "Bhujbal Sir" once naturally.` : '- Do not repeat the name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and"/"आणि", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real farmer/customer, not an advertisement. Avoid polished marketing words.
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, seo, language };
}

/* =====================================================================
   API HANDLER
   ===================================================================== */
async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }
  );
  const data = await res.json();
  return { res, data };
}

async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, seo, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the farming review now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.0, 
      topP: 0.95,
      maxOutputTokens: MAX_OUTPUT_TOKENS,
      thinkingConfig: { thinkingBudget: 0 },
    },
  };

  try {
    let { res, data } = await callGemini(apiKey, payload, signal);

    if (!res.ok && /thinking/i.test(data?.error?.message || '')) {
      delete payload.generationConfig.thinkingConfig;
      ({ res, data } = await callGemini(apiKey, payload, signal));
    }
    
    if (!res.ok) return { ok: false, error: data?.error?.message || 'Gemini API request failed.' };

    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    const raw = parts.filter((p) => !p.thought).map((p) => p.text || '').join('');
    const review = fixCutOff(cleanReview(raw));

    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: persona.id,
        topic: topic.id,
        seo: seo || null,
        open: openingOf(review),
      },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message || 'Request failed.', aborted: e?.name === 'AbortError' };
  }
}

function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length;
    let firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed to generate review draft.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    }
    if (rateLimited(request)) {
      return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, { status: 429 });
    }

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : [])
      .filter((r) => r && typeof r === 'object')
      .slice(-6);

    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);

      const winner = await firstValid(
        Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal))
      );

      clearTimeout(timer);
      controller.abort();

      if (winner.ok) {
        remember(winner.review);
        return NextResponse.json({ review: winner.review, meta: winner.meta });
      }
      lastError = winner.error;
    }

    throw new Error(lastError);
  } catch (error) {
    console.error('API Review Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate review draft.' },
      { status: 500 }
    );
  }
}
