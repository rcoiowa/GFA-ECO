# ADR-0007: Support Now contacts are configuration pending authorized review

**Status:** Accepted (structure) / **Pending human review (contacts)** · **Date:** 2026-07-29

The escalation ladder order is fixed (grounding → GFA support → support team → warmline →
988 → 911). The specific GFA phone number and warmline listing in
`packages/safety/src/ladder.ts` are placeholders that MUST be verified by Grace For
Addictions leadership before launch. This touches participant safety, so per the
autonomous-decision standard it is explicitly flagged rather than silently decided.
No clinical or emergency-response claims are made anywhere in the UI.
