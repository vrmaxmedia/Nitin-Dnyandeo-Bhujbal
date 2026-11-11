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
   BUSINESS PACK (Mr. Nitin Dnyandeo Bhujbal - Organic Farming Advisor)
   ===================================================================== */
const OWNER_NAME = process.env.OWNER_NAME || 'Nitin Bhujbal Sir';

const SEO_KEYWORDS = [
  'best organic farming consultant in maharashtra',
  'organic farming expert in pune',
  'sendriya sheti margdarshan',
  'farm planning and soil testing',
  'agriculture consultant in indapur',
  'increase crop yield organically',
  'nitin bhujbal sir organic farming',
];

// Topics tailored for Farmers / Agriculture
const TOPICS = {
  organic: {
    id: 'organic',
    text: 'switching to organic farming and getting great results without chemicals',
    must: /organic|sendriya|kheti|natural|chemical|sheti|farming/i,
  },
  yield: {
    id: 'yield',
    text: 'huge increase in crop yield, healthy production, and better market price',
    must: /yield|production|utpadan|fasal|crop|growth|profit|munafa|rate|kimat/i,
  },
  soil: {
    id: 'soil',
    text: 'soil testing, improving soil fertility, and land preparation',
    must: /soil|mati|mitti|fertility|test|zamin|zameen|supikta/i,
  },
  planning: {
    id: 'planning',
    text: 'proper farm planning, water management, and setup',
    must: /plan|niyojan|setup|water|pani|management/i,
  },
  guidance: {
    id: 'guidance',
    text: 'expert guidance, training, and continuous support from Nitin sir',
    must: /guide|training|support|help|sir|expert|knowledge|margdarshan|workshop/i,
  },
  cost: {
    id: 'cost',
    text: 'saving costs on farming by avoiding expensive chemical fertilizers',
    must: /cost|save|bachat|kharcha|money|paise/i,
  },
  fertilizer: {
    id: 'fertilizer',
    text: 'advice on organic fertilizers and natural pest control',
    must: /fertilizer|khad|pest|medicine|dawaii|aushadh|jaivik/i,
  },
  schemes: {
    id: 'schemes',
    text: 'help with government agriculture schemes and getting organic certificates',
    must: /scheme|yojana|government|certificate|subsidy/i,
  }
};

const ALL_TOPICS = ['organic', 'yield', 'soil', 'planning', 'guidance', 'cost', 'fertilizer', 'schemes'];

// Chips matched exactly with frontend labels
const CHIPS = {
  'Organic Farming': { id: 'chip_organic', text: 'how organic farming improved the farm and soil', must: /organic|sendriya|kheti|natural|chemical|farming/i },
  'Farm Planning': { id: 'chip_planning', text: 'the complete farm planning and structure provided', must: /plan|niyojan|setup|structure|water/i },
  'Soil Testing': { id: 'chip_soil', text: 'the accurate soil testing and fertility improvements', must: /soil|mati|mitti|fertility|test|zamin/i },
  'Crop Yield Increase': { id: 'chip_yield', text: 'the visible increase in crop yield and farm profit', must: /yield|production|utpadan|fasal|crop|profit|munafa/i },
  'Cost Saving': { id: 'chip_cost', text: 'how his advice led to massive cost savings in farming', must: /cost|save|bachat|kharcha|money/i },
  'Expert Guidance': { id: 'chip_guidance', text: 'the exceptional expert guidance and training received', must: /guide|training|support|sir|expert|margdarshan/i },
  'Organic Fertilizers': { id: 'chip_fertilizer', text: 'excellent advice on organic fertilizers and pest control', must: /fertilizer|khad|pest|jaivik|aushadh/i },
  'Govt Schemes': { id: 'chip_schemes', text: 'assistance with government schemes and organic certification', must: /scheme|yojana|government|certificate/i },
};

// Personas (Farmers)
const PERSONAS = [
  { id: 'young_farmer', text: 'a modern young farmer trying to switch from chemical to organic farming' },
  { id: 'traditional_farmer', text: 'a traditional, experienced farmer who learned new organic techniques from Nitin Sir' },
  { id: 'struggling_farmer', text: 'a farmer who was facing huge expenses and low yield until getting this guidance' },
  { id: 'agri_business', text: 'a farm owner focusing on high-quality organic produce for better market rates' },
  { id: 'workshop_attendee', text: 'a farmer who attended Nitin Sirs training workshop and implemented the ideas' },
];

const WRITING_STYLES = [
  'neat spelling and proper grammar',
  'casual WhatsApp-style typing, relaxed',
  'simple rural tone, straightforward, one tiny spelling slip is fine',
  'heartfelt and thankful tone, speaking directly from experience',
];

const HINGLISH_LEVELS = [
  'mostly Hindi words, with farming terms like kheti, fasal, khad, munafa',
  'Hindi grammar but using terms like farm, yield, soil test mixed in',
  'very simple and direct Hindi mixed with a few English words',
];

const OPENERS = [
  'start by mentioning how many years you have been farming',
  'start with the problems you were facing with chemical farming',
  'start by thanking Nitin Sir directly',
  'start with how your crop production changed',
  'start in the middle of a thought about your soil quality',
  'start with a simple statement about the guidance',
];

const ENDINGS = [
  'end with a heartfelt thanks to Nitin Sir',
  'end by highly recommending his advice to other farmers',
  'end by saying your farming expenses have reduced',
  'end with a short remark about getting better market rates',
  'just stop naturally after your last point, no wrap-up line',
];

const BUYER_LINES = [
  'You took consultation for your farm.',
  'You attended a farm planning session.',
  'You implemented organic techniques recently.',
];

const EXAMPLES = {
  ENGLISH: [
    'Nitin sir is the best organic farming consultant. With his guidance on soil testing and farm planning, my crop yield has increased significantly.',
    'I switched from chemical to organic farming after attending his workshop. The cost savings are huge and the soil fertility is back.',
    'Excellent knowledge about organic fertilizers and govt schemes. Highly recommended for every farmer looking for expert advice.',
  ],
  HINGLISH: [
    'nitin sir ke margdarshan se maine apni kheti puri tarah organic kar di hai. fasal ka utpadan badha hai aur kharcha bahut kam ho gaya hai.',
    'meri zameen ki mitti kharab ho rahi thi chemicals se, sir ke soil testing aur farm planning ne bahut help ki. abhi yield ekdum badhiya hai.',
    'kheti me cost saving aur better market price chahiye toh nitin bhujbal sir se jarur contact karein. best agriculture expert in pune.',
    'sir ki training se organic khad banane ka tarika seekha. fasal bilkul healthy hai aur market me rate bhi accha mil raha hai.',
  ],
};

/* =====================================================================
   HELPER FUNCTIONS (Core Engine)
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
  { w: 12, lines: 1, min: 8,  max: 12, rule: 'ONE short line, 8 to 12 words' },
  { w: 20, lines: 2, min: 14, max: 22, rule: 'TWO lines, 14 to 22 words' },
  { w: 30, lines: 3, min: 22, max: 32, rule: 'THREE lines, 22 to 32 words' },
  { w: 25, lines: 4, min: 32, max: 44, rule: 'FOUR lines, 32 to 44 words' },
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

function chooseTopic(recent) {
  const last = recent.map((r) => r.topic).filter(Boolean).slice(-2);
  const pool = ALL_TOPICS.filter((t) => !last.includes(t));
  return TOPICS[pick(pool.length ? pool : ALL_TOPICS)];
}

function chosenChips(body) {
  const labels = Array.isArray(body.selectedChips) ? body.selectedChips : [];
  return labels.filter((l) => typeof l === 'string' && CHIPS[l]).slice(0, 3).map((l) => ({ label: l, ...CHIPS[l] }));
}

function chooseFrom(list, key, recent, n = 3) {
  const last = recent.map((r) => r[key]).filter((v) => v !== undefined && v !== null).slice(-n);
  const pool = list.filter((x) => !last.includes(x));
  return pick(pool.length ? pool : list);
}

const BANNED_OPENINGS = [
  'Great', 'Best', 'Amazing', 'Excellent', 'Highly recommend', 'Bhai', 'Superb', 'Awesome',
  'Outstanding', 'Fantastic', 'Wonderful', 'Perfect', 'Must visit', 'Trust me', 'Wow', 'Absolutely'
];

const AI_PHRASES = /seamless|hassle[- ]free|top[- ]notch|look no further|go-to|game[- ]changer|one[- ]stop|unparalleled|exceptional|impeccable|commendable|must[- ]visit|highly recommended|hands down|truly|delighted|kudos|—|–/i;

const DANGLING = new Set(['to', 'aur', 'ki', 'ke', 'ka', 'se', 'me', 'mein', 'par', 'pe', 'ko', 'toh', 'and', 'but', 'the', 'a', 'an', 'of', 'in', 'on', 'for', 'with', 'at', 'that', 'so', 'if', 'or', 'because', 'jo', 'jab', 'agar', 'lekin', 'ya', 'jaise', 'kyunki']);

const HINDI_WORDS = new Set(['hai', 'hain', 'nahi', 'nahin', 'bahut', 'bohot', 'bhot', 'mera', 'meri', 'mere', 'mujhe', 'hume', 'aur', 'ki', 'ke', 'ka', 'ko', 'se', 'par', 'pe', 'tha', 'thi', 'kiya', 'mila', 'mil', 'gaya', 'gayi', 'liya', 'wala', 'wale', 'jo', 'kaafi', 'accha', 'acha', 'achha', 'sach', 'yahan', 'yaha', 'kar', 'karke', 'raha', 'rahe', 'rahi', 'laga', 'lagi', 'bilkul', 'ekdum', 'sab', 'kuch', 'koi', 'phir', 'fir', 'bhi', 'toh', 'lekin', 'isliye', 'abhi', 'dekh', 'dekha', 'diya', 'dikhaya', 'samjhaya', 'sahi', 'dukaan', 'dukan', 'aap', 'aapne', 'paise', 'kam', 'jyada', 'zyada', 'badhiya', 'mast', 'yaar', 'mein', 'yeh', 'ye', 'woh', 'wo', 'ne', 'hu', 'hun', 'tak', 'wahan', 'sabse', 'swad', 'khana', 'bhai', 'fasal', 'kheti', 'mitti', 'munafa', 'kharcha']);

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
  return text.replace(/^["'`\s]+|["'`\s]+$/g, '').replace(/\s*\n+\s*/g, ' ').replace(/\s{2,}/g, ' ').replace(/\.{2,}/g, ' ').replace(/\.\s+/g, ', ').replace(/\.+$/g, '').replace(/,\s*,/g, ',').trim();
}

function fixCutOff(text) {
  let parts = text.trim().replace(/[,\-\s]+$/g, '').split(/\s+/);
  while (parts.length > 6) {
    const last = parts[parts.length - 1].toLowerCase().replace(/[^a-z]/g, '');
    if (!DANGLING.has(last)) break;
    parts.pop();
    parts = parts.join(' ').replace(/[,\-\s]+$/g, '').split(/\s+/);
  }
  return parts.join(' ');
}

function looksCutOff(text) {
  const last = text.split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '');
  return DANGLING.has(last) || /[,\-]$/.test(text.trim());
}

function hindiCount(text) {
  return text.toLowerCase().replace(/[^a-z\s]/g, ' ').split(/\s+/).filter((w) => HINDI_WORDS.has(w)).length;
}

function languageOk(text, language, words) {
  const h = hindiCount(text);
  if (language === 'HINGLISH') return h >= Math.max(3, Math.floor(words * 0.2));
  return h <= 2;
}

function startsBanned(text) {
  const t = text.trim().toLowerCase();
  return BANNED_OPENINGS.some((b) => t.startsWith(b.toLowerCase()));
}

/* =====================================================================
   PROMPT BUILDER
   ===================================================================== */
function buildPrompt(body, recent) {
  const language = body.language === 'HINGLISH' ? 'HINGLISH' : 'ENGLISH';
  const businessName = String(body.businessName || 'Mr. Nitin Dnyandeo Bhujbal').slice(0, 120);
  const category = String(body.category || 'Organic Farming Advisor').slice(0, 200);
  const city = String(body.city || 'Indapur, Pune').slice(0, 120);

  let chips = chosenChips(body);
  const minLines = chips.length >= 3 ? 4 : chips.length === 2 ? 3 : 1;
  const length = chooseLength(recent, minLines);
  const persona = choosePersona(recent);
  
  const topic = chips.length
    ? { id: chips[0].id, text: chips[0].text, must: chips[0].must }
    : chooseTopic(recent);
  
  const extraChips = chips.slice(1);
  const opener = chooseFrom(OPENERS, 'opener', recent, 3);
  const ending = chooseFrom(ENDINGS, 'ending', recent, 2);
  const style = pick(WRITING_STYLES);
  const hinglishLevel = pick(HINGLISH_LEVELS);
  const buyerLine = chance(0.6) ? pick(BUYER_LINES) + ' ' : '';

  const longEnough = length.lines >= 3;
  const secondPoint = !extraChips.length && length.lines >= 4 && chance(0.5);
  const mentionName = chance(0.6);
  const useEmoji = chance(0.05);

  const recentSeo = recent.map((r) => r.seo).filter(Boolean).slice(-8);
  const seoPool = SEO_KEYWORDS.filter((k) => !recentSeo.includes(k));
  const seo = chance(0.35) ? pick(seoPool.length ? seoPool : SEO_KEYWORDS) : null;

  const languageBlock =
    language === 'HINGLISH'
      ? `LANGUAGE (MOST IMPORTANT): Write in HINGLISH = Hindi sentences typed in English/Roman letters, like an Indian farmer on WhatsApp. Level: ${hinglishLevel}. Grammar must be Hindi. Words like organic, soil test, farm, yield can stay in English. Never write a full English sentence. Never use Devanagari.`
      : `LANGUAGE (MOST IMPORTANT): Write in simple natural English like an Indian farmer/farm owner. Do not use Hindi words.`;

  const examples = shuffle(EXAMPLES[language]).slice(0, 3).map((e) => `- ${e}`).join('\n');

  const prompt = `${languageBlock}

You are ${persona.text}. ${buyerLine}You are writing a Google Maps review for this Agriculture Consultant.
Business: ${businessName} (${city}) | ${category}

Tone samples from other farmers (only for feel, never copy words):
${examples}

THIS REVIEW:
- Main topic: ${topic.text}. The review must clearly be about this.
${extraChips.length ? `- ALSO naturally cover these points (all of them): ${extraChips.map((c) => c.text).join('; ')}.` : secondPoint ? '- You may add one small extra point at the end.' : '- Stick to the main topic only.'}
- Writing style: ${style}.
- Opening: ${opener}.
${longEnough ? `- Ending: ${ending}.` : ''}
- Length: ${length.rule}. Stay inside this range.
${mentionName ? `- Mention "Nitin sir" or "Nitin Bhujbal sir" once naturally.` : '- Do not repeat the name.'}
${seo ? `- If it fits naturally, include the phrase "${seo}".` : ''}
${useEmoji ? '- One agriculture/plant emoji at the very end is allowed.' : '- No emojis.'}

HARD RULES:
- ONE single paragraph. No line breaks, bullets or title.
- Do NOT use a full stop (.) anywhere. Use commas, "aur"/"and", or just flow.
- Never start with: ${BANNED_OPENINGS.join(', ')}.
- Sound like a real farmer, not an advertisement. Avoid polished marketing words.
- End with a COMPLETE thought. Never stop mid-sentence.
- Output only the review text.`.replace(/\n{3,}/g, '\n\n').replace(/\n\n(- )/g, '\n$1');

  return { prompt, length, persona, topic, extraChips, opener, ending, seo, language };
}

/* =====================================================================
   API HANDLER
   ===================================================================== */
async function callGemini(apiKey, payload, signal) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal }
  );
  const data = await res.json();
  return { res, data };
}

async function attempt(apiKey, body, recent, signal) {
  const built = buildPrompt(body, recent);
  const { prompt, length, persona, topic, extraChips, opener, ending, seo, language } = built;

  const payload = {
    contents: [{ role: 'user', parts: [{ text: `Write the agriculture consultation review now.` }] }],
    systemInstruction: { parts: [{ text: prompt }] },
    generationConfig: { temperature: 1.0, topP: 0.95, maxOutputTokens: MAX_OUTPUT_TOKENS, thinkingConfig: { thinkingBudget: 0 } },
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

    if (!review) return { ok: false, error: 'Empty response.' };
    if (candidate?.finishReason === 'MAX_TOKENS') return { ok: false, error: 'Cut off.' };
    if (looksCutOff(review)) return { ok: false, error: 'Mid-sentence.' };
    if (words > length.max + 8) return { ok: false, error: 'Too long.' };
    if (words < Math.floor(length.min * 0.75)) return { ok: false, error: 'Too short.' };
    if (/[ऀ-ॿ]/.test(review)) return { ok: false, error: 'Devanagari used.' };
    if (AI_PHRASES.test(review)) return { ok: false, error: 'Robotic.' };
    if (startsBanned(review)) return { ok: false, error: 'Banned opening.' };
    if (!languageOk(review, language, words)) return { ok: false, error: 'Wrong language.' };
    if (!topic.must.test(review)) return { ok: false, error: 'Missed topic.' };
    if (extraChips.some((c) => !c.must.test(review))) return { ok: false, error: 'Missed extra chip.' };
    if (tooSimilar(review, recent.map((r) => r.open).filter(Boolean))) return { ok: false, error: 'Too similar.' };

    return {
      ok: true, review,
      meta: { lines: length.lines, voice: persona.id, topic: topic.id, opener, ending, seo: seo || null, open: openingOf(review) },
    };
  } catch (e) {
    return { ok: false, error: e?.name === 'AbortError' ? 'aborted' : e?.message, aborted: e?.name === 'AbortError' };
  }
}

function firstValid(tasks) {
  return new Promise((resolve) => {
    let pending = tasks.length, firstError = null;
    for (const t of tasks) {
      t.then((r) => {
        if (r.ok) return resolve(r);
        if (!r.aborted && !firstError) firstError = r.error;
        if (--pending === 0) resolve({ ok: false, error: firstError || 'Failed.' });
      });
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API Key not configured.' }, { status: 500 });
    if (rateLimited(request)) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

    const recent = (Array.isArray(body.recentLengths) ? body.recentLengths : []).filter((r) => r && typeof r === 'object').slice(-6);
    let lastError = 'Failed to generate review draft.';

    for (let round = 0; round < MAX_ROUNDS; round++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CALL_TIMEOUT_MS);
      const winner = await firstValid(Array.from({ length: PARALLEL_CALLS }, () => attempt(apiKey, body, recent, controller.signal)));
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
    return NextResponse.json({ error: error.message || 'Failed.' }, { status: 500 });
  }
}
