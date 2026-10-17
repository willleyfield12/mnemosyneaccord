# Complete station progression author guide

This update implements the six agreed investigation premises using newly authored, self-contained assessment records. The records are gameplay content written for this update, rather than quotations from previously established station history. Review their wording for story continuity before a public launch. No source document or live KV namespace was edited during development.

## Reader route

| Investigation | Checkpoint | Required offering | Access after success |
|---|---|---|---|
| The Interrupted Shift | Deck 6 corridor | Rosemary Tincture, Myrtle Sprig, Turquoise Shard, Honesty Seed Pod Disc | Deck 5 |
| The Divided Witness | Deck 5 corridor | Fluorite Octahedron, Jasmine Night Oil, Ginkgo Biloba Leaf, Periwinkle Vine Cutting | Deck 4 |
| The Broken Relay | Deck 4 command floor | Sacred Lotus Bloom, Garnet Core Facet, Rosemary Tincture, Pure Gold Leaf Flakes | Deck 3 |
| The Erasure Order | Deck 3 corridor | Vetiver Root Essence, Ylang-Ylang Floral Drops, Cinnamon Resin Phial | Deck 2 and Prologue entitlement |
| The Missing Interval | Deck 2 corridor | Polished Jet Nugget, Living Yew Root, Aged Oud / Agarwood Resin, Milkweed Seed Pod, Moss Agate Slice, Cedarwood Resin Block | Deck 1 |
| The Witness Key | Deck 1 corridor | None | Vault Theta descent and Chapter 1 teaser entitlement |

All new grants are immediate after a correct reconstruction. The old emailed-code-shaped preview flow remains only for readers already inside that older first puzzle/code stage. It still uses the existing transmission inbox and does not send external email.

## Source records and solutions

The authoritative definitions are in lib/station-assessments.js. This module contains solutions and is blocked from direct browser requests. Public state returns only the task, source records, answer options, reachable specimen locations, and hints explicitly requested by the reader.

1. Interrupted Shift: D-17, S-04 and C-09 jointly imply door → arrival → restart → message. The three adjacent precedence relationships determine exactly one permutation of four events.
2. Divided Witness: the wall clock is six minutes fast. Wall time 14:12 means station time 14:06, before Witness B starts watching at 14:10. Cite Maintenance M-12, which establishes the offset; the door record corroborates the corrected result. No hidden entrance or unspecified clock fault is necessary.
3. Broken Relay: use the displayed undirected graph, start S, finish T, include M, exclude X, and never revisit. S–A–M–D–T is one valid route. Every simple route satisfying those constraints is accepted; the test traverses all simple paths to T and compares acceptance against the explicit requirements.
4. Erasure Order: challenge the assumption that a discrepancy proves fabrication. Either Door audit D-31 or independent Medical receipt R-31 supports continued review. Apply RP-4 retention with uncertainty. Both corroboration options are accepted. This is a reservation, not an acquittal.
5. Missing Interval: corrected times are 19:00 (Comms), 19:05 (Med-Bay), 19:10 (Systems copy), 19:15 (Engineering), 19:20 (Brig). The transfer map explicitly describes five-minute authorised links, not the present-day staircase layout. Receive → stabilise → copy → restore → seal; Systems, Deck 4, 19:10; cite map/calibration with surviving/missing records. Fixed anchors, the sole route and uninterrupted five-minute legs make the reconstruction unique. This is a bounded transfer of a retained packet, not an invented claim about a named character's fate.
6. Witness Key: paired one-glyph substitutions establish ⊙ = WE, ∥ = WITNESS, ◇ = WHAT, ∞ = ENDURES. Read left to right. Accept case differences, spaces and underscores. No audio, image editor or external cipher website is required.

The interface keeps records alongside draft controls, shuffles select options, preserves drafts across closing/reopening and page reloads in the same tab, and requires an explicit final submission. Drafts use sessionStorage with the run ID and assessment number; official progression and hints remain in KV. Route building has Undo/Clear controls and a separate unscored practice example. There is no countdown.

## Catalogue and Hall records

All 44 specimen identities and 66 physical placements remain. Existing placement IDs are preserved, including moved specimens, so retained manifests and old journal item references keep working. Copies with the same specimenId are equivalent evidence; two copies cannot replace two distinct required identities. Exact names and accessible rooms appear in the retained directive and checkpoint.

Four placement changes remove locked-deck dependencies:

- Synthetic Coolant Ampoule: Deck 4 Reactor → Deck 5 Pharma, preserving its ID. It is an accessible industrial decoy before the second gate.
- The Engineering copy of Pure Gold Leaf: Deck 3 → Deck 4 Reactor, alongside clearly described pyrite.
- Vetiver: Deck 2 Brig → Deck 3 Engineering.
- Ylang-Ylang: Deck 2 Armoury → Deck 3 Solar.

Live catalogue, review catalogue and item-placement map match. Existing duplicate placements were not removed as part of this progression change. Individual room objects retain their distinct specimen descriptions and images.

Study Hall releases: four introductory records from arrival; Living Axis/Open Mind after the first assessment; Shared Heart/Living Scripture after the second; Unbroken Seed/Second Form after the relay; Remembered Hours/Enduring Self after the erasure challenge. These are study correspondence records, not newly authored standalone Hall trials. The separate /oblivian/ trial access rules remain separate.

## Save migration

New saves use progressionVersion 2 and internal investigation numbers 1–7; these numbers are not presented as tiers to the reader. Old access levels map as follows: 1 → 1; 2 → 3; 3 → 4; 4 → 5; 5 → 6. This preserves the old physical deck permissions. Existing readers with the old combined 5/4 grant skip the new Divided Witness assessment rather than losing Deck 4. Old current protocol records refresh to the appropriate next directive. Saved journal level tags and protocol IDs migrate consistently; the original text and other records remain available in the completed folders.

An old first puzzle/code stage retains its previous event order and code validation, then joins the new route at Broken Relay. Expired old codes return to that old puzzle so a fresh code can be issued. Previously consumed accepted evidence is restored from journal items. New incorrect submissions preserve inventory, journal and all access. Successful submissions preserve specimens and authenticate identities for later use.

Worked hint 3 records assistance in KV; hints 1/2, experimentation and retries do not remove Unassisted Witness recognition. Each solved assessment archives its previous journal entries automatically, with the solved reconstruction retained as readable text.

## Completion and media

No production descent video, Prologue or Chapter 1 teaser asset was available. Configure DESCENT_VIDEO_URL, PROLOGUE_URL and CHAPTER_ONE_TEASER_URL in Cloudflare Pages. The reward screen is available as soon as Prologue entitlement is earned. Finish time is independent of video availability or successful playback. The browser requires a deliberate Begin descent action, so autoplay blocking cannot interrupt progression. The completion screen can reopen repeatedly.

The finish ledger is private. Session records expire after the existing 30-day TTL; independent completion and finish-run candidates do not. Retaining the email in those private records allows later manual prize verification and contacting an eligible reader under the site's existing consent policy. No new email delivery or public identity publication is implemented. Publishing an opt-in Hall of Fame and fulfilment of physical rewards remain operator tasks.

KV has no atomic compare-and-set/global rank. Concurrent completion writes can race, especially across locations; retaining per-run candidates supports reconciliation, and the interface never claims a guaranteed ordinal prize. Operator verification must deduplicate by email and use a published tie rule. A future atomic ranking service would be needed for reliable instant first/next-three awards. Cookies alone are not proof of distinct human identity or email ownership.

## Verification

Run from repository root with Node.js:

```
node tests/test-complete-progression.mjs
node tests/test-cloudflare-journal.mjs
node tests/test-hall-access.mjs
node tests/test-package-contract.mjs
```

The first test drives the actual middleware with a disposable KV mock and collects reachable specimens through real permitted movement. It covers all six assessments, alternate copies, wrong offerings/puzzles, bypass attempts, preserved evidence, new and legacy saves, old issued/expired codes, assistance persistence, completion replay/deduplication, private identity, reward gates, live/review parity and mathematical solution checks. The old Python preview tests target the superseded server.py and are not the Cloudflare test suite.

Browser checks use the actual middleware with a disposable local KV mock. Check desktop and 390 px mobile layouts, evidence selects, draft reopening, invalid route feedback, successful Deck 3/2 grants, final declaration and reward placeholders. Before public launch, playtest the newly written clues with someone who has not read this guide.
