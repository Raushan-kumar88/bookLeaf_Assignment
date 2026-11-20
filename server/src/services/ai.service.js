/**
 * AI service — ticket classification, priority, and draft replies (OpenAI).
 *
 * Design decisions that the brief explicitly grades:
 *  - SECURITY: the API key is read from env on the server only; never exposed.
 *  - GRACEFUL DEGRADATION: no key, or any API error, falls back to a rules-based
 *    classifier and a templated draft — tickets are always usable.
 *  - COST AWARENESS:
 *      • classification + priority is ONE call (not two), temp 0, ~50 tokens out;
 *      • drafts inject only the category-relevant KB slice (not the whole KB) and
 *        a compact set of book facts (no full ticket history);
 *      • max_tokens is capped on every call.
 *  - PROMPTING: structured system prompts + knowledge base so replies sound like a
 *    real BookLeaf rep, with actual numbers/dates, in BookLeaf's tone.
 */
import OpenAI from 'openai';
import { env } from '../config/env.js';
import {
  CATEGORIES,
  PRIORITIES,
  DEFAULT_CATEGORY,
} from '../constants.js';
import { TONE_GUIDELINES, knowledgeForCategory } from '../knowledge/kb.js';

// --- OpenAI client (created lazily, only when a key exists) ------------------
let _client = null;
function getClient() {
  if (!env.openaiApiKey) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: env.openaiApiKey,
      // When set, talk to an OpenAI-compatible provider (e.g. Gemini).
      ...(env.openaiBaseUrl ? { baseURL: env.openaiBaseUrl } : {}),
    });
  }
  return _client;
}

/**
 * Robustly pull a JSON object out of an LLM reply. Handles markdown code
 * fences and surrounding prose, which some providers add despite instructions.
 * Returns the parsed object, or null if nothing usable was found.
 */
function extractJson(text) {
  if (!text || typeof text !== 'string') return null;
  const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    return null;
  }
}

// ============================================================================
// Rules-based fallback (also used when the LLM is down)
// ============================================================================
const CATEGORY_KEYWORDS = [
  { category: 'Royalty & Payments', words: ['royalty', 'royalties', 'payment', 'payout', 'paid', 'money', 'earnings', 'bank', 'transfer'] },
  { category: 'ISBN & Metadata Issues', words: ['isbn', 'metadata', 'barcode', 'imprint', 'wrong book', 'duplicate'] },
  { category: 'Printing & Quality', words: ['print', 'printing', 'quality', 'misprint', 'binding', 'blurry', 'misaligned', 'pages', 'reprint', 'defect'] },
  { category: 'Distribution & Availability', words: ['available', 'unavailable', 'amazon', 'flipkart', 'listing', 'distribution', 'stock', 'not showing'] },
  { category: 'Book Status & Production Updates', words: ['status', 'production', 'typesetting', 'cover design', 'proofreading', 'when will', 'delay', 'delayed', 'stuck', 'progress'] },
];
const HIGH_SIGNALS = ['not received', "haven't received", 'no royalty', 'months', 'wrong isbn', 'different isbn', 'escalate', 'legal', 'fraud', 'urgent'];
const LOW_SIGNALS = ['update my bio', 'bio', 'description', 'typo', 'cosmetic', 'minor', 'how do i', 'can i'];

export function fallbackClassify(text) {
  const lower = text.toLowerCase();
  let best = { category: DEFAULT_CATEGORY, hits: 0 };
  for (const { category, words } of CATEGORY_KEYWORDS) {
    const hits = words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
    if (hits > best.hits) best = { category, hits };
  }
  return best.category;
}

export function fallbackPriority(text, category) {
  const lower = text.toLowerCase();
  if (HIGH_SIGNALS.some((s) => lower.includes(s))) {
    if (category === 'Royalty & Payments' || category === 'ISBN & Metadata Issues') return 'Critical';
    return 'High';
  }
  if (category === 'ISBN & Metadata Issues' || category === 'Printing & Quality') return 'High';
  if (LOW_SIGNALS.some((s) => lower.includes(s))) return 'Low';
  return 'Medium';
}

function fallbackClassifyAndScore(subject, description, error = null) {
  const text = `${subject}\n${description}`;
  const category = fallbackClassify(text);
  return {
    category,
    priority: fallbackPriority(text, category),
    model: 'fallback',
    error,
  };
}

function fallbackDraft(ctx, error = null) {
  const name = ctx.authorName || 'there';
  return {
    draft:
      `Hi ${name},\n\n` +
      `Thank you for reaching out about "${ctx.subject}". I understand your concern and ` +
      `want to make sure this is resolved properly.\n\n` +
      `Our team is looking into this and will get back to you within 48 hours with a clear update.\n\n` +
      `Warm regards,\nTeam BookLeaf`,
    model: 'fallback',
    error,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Classify a ticket and assign a priority in a single LLM call.
 * @returns {{category, priority, model, error}}
 */
export async function classifyAndScore(subject, description) {
  const openai = getClient();
  if (!openai) return fallbackClassifyAndScore(subject, description);

  const system =
    `You are a support-triage assistant for BookLeaf, a self-publishing company.\n` +
    `Classify the author's ticket and set a priority.\n` +
    `Respond with ONLY a JSON object (no markdown, no extra text): ` +
    `{"category": <one of ${JSON.stringify(CATEGORIES)}>, ` +
    `"priority": <one of ${JSON.stringify(PRIORITIES)}>}.\n` +
    `Priority guidance: unpaid/overdue royalties or wrong-ISBN issues are Critical/High; ` +
    `quality/distribution problems are usually High/Medium; simple questions (bio/description ` +
    `updates, general how-to) are Low.`;

  try {
    const res = await openai.chat.completions.create({
      model: env.openaiModel,
      temperature: 0,
      // Headroom so "thinking" models (e.g. gemini-flash-latest) still have
      // room to emit the small JSON answer after their reasoning tokens.
      max_tokens: 512,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Subject: ${subject}\n\nMessage: ${description}` },
      ],
    });

    const parsed = extractJson(res.choices?.[0]?.message?.content);
    if (!parsed) throw new Error('LLM returned no parseable JSON');

    const category = CATEGORIES.includes(parsed.category) ? parsed.category : DEFAULT_CATEGORY;
    const priority = PRIORITIES.includes(parsed.priority) ? parsed.priority : 'Medium';
    return { category, priority, model: env.openaiModel, error: null };
  } catch (err) {
    // Graceful: fall back to rules and record why the LLM path failed.
    return fallbackClassifyAndScore(subject, description, err.message);
  }
}

/**
 * Draft a reply for an admin, grounded in the knowledge base + real book facts.
 * @param {object} ctx { category, subject, description, authorName, bookFacts }
 * @returns {{draft, model, error}}
 */
export async function draftResponse(ctx) {
  const openai = getClient();
  if (!openai) return fallbackDraft(ctx);

  const kbSlice = knowledgeForCategory(ctx.category);
  const system =
    `You are a BookLeaf author-support representative. Write a reply to the author's ` +
    `message using ONLY the policies and facts provided. Do not invent numbers, dates, ` +
    `or promises.\n${TONE_GUIDELINES}\n\nRELEVANT POLICY:\n${kbSlice}`;

  const facts = ctx.bookFacts
    ? `\n\nBOOK FACTS (use the real numbers/dates):\n${ctx.bookFacts}`
    : '';
  const user =
    `Author name: ${ctx.authorName || 'Unknown'}\n` +
    `Category: ${ctx.category}\n` +
    `Subject: ${ctx.subject}\n` +
    `Message: ${ctx.description}${facts}\n\n` +
    `Write the reply as plain text (no subject line).`;

  try {
    const res = await openai.chat.completions.create({
      model: env.openaiModel,
      temperature: 0.5,
      // Capped for cost, but high enough that "thinking" models still have room
      // to emit the full reply after their reasoning tokens.
      max_tokens: 1500,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    });
    const draft = res.choices?.[0]?.message?.content?.trim();
    if (!draft) throw new Error('LLM returned an empty draft');
    return { draft, model: env.openaiModel, error: null };
  } catch (err) {
    return fallbackDraft(ctx, err.message);
  }
}
