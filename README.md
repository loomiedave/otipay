What's built and why:
 - Live, admin-controlled exchange rates — rates aren't hardcoded in the app; they live in the database and update on every user's phone in real time the moment an admin changes them. This is the foundation the whole product depends on, so it was built first.
 - 
 - Rate locked at transfer time — protects the sender from rate changes mid-transaction. Standard practice in remittance, non-negotiable to skip.
 - 
 - Per-corridor fees, independent of rate — because Togo and Benin share a currency but can have different business costs/margins per corridor.
 - 
 - Role-based admin access via the same auth system as the app — no separate identity system to maintain, one source of truth for "who's allowed to do what."

 
What's intentionally not built yet, and why:
 - Transfers/Users admin screens — visible in the nav as "coming soon" on purpose, to show the roadmap, not hide it. Rates had to work first because every other feature (sending money, showing history) depends on rates existing and being trustworthy.
 - 
 - Wallet balances — deliberately excluded. This is a pure transfer model (pay in, recipient collects), which is simpler to build, simpler to reason about for compliance, and matches what an MVP needs to prove the concept.
 - 
 - Rate history / trend charts — not built because there's no real historical data yet to show; wasn't worth faking a chart with placeholder numbers.
