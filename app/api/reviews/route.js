import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
const PARALLEL_CALLS = 2;
const MAX_ROUNDS = 2;
const CALL_TIMEOUT_MS = 12000;
const MAX_OUTPUT_TOKENS = 400; 
const HISTORY_SIZE = 60;

/* =====================================================================
   HELPER FUNCTIONS (HEAVY LOGIC)
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

function pickAvoiding(arr, recentIds) {
  const pool = arr.filter((x) => !recentIds.includes(x.id));
  return pick(pool.length ? pool : arr);
}

const LENGTHS = [
  { w: 8,  lines: 1, min: 7,  max: 11, rule: 'ONE short line, 7 to 10 words' },
  { w: 10, lines: 2, min: 13, max: 21, rule: 'TWO lines, 14 to 20 words' },
  { w: 32, lines: 3, min: 21, max: 31, rule: 'THREE lines, 22 to 30 words' },
  { w: 32, lines: 4, min: 30, max: 42, rule: 'FOUR lines, 32 to 40 words' },
];

function chooseLength(recent, minLines = 1) {
  const lens = recent.map((r) => r.lines).filter(Boolean);
  const l1 = lens[lens.length - 1];
  const l2 = lens[lens.length - 2];
  let pool = LENGTHS.filter((x) => x.lines >= minLines);

  const mid = (n) => n === 3 || n === 4;
  if (l1 && !mid(l1)) {
    pool = pool.filter((x) => mid(x.lines)); 
  }
  if (l1 && l1 === l2) {
    const f = pool.filter((x) => x.lines !== l1);
    if (f.length) pool = f;
  }
  return pickWeighted(pool.length ? pool : LENGTHS);
}

/* =====================================================================
   PERSONAS, STYLES & OPENERS (APPLIED STRICTLY TO ALL LANGUAGES)
   ===================================================================== */
const VOICES = [
  { id: 'desi_farmer', text: 'a simple desi farmer, speaks plain and rough, short sentences, highly practical' },
  { id: 'progressive', text: 'a progressive modern farmer, uses practical farming terms like yield and soil health' },
  { id: 'family_farm', text: 'someone who manages a family farm, honest and very careful with farming costs' },
  { id: 'blunt', text: 'a straightforward no-nonsense person, few words, says exactly what benefit they got' },
  { id: 'first_time', text: 'a first-time organic farmer who had no expectations and was surprised by the real result' },
  { id: 'elder', text: 'an older experienced rural farmer, polite, simple words, highly respects the consultant' },
];

function chooseVoice(recent) {
  const last = recent.map((r) => r.voice).filter(Boolean).slice(-3);
  return pickAvoiding(VOICES, last);
}

const STYLES = [
  { id: 'plain', text: 'plain and direct: just say what benefit you got, no flourish, no extra words' },
  { id: 'story', text: 'a tiny story: briefly mention your farming problem, the advice you got, and how it helped' },
  { id: 'detail', text: 'focus heavily on ONE specific detail (like fertilizer or soil testing) that you liked' },
  { id: 'tell-friends', text: 'the kind of thing you would tell another local farmer, ends with a mild natural suggestion' },
  { id: 'contrast', text: 'compare organic farming casually with your old chemical farming, saying why this is better now' },
];

function chooseStyle(recent) {
  const last = recent.map((r) => r.style).filter(Boolean).slice(-3);
  return pickAvoiding(STYLES, last);
}

const OPENERS = [
  { id: 'problem', text: 'start directly with the farming problem you had' },
  { id: 'person', text: 'start directly by mentioning Mr. Nitin Bhujbal or the consultant' },
  { id: 'result', text: 'start directly with the final result (good yield, saved money)' },
  { id: 'mid', text: 'start in the middle of a thought, very casually' },
  { id: 'time', text: 'start with how long you have been following this advice' },
];

function chooseOpener(recent) {
  const last = recent.map((r) => r.opener).filter(Boolean).slice(-3);
  return pickAvoiding(OPENERS, last);
}

/* =====================================================================
   BUSINESS DATA & TOPICS (NITIN BHUJBAL)
   ===================================================================== */
const VISITS = [
  'consulted him for my farm',
  'got soil testing done',
  'started organic farming under his guidance',
  'attended his training session',
];

const SEO_KEYWORDS = [
  'best organic farming advisor in maharashtra',
  'organic farming consultant in pune',
  'nitin bhujbal agriculture expert',
  'sendriya sheti margdarshan',
  'organic fertilizers advice',
];

const TOPICS = {
  organic: {
    id: 'organic',
    text: 'switching to successful organic farming (सेंद्रिय शेती)',
    angles: ['how the crops are healthier now', 'moving away from chemical farming', 'easy to follow organic methods'],
    must: /organic|sendriya|sheti|farming|kheti|jaivik/i,
  },
  planning: {
    id: 'planning',
    text: 'excellent farm planning and management (शेती नियोजन)',
    angles: ['better water management', 'crop rotation planning', 'long term farm sustainability'],
    must: /plan|niyojan|manage|vyavasthapan/i,
  },
  soil: {
    id: 'soil',
    text: 'accurate soil testing and improvement advice (माती परीक्षण)',
    angles: ['understanding what the soil was missing', 'improving soil health naturally'],
    must: /soil|mati|mitti|test|parikshan|supikta/i,
  },
  yield: {
    id: 'yield',
    text: 'significant increase in crop yield and quality (उत्पादनात वाढ)',
    angles: ['better size and quality of the crop', 'higher production than last year'],
    must: /yield|utpadan|crop|fasal|pik|increase|badh|vadh|production/i,
  },
  cost: {
    id: 'cost',
    text: 'reducing farming costs and saving money (खर्चात बचत)',
    angles: ['saving money on expensive chemical fertilizers', 'budget-friendly farming advice'],
    must: /cost|kharch|save|bachat|money|paise/i,
  },
  expert: {
    id: 'expert',
    text: 'great expert guidance and support from Nitin Sir (तज्ञांचे मार्गदर्शन)',
    angles: ['his 17 years of experience', 'how approachable and helpful he is', 'genuine advice without greed'],
    must: /expert|guide|margdarshan|support|advice|salla|consult/i,
  },
  fertilizer: {
    id: 'fertilizer',
    text: 'best advice on using organic fertilizers and pest control (सेंद्रिय खते)',
    angles: ['making fertilizers at home', 'effective organic pest control'],
    must: /fertilizer|khad|khat|pest|organic|sendriya/i,
  },
  govt: {
    id: 'govt',
    text: 'help with agriculture government schemes and certification (सरकारी योजना)',
    angles: ['getting the organic certification easily', 'understanding the paperwork'],
    must: /govt|government|scheme|yojana|certificate|pramanpatra/i,
  },
};

const CHIP_TOPIC = {
  'Organic Farming': 'organic',
  'Farm Planning': 'planning',
  'Soil Testing': 'soil',
  'Crop Yield Increase': 'yield',
  'Cost Saving': 'cost',
  'Expert Guidance': 'expert',
  'Organic Fertilizers': 'fertilizer',
  'Govt Schemes': 'govt',
};

const ALL_TOPICS = Object.keys(TOPICS);

function chooseTopic(selectedChips, recent) {
  if (selectedChips && selectedChips.length > 0) {
    const label = selectedChips[0];
    if (CHIP_TOPIC[label]) return TOPICS[CHIP_TOPIC[label]];
  }
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-3);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

/* =====================================================================
   STRICT MULTILINGUAL FILTERING (ENGLISH, HINDI, MARATHI)
   ===================================================================== */
const BANNED_OPENINGS = [
  // English
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome', 'Outstanding', 'Must visit', 'I recently',
  // Hindi
  'बहुत अच्छा', 'सबसे अच्छा', 'लाजवाब', 'मुझे सच में', 'मैं हाल ही में',
  // Marathi (HEAVY STRICT RULES)
  'उत्तम', 'सर्वोत्तम', 'खूप छान', 'अप्रतिम', 'नक्की भेट द्या', 'खरंच', 'एकदम', 'माझा अनुभव', 'मी अलीकडेच', 'मला खरोखर'
];

const CLICHES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|अविस्मरणीय|शब्दांत सांगता|अतुलनीय|निःसंशयपणे/i;

const DANGLING = new Set([
  'to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh',
  'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that',
  'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki',
  'आणि', 'व', 'की', 'च्या', 'चा', 'ची', 'चे', 'त', 'तर', 'पण', 'परंतु', 'म्हणून', 'जर', 'तरी', 'कारण', 'साठी', // Marathi logic
  'और', 'में', 'से', 'को', 'का', 'है', 'तो', 'पर', 'लिए' // Hindi logic
]);

const HISTORY = [];
const HITS = new Map();

// Unicode logic (\p{L}) makes sure Devanagari is checked properly for duplicates
const openingOf = (text) => text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, '').split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
const wordSet = (t) => new Set(t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 2));

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
    const last = parts[parts.length - 1].toLowerCase().replace(/[^\p{L}]/gu, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^\p{L}]/gu, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

function languageOk(text, language) {
  if (language === 'MARATHI' || language === 'HINDI') {
    return /[\u0900-\u097F]/.test(text); 
  }
  return true; 
}

/* =====================================================================
   PROMPT BUILDER (STRICT MULTILINGUAL INSTRUCTIONS)
   ===================================================================== */
function buildPrompt(body, recent) {
  const language = body.language || 'MARATHI';
  const businessName = String(body.businessName || 'Mr. Nitin Bhujbal').slice(0, 120);
  const category = String(body.category || 'Organic Farming Advisor').slice(0, 200);
  
  const chips = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  
  const length = chooseLength(recent, minLines);
  const voice = chooseVoice(recent);
  const style = chooseStyle(recent);
  const topic = chooseTopic(chips, recent);
  const opener = chooseOpener(recent);
  
  const extraChips = chips.slice(1).map(lbl => CHIP_TOPIC[lbl] ? TOPICS[CHIP_TOPIC[lbl]].text : lbl);
  const angle = chance(0.8) ? pick(topic.angles) : null;
  const visit = chance(0.4) ? pick(VISITS) : null;
  const mentionName = chance(0.45);
  const lowerStart = chance(0.1);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.35) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  let languageBlock = '';
  if (language === 'MARATHI') {
    languageBlock = `LANGUAGE (CRITICAL RULE): You MUST write 100% in PURE, natural, and fluent Marathi (मराठी) using Devanagari script. Speak exactly like a real rural farmer from Maharashtra. 
WARNING: Do NOT mix even a single Hindi word (like "aur", "accha", "hai", "karna", "bahut"). Use native Marathi words like "आणि", "खूप", "चांगले", "आहे". Apply the voice, style, and opener natively in Marathi.`;
  } else if (language === 'HINDI') {
    languageBlock = `LANGUAGE (CRITICAL RULE): You MUST write 100% in pure natural Hindi language (हिंदी) using Devanagari script. Speak like a real rural Indian farmer. Do not mix English or Marathi words. Apply the voice, style, and opener natively in Hindi.`;
  } else {
    languageBlock = `LANGUAGE (CRITICAL RULE): Write in simple, natural English like a rural Indian farmer. Do not use Hindi or Marathi words. Apply the voice, style, and opener natively in English.`;
  }

  const prompt = `${languageBlock}

You are ${voice.text}. You are writing a Google Maps review for this Agriculture Consultant.
Business: ${businessName} | ${category}

REVIEW RULES:
- Main topic: ${topic.text}.
${angle ? `- Angle to focus on (optional): ${angle}.` : ''}
${extraChips.length ? `- ALSO naturally cover these points: ${extraChips.join('; ')}.` : '- Stick to the main topic only.'}
- Voice: write exactly like the persona described above, but in the requested language.
- Shape of the review: ${style.text}.
- Opening: ${opener.text}.
- Length: ${length.rule}. Stay strictly inside this range.
${mentionName ? `- Mention "Nitin Sir" or "Bhujbal Sir" once naturally.` : '- Do not repeat the name.'}
${seo ? `- If it fits naturally, include the exact phrase "${seo}".` : ''}
${visit ? `- You may mention that you ${visit}.` : ''}
${lowerStart ? '- Start the first word in lowercase, like a quick casual phone message.' : ''}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, or native connecting words like "आणि" (Marathi) / "और" (Hindi).
- Never start with any robotic or generic words. Get straight to the point.
- Sound like a real unpolished farmer/customer, not an advertisement. 
- End with a COMPLETE thought. Never stop mid-sentence.
- Output ONLY the final review text. No extra text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, voice, style, topic, opener, seo, language };
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
  const { prompt, length, voice, style, topic, opener, seo, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the farming review now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: {
      temperature: 1.1, 
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
    const words = review.split(/\s+/).filter(Boolean).length;

    if (!review) return { ok: false, error: 'Empty response from Gemini.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Response was cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Review ended mid-sentence.' };
    if (CLICHES.test(review)) return { ok: false, error: 'Robotic phrase used.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening used.' };
    if (!languageOk(review, language)) return { ok: false, error: 'Wrong language script generated.' };
    
    const recentOpenings = recent.map((r) => r.open).filter(Boolean);
    if (tooSimilar(review, recentOpenings)) return { ok: false, error: 'Too similar to an earlier review.' };

    return {
      ok: true,
      review,
      meta: {
        lines: length.lines,
        voice: voice.id,
        style: style.id,
        topic: topic.id,
        opener: opener.id,
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
