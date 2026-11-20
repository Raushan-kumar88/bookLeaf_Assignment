/**
 * BookLeaf Knowledge Base — the policies the AI must ground its answers in.
 *
 * Cost-awareness: instead of sending this ENTIRE document on every draft call,
 * `knowledgeForCategory()` returns only the slice relevant to the ticket's
 * category. That keeps prompt tokens (and cost) low while still producing
 * accurate, policy-correct replies.
 */

export const TONE_GUIDELINES = `
TONE (always follow):
- Empathetic and professional; authors are partners, not customers to be managed.
- Acknowledge the author's concern before giving solutions.
- Be specific: use the actual numbers, dates, and statuses provided. No vague reassurances.
- If something is BookLeaf's fault (delayed royalty, ISBN error), own it directly.
- If it needs investigation/escalation, give a clear timeline ("within 48 hours").
- End with a clear next step for the author and/or BookLeaf.
- Keep it concise (a short email, not an essay). Do not invent facts.`;

const ROYALTY = `
ROYALTY POLICY:
- 80/20 split: 80% of net profit per book goes to the author.
- Net profit = MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping.
- Royalties are calculated quarterly and paid within 45 days of the quarter ending.
- Minimum payout threshold: 1,000. Below that, it rolls over to the next quarter.
- Payouts go via bank transfer to the account linked in the author's dashboard.
- Authors can see a per-platform royalty breakdown in their dashboard.`;

const ISBN = `
ISBN POLICY:
- Every BookLeaf book gets a unique ISBN under BookLeaf's publisher imprint.
- For an ISBN under the author's own imprint, they must obtain it independently.
- A reported ISBN error (duplicate / wrong book linked) is HIGH priority and is
  escalated to the production team immediately.`;

const PRINTING = `
PRINTING & QUALITY:
- In-house printing (Delhi) handles most orders; overflow goes to Repro India / Epitome Books.
- Standard print turnaround: 5-7 business days from order confirmation.
- For a quality issue (misprint, binding defect, color), BookLeaf arranges a FREE
  reprint after verification. The author may need to share photos of the defective copy.`;

const DISTRIBUTION = `
DISTRIBUTION & AVAILABILITY:
- Books list on Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Store.
- New listings go live within 7-10 business days after publication is complete.
- "Currently Unavailable" usually means a stock sync issue — BookLeaf can trigger a
  re-sync within 24-48 hours.`;

const PRODUCTION = `
PRODUCTION STAGES (in order):
Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting ->
Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Authors are emailed at each stage. Delays usually occur at Cover Design (awaiting
  author approval) or Proofreading (revision rounds).
- Metadata updates (e.g. book description) can be submitted via the dashboard or by
  emailing the team; changes reflect on platforms within 3-5 business days.`;

const COMPANY = `
COMPANY: BookLeaf Publishing is a self-publishing company in India and the US. It
handles cover design, typesetting, ISBN assignment, printing, distribution, and
royalty management. In-house printing/warehouse is in Delhi; print partners are
Repro India and Epitome Books.`;

/** Category -> the single most relevant policy slice. */
const SLICE_BY_CATEGORY = {
  'Royalty & Payments': ROYALTY,
  'ISBN & Metadata Issues': ISBN,
  'Printing & Quality': PRINTING,
  'Distribution & Availability': DISTRIBUTION,
  'Book Status & Production Updates': PRODUCTION,
  'General Inquiry': `${COMPANY}\n${PRODUCTION}`,
};

/** Return the policy text relevant to a ticket category (not the whole KB). */
export function knowledgeForCategory(category) {
  return SLICE_BY_CATEGORY[category] || COMPANY;
}
