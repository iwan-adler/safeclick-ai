# SafeClick AI: Accuracy Report

Generated 2026-10-20 by `npm run eval`. All numbers below come from running the current analysis engine; nothing is hand-edited.

A message counts as **flagged** when SafeClick rates it *Needs caution* or *High concern*.

| Dataset | Positives / negatives | Detection rate | False alarm rate | Precision | High concern (positives) | High concern (negatives) | Speed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Held-out fictional set (scam vs. genuine) | 40 / 40 | **82.5%** (33/40) | **0.0%** (0/40) | 100.0% | 22.5% | 0.0% | 0.37 ms |
| UCI SMS Spam Collection (spam vs. ham) | 747 / 4827 | **6.7%** (50/747) | **0.3%** (15/4827) | 76.9% | 0.0% | 0.0% | 0.04 ms |

## How to read this

- **Detection rate:** share of scam (or spam) messages flagged.
- **False alarm rate:** share of genuine messages flagged. For a tool people may rely on, this matters as much as detection.
- **Speed:** average analysis time per message, in Node.js on the machine that ran the evaluation.

## Held-out fictional set

80 fictional messages (40 scams, 40 genuine) in [heldout.ts](heldout.ts), written separately from the in-app examples and unit tests and frozen before the first evaluation run. The rules were not changed in response to these results.

**Important caveat:** the same author wrote the rules and this set, so these numbers are likely optimistic. Message `s40` is deliberately included: it is the documented limitation from the demo script (a polite, pressure-free payment request).

### By category

| Category | Flagged / total | Label |
| --- | --- | --- |
| Accounts | 4 / 4 | scam |
| Banking | 1 / 3 | scam |
| Charity | 1 / 1 | scam |
| Delivery | 2 / 3 | scam |
| Family | 3 / 3 | scam |
| Government | 1 / 1 | scam |
| Investment | 1 / 2 | scam |
| Jobs | 3 / 4 | scam |
| Loans | 1 / 1 | scam |
| Marketplace | 2 / 2 | scam |
| Prizes | 2 / 3 | scam |
| QR | 1 / 1 | scam |
| Rental | 1 / 1 | scam |
| Romance | 1 / 1 | scam |
| Shopping | 1 / 1 | scam |
| Subscription | 1 / 1 | scam |
| Subtle | 0 / 1 | scam |
| Tax | 2 / 2 | scam |
| Tech support | 2 / 2 | scam |
| Utilities | 1 / 1 | scam |
| Workplace | 2 / 2 | scam |
| Accounts | 0 / 2 | genuine |
| Appointments | 0 / 1 | genuine |
| Banking | 0 / 3 | genuine |
| Community | 0 / 1 | genuine |
| Delivery | 0 / 3 | genuine |
| Events | 0 / 1 | genuine |
| Family | 0 / 2 | genuine |
| Friends | 0 / 4 | genuine |
| Gym | 0 / 1 | genuine |
| Health | 0 / 1 | genuine |
| Jobs | 0 / 2 | genuine |
| Marketing | 0 / 2 | genuine |
| Marketplace | 0 / 1 | genuine |
| OTP | 0 / 2 | genuine |
| Receipts | 0 / 2 | genuine |
| Rent | 0 / 1 | genuine |
| School | 0 / 1 | genuine |
| Security | 0 / 1 | genuine |
| Splitting bills | 0 / 1 | genuine |
| Travel | 0 / 2 | genuine |
| University | 0 / 2 | genuine |
| Utilities | 0 / 1 | genuine |
| Work | 0 / 3 | genuine |

### Missed scams

| Id | Category | Score | Message |
| --- | --- | --- | --- |
| s02 | Banking | 10 | FRAUD TEAM: we stopped a payment of $899. If this wasn't you, reply with the 6 digit code we just sent so we can reverse it. |
| s07 | Jobs | 16 | Hiring now! Remote product reviewer. Earn $350 per day from your phone, no experience required. Message me on Telegram to start. |
| s21 | Investment | 18 | Exclusive crypto investment opportunity: guaranteed 20% weekly profit. My mentor is a trader with insider tips. Limited spots! |
| s33 | Banking | 15 | Dear customer, your account is on hold. Click the link to verify your identity: https://secure-banking-login.example |
| s34 | Delivery | 0 | We tried to deliver your package. Schedule redelivery at www.redeliver-now.example |
| s37 | Prizes | 16 | Your survey reward is ready. Claim your free iPhone now. |
| s40 | Subtle | 0 | Hi, it's Jordan from the housing office. Could you confirm your new move-in date and send the deposit to the account below when you get a... |

### False alarms on genuine messages

| Id | Category | Level | Signals | Message |
| --- | --- | --- | --- | --- |

## UCI SMS Spam Collection

5,574 real SMS messages (747 spam, 4827 ham) collected around 2011, mostly from the UK and Singapore. Source: Almeida, T. & Hidalgo, J. (2011), [UCI Machine Learning Repository](https://archive.ics.uci.edu/dataset/228/sms+spam+collection), CC BY 4.0. Downloaded at evaluation time from https://archive.ics.uci.edu/static/public/228/sms+spam+collection.zip and not redistributed. Individual messages are not reproduced here.

**Caveat:** *spam* is not the same as *scam*. Much of this spam is premium-rate marketing that SafeClick is not designed to flag, so detection is expected to be lower here. The most useful number is the **false alarm rate on ham**: how often SafeClick worries about ordinary personal texts.

Rules most often involved in false alarms on ham:

- `account-threat`: 6
- `personal-info`: 4
- `payment-request`: 3
- `urgency`: 3
- `impersonation`: 3
- `credential-request`: 2

Rules most often firing on flagged spam:

- `unexpected-benefit`: 44
- `urgency`: 36
- `impersonation`: 10
- `payment-request`: 2
- `credential-request`: 2
- `suspicious-link`: 2

Missed spam with no signals at all: 541 of 697.

## Limitations of this evaluation

- Neither dataset is a random sample of the scams people receive today.
- The held-out set is small and was written by the rule author.
- The SMS dataset is old, English-only, and labels spam rather than fraud.
- Results describe pattern matching on text only. They say nothing about links' real destinations or senders' identities.
