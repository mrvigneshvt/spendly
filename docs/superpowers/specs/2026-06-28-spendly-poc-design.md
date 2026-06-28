# Spendly — POC Design

**Date:** 2026-06-28
**Status:** Approved (design phase)
**Platform:** Android only
**Mode:** Fully offline / on-device

## 1. Overview

Spendly is an Android-only, fully offline React Native (bare CLI) app that maintains
an accurate ledger of income & expenses from two sources — **auto-read bank SMS** and
**manual entry** — and presents a rich, multi-level dashboard to slice spending and
income by category over time.

No spending limits/budgets are in the POC; that is an explicitly deferred "later" layer.

### Goals
- Capture every credit/debit accurately, whether from SMS or manual entry.
- Make the user the gatekeeper: nothing enters the ledger until reviewed and categorized.
- Provide a detailed, drill-downable dashboard over categorized income & spending.
- Keep all data on-device and private, while structuring the data layer so a cloud-sync
  backend can be added later without a rewrite.

### Non-goals (POC)
Spending limits/alerts, cloud sync & accounts, iOS support, multi-currency,
exports/reports, recurring-transaction detection.

## 2. Data Model

### Transaction
| Field | Required | Source |
|---|---|---|
| `id` | ✅ | generated |
| `amount` | ✅ | parsed / manual |
| `type` (`credit` \| `debit`) | ✅ | parsed / manual |
| `date` (timestamp) | ✅ | SMS timestamp / manual |
| `categoryId` | ✅ | user at confirm time |
| `subcategoryId` | ✅ | user at confirm time |
| `note` | ⬜ | manual |
| `payee` / merchant | ⬜ | auto-extracted from SMS when possible |
| `source` / account | ⬜ | derived from SMS sender (e.g. "HDFC") |
| `status` (`pending` \| `confirmed`) | — | lifecycle |
| `origin` (`sms` \| `manual`) | — | provenance |
| `rawSmsRef` | — | for SMS-origin: raw body + sender, kept for re-parse/audit |
| `dedupeHash` | — | for duplicate detection |

### Category (two-level)
- `Category` { id, name, icon?, isDefault }
- `Subcategory` { id, categoryId, name, isDefault }
- Seeded defaults (see §8) **plus** user-created categories and subcategories.
- Categories/subcategories are soft-referenced; deleting a category in use is guarded
  (POC: prevent delete if transactions reference it, or require reassignment).

### Parse rule (user-extensible)
- `ParseRule` { id, senderPattern, bodyRegex, fieldMap (amount/type/payee/balance),
  confidenceWeight, isBuiltIn }
- Built-in rules ship with the app; user-created rules are stored in the DB.

## 3. SMS Ingestion & Parsing

### Permissions
- Request `READ_SMS` + `RECEIVE_SMS` at first launch behind a clear rationale screen
  explaining why and reassuring that data stays on-device.

### Backfill (one-time, on first launch)
- Scan the existing SMS inbox, run each message through the parser, and drop parsed
  candidates into the Pending queue.

### Live (ongoing)
- A native Android `BroadcastReceiver` (with headless JS) catches new incoming SMS and
  parses them in real time into the Pending queue.

### Parser — ordered rule registry (chosen approach)
1. **India-tuned built-in rules:** sender-ID + body regex extracting amount, type,
   payee, balance for common Indian banks/UPI alert formats.
2. **Generic fallback rule:** keyword detection (`credited`/`debited`/`spent`/`received`)
   + amount regex for unknown banks.
3. **User-extensible rules:** "teach Spendly" a new sender/format from an unparsed
   message; stored in the DB and applied on subsequent parses.
4. Each parse carries a **confidence**; low/zero-confidence messages still surface in the
   Pending queue for manual completion.

**Alternatives considered and rejected:**
- Single keyword heuristic only — too brittle for a "detailed" app.
- On-device ML/NLP parsing — overkill for a POC.

## 4. Pending → Confirmed Flow

- Parsed SMS (and low-confidence/unparsed candidates) sit in a **Pending review queue**;
  nothing enters the ledger yet.
- To **confirm**, the user must assign **category + subcategory** (hard gate);
  note/payee are editable and optional.
- Confirm → transaction becomes `confirmed` and joins the ledger + dashboard.
- **Manual entry** uses the same form, starts blank, skips the queue, and is saved
  directly as `confirmed`.
- **Duplicate guard:** because backfill + live can overlap, de-dupe on a `dedupeHash`
  derived from (amount + date/time + sender + body hash) so the same SMS is never logged
  twice.

## 5. Dashboard (rich, multi-level)

- **Period selector:** month / week / custom range.
- **Headline:** total income, total expense, net for the selected period.
- **Breakdown:** category pie/bar chart; **tap a category → drill into subcategories →
  drill into the underlying transactions.**
- **Trend:** income vs expense over time (line/bar across periods).
- **Secondary group-by:** optional payee/merchant view.

## 6. Tech Stack (bare React Native CLI, Android)

- **SMS read:** `react-native-get-sms-android` for inbox scanning.
- **SMS live:** native `BroadcastReceiver` + headless JS task for real-time capture.
- **DB:** SQLite via `op-sqlite` (or `react-native-quick-sqlite`), behind a clean
  data-access layer so a cloud-sync backend can slot in later without touching screens.
- **Navigation:** React Navigation.
- **Charts:** `react-native-gifted-charts` (alt: victory-native).
- **State:** lightweight (Zustand or Context) layered over the DB.

## 7. Architecture / Module Boundaries

- **`sms/`** — permission handling, inbox backfill, live receiver bridge. Emits raw
  SMS records. Knows nothing about transactions or categories.
- **`parser/`** — rule registry + confidence scoring. Input: raw SMS. Output: a draft
  transaction + confidence. Pure/testable, no DB or UI deps.
- **`data/`** — SQLite schema, migrations, and a repository API (transactions,
  categories, parse rules). The single seam for future cloud sync.
- **`features/pending/`** — review queue UI + confirm flow (enforces category gate).
- **`features/ledger/`** — transaction list + manual entry form.
- **`features/dashboard/`** — period selection, aggregation queries, charts, drill-down.
- **`features/categories/`** — manage default + custom categories/subcategories.

Each unit communicates through well-defined interfaces and can be tested independently.

## 8. Default Seed Categories (Indian context)

| Category | Subcategories |
|---|---|
| Food & Dining | Groceries, Dining Out, Food Delivery, Tea/Coffee |
| Transport | Fuel, Cab/Auto, Public Transit, Parking |
| Bills & Utilities | Electricity, Water, Mobile/DTH, Internet, Gas |
| Shopping | Clothing, Electronics, Household, Online |
| Health | Pharmacy, Doctor, Insurance, Fitness |
| Entertainment | Streaming, Movies, Games, Events |
| Housing | Rent, Maintenance, Repairs |
| Education | Fees, Courses, Books |
| Personal Care | Salon, Grooming |
| Income | Salary, Business, Interest, Refund |
| Transfers | UPI Transfer, Bank Transfer, Wallet, ATM Cash |
| Investments | Mutual Funds, Stocks, SIP, Gold |
| Miscellaneous | Other |

Users can add, rename, or extend any of these.

## 9. Open Risks / Notes

- **Background reliability:** Android OEM battery optimizations can throttle the live
  receiver; POC targets best-effort live capture + backfill as the safety net.
- **SMS permission policy:** Play Store restricts `READ_SMS`; not a blocker for a
  sideloaded/personal POC, but relevant before any public release.
- **Parser coverage:** built-in Indian rules cover common banks; the generic fallback +
  user rules absorb the long tail.
