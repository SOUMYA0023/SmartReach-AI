"""Seed marketing intelligence knowledge base with realistic entries."""

import asyncio

from sqlalchemy import func, select

from app.database import async_session_factory
from app.knowledge_model import KnowledgeDocument
from app.rag.embedder import GeminiEmbedder
from app.rag.rag_service import RAGService

SEED_ENTRIES = [
    {
        "title": "Post-purchase engagement sequence",
        "category": "retention",
        "content": "Send a thank-you message within 2 hours of purchase, followed by a care guide on day 3 and a review request on day 10. Customers who receive this sequence show 34% higher repeat purchase rates within 90 days.",
    },
    {
        "title": "Loyalty milestone celebrations",
        "category": "retention",
        "content": "Trigger personalised messages at order milestones (5th, 10th, 25th purchase). Include the customer's favourite category and a small exclusive perk. VIP retention improves 28% when milestones are acknowledged.",
    },
    {
        "title": "Seasonal re-engagement for active buyers",
        "category": "retention",
        "content": "For Loyal segment customers, send early access to seasonal collections 48 hours before public launch. Frame messaging around 'you shopped this category last season' with specific product references.",
    },
    {
        "title": "90-day dormancy win-back offer",
        "category": "winback",
        "content": "Customers inactive for 90+ days respond best to a single compelling offer: 15-20% discount with 7-day expiry. Lead with emotional hook ('We miss you') not discount. Include their last purchased product category.",
    },
    {
        "title": "At-risk customer intervention",
        "category": "winback",
        "content": "At Risk customers (declining frequency) should receive a 'check-in' message before a discount. Ask if sizing/fit was an issue. Offer free exchange or styling consultation. Converts 12% without margin erosion.",
    },
    {
        "title": "High-value dormant reactivation",
        "category": "winback",
        "content": "Dormant customers with lifetime spend above ₹10,000 warrant VIP treatment: personal note from brand founder, exclusive preview access, and concierge support number. Recovery rate is 3x vs standard win-back.",
    },
    {
        "title": "Tiered loyalty program messaging",
        "category": "loyalty",
        "content": "Communicate tier status clearly: Silver (₹5K spend), Gold (₹15K), Platinum (₹50K). Each tier unlocks tangible benefits. Remind customers how close they are to next tier — proximity messaging drives 22% uplift in AOV.",
    },
    {
        "title": "VIP early access campaigns",
        "category": "loyalty",
        "content": "VIP customers expect exclusivity. Offer 24-hour early access to drops, limited edition colourways, and birthday month double points. Never send VIPs the same creative as mass campaigns.",
    },
    {
        "title": "Complementary product recommendations",
        "category": "cross_sell",
        "content": "After skincare purchase, recommend matching serum within 14 days. After footwear, suggest socks/care kit. Cross-sell messages referencing the original purchase convert 2.4x better than generic recommendations.",
    },
    {
        "title": "Bundle offers for single-category buyers",
        "category": "cross_sell",
        "content": "Customers who only buy from one category are prime cross-sell targets. Offer curated bundles at 10% bundle discount. 'Complete your routine' framing outperforms 'Buy more' by 40%.",
    },
    {
        "title": "Premium upgrade pathways",
        "category": "upsell",
        "content": "When a customer buys mid-tier product, follow up with premium version benefits: longer durability, better materials, extended warranty. Use comparison framing, not hard sell. 8% upgrade rate on email, 5% on SMS.",
    },
    {
        "title": "Subscription upsell for repeat buyers",
        "category": "upsell",
        "content": "Customers with 3+ purchases of consumables (coffee, skincare, supplements) are ideal for subscribe-and-save. Offer 15% subscription discount with flexible skip/cancel. Reduces churn by creating habit loops.",
    },
    {
        "title": "WhatsApp conversational commerce",
        "category": "whatsapp",
        "content": "Keep WhatsApp messages under 160 characters. Use customer's first name, one clear benefit, single CTA button. Best send times: 10am-12pm and 6pm-8pm IST. Avoid promotional tone — write like a friend texting.",
    },
    {
        "title": "WhatsApp cart abandonment recovery",
        "category": "whatsapp",
        "content": "Send cart reminder within 1 hour with product image thumbnail. Message: 'Hey {name}, your {product} is waiting! Tap to complete order.' Include direct checkout link. Recovery rate: 18-25% for fashion D2C.",
    },
    {
        "title": "Email subject line formulas",
        "category": "email",
        "content": "Top-performing subject patterns: curiosity gap ('The one thing VIPs do differently'), personalisation ('{name}, your size is back'), urgency with authenticity ('24hrs left — restock ends tonight'). Keep under 50 characters for mobile.",
    },
    {
        "title": "Email body structure for D2C",
        "category": "email",
        "content": "Structure: hero image → one-sentence value prop → 2-3 benefit bullets → single CTA button → social proof (review snippet). Mobile-first: 14px minimum font, 44px tap targets. Plain-text fallback always included.",
    },
    {
        "title": "SMS brevity and compliance",
        "category": "sms",
        "content": "SMS must be under 160 characters including opt-out ('Reply STOP to unsubscribe'). Lead with brand name in brackets. One CTA only — use short links. Best for flash sales and delivery updates. Open rate 95%+ but use sparingly (max 2/month).",
    },
    {
        "title": "RCS rich card patterns",
        "category": "rcs",
        "content": "RCS supports carousel cards with images, action buttons, and suggested replies. Use for product launches: 3-card carousel with hero product, styling tip, and shop-now button. Fallback to SMS for non-RCS devices automatically.",
    },
    {
        "title": "Fashion D2C tone and messaging",
        "category": "fashion",
        "content": "Fashion messaging should feel aspirational yet accessible. Use seasonal colour stories, influencer-style flat lays, and size-inclusive language. Reference trends ('coastal grandmother aesthetic') but tie to your specific products.",
    },
    {
        "title": "Beauty brand personalisation",
        "category": "beauty",
        "content": "Beauty customers respond to skin-type personalisation and ingredient transparency. Reference their skin concern from quiz data. 'Formulated for your combination skin' outperforms generic 'new launch' by 35% in CTR.",
    },
    {
        "title": "Specialty coffee subscription messaging",
        "category": "coffee",
        "content": "Coffee subscribers value origin stories and roast profiles. Share farmer partnerships, tasting notes (chocolate, citrus, floral), and brewing tips. 'Your Ethiopian Yirgacheffe ships tomorrow' creates anticipation and reduces skip rates.",
    },
    {
        "title": "General D2C retail patterns",
        "category": "retail",
        "content": "Universal D2C principles: personalise with purchase history, respect channel preferences, test send times by cohort, always include social proof, and measure incrementality not just opens. A/B test one variable at a time.",
    },
    {
        "title": "Retention through community building",
        "category": "retention",
        "content": "Invite Loyal customers to exclusive WhatsApp communities or loyalty app groups. Share styling tips, early feedback requests, and user-generated content. Community members have 2.1x higher annual spend than non-members.",
    },
]


async def seed_if_empty() -> dict:
    async with async_session_factory() as session:
        count = (await session.execute(select(func.count()).select_from(KnowledgeDocument))).scalar_one()
        if count > 0:
            return {"seeded": 0, "message": "Knowledge base already populated"}

        embedder = GeminiEmbedder()
        rag = RAGService(session, embedder)
        seeded = 0
        for entry in SEED_ENTRIES:
            await rag.store_document(entry["title"], entry["category"], entry["content"])
            seeded += 1
        await session.commit()
        return {"seeded": seeded, "message": f"Seeded {seeded} knowledge documents"}


if __name__ == "__main__":
    result = asyncio.run(seed_if_empty())
    print(result)
