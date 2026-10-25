/**
 * Offline safety guide content. Generic advice avoids phone numbers and URLs,
 * which differ by country and could send someone in distress to the wrong
 * place. The only exceptions are India's official channels (1930,
 * cybercrime.gov.in, Chakshu on sancharsaathi.gov.in), verified against
 * government sources in October 2026 and always labelled as India-specific.
 */

export type GuideIcon = "message" | "user-lock" | "key" | "banknote" | "smartphone" | "life-buoy";

export interface GuideStep {
  title: string;
  detail: string;
}

export interface GuideSection {
  id: string;
  title: string;
  short: string;
  icon: GuideIcon;
  intro: string;
  steps: GuideStep[];
  checklist: string[];
}

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "suspicious-messages",
    title: "Suspicious messages",
    short: "Messages",
    icon: "message",
    intro: "When a message asks you to click, pay, or share something, give yourself a moment before you act.",
    steps: [
      {
        title: "Pause before you respond",
        detail:
          "Pressure is the scammer's main tool. Nothing legitimate is lost by taking ten minutes to check. Put the phone down if you feel rushed.",
      },
      {
        title: "Don't use the contact details in the message",
        detail:
          "Links, phone numbers and reply addresses in a suspicious message may lead to the scammer. Use the official app, a bookmarked website, or a number from your card or a statement.",
      },
      {
        title: "Look at what is being asked",
        detail:
          "Requests for codes, passwords, payment by gift card or cryptocurrency, remote access, or secrecy are strong warning signs regardless of who the sender claims to be.",
      },
      {
        title: "Report and delete",
        detail:
          "Use your messaging app's built-in \"report junk\" or \"report phishing\" option, then delete the message. Your organization or mobile provider may also offer a reporting channel. In India, you can report suspected fraud calls and messages on Chakshu at sancharsaathi.gov.in.",
      },
    ],
    checklist: [
      "I did not click links or call numbers from the message",
      "I checked the request through the official app or website",
      "I reported the message using my app's report option",
      "I deleted the message",
    ],
  },
  {
    id: "account-compromise",
    title: "Account compromise",
    short: "Accounts",
    icon: "user-lock",
    intro: "If you think someone has accessed one of your accounts, act quickly and in order.",
    steps: [
      {
        title: "Change the password from a trusted device",
        detail:
          "Use a device you believe is clean. Choose a new, unique password you have not used anywhere else.",
      },
      {
        title: "Sign out other sessions",
        detail:
          "Most services have a security page listing active sessions or devices. Sign out everything you don't recognise.",
      },
      {
        title: "Turn on two-step verification",
        detail:
          "An authenticator app or security key is stronger than SMS codes, but any two-step method is much better than none.",
      },
      {
        title: "Check recovery settings and forwarding rules",
        detail:
          "Attackers often add their own recovery email, phone number or mail-forwarding rule so they can return later. Remove anything you didn't set up.",
      },
      {
        title: "Warn your contacts",
        detail:
          "If the account was used to message others, let friends and colleagues know through another channel not to trust recent requests.",
      },
    ],
    checklist: [
      "Changed the password to a new unique one",
      "Signed out all other sessions and devices",
      "Enabled two-step verification",
      "Reviewed recovery email, phone and forwarding rules",
      "Changed the same password anywhere else I reused it",
      "Warned contacts if messages were sent from my account",
    ],
  },
  {
    id: "otp-passwords",
    title: "OTP & password protection",
    short: "Codes",
    icon: "key",
    intro: "One-time codes and passwords are keys to your accounts. Treat them like the keys to your home.",
    steps: [
      {
        title: "Never share a one-time code",
        detail:
          "A code sent to you is for you to type into a site or app you opened yourself. Anyone asking you to read it out is trying to get into your account.",
      },
      {
        title: "Use a unique password for every important account",
        detail:
          "A password manager can generate and remember them for you. Reused passwords let one breach unlock many accounts.",
      },
      {
        title: "Never dial codes someone sends you",
        detail:
          "Codes like *401* or **21* can forward your calls and OTP messages to another phone. If you dialled one at a stranger's request, dial ##002# to cancel call forwarding, then contact your mobile operator.",
      },
      {
        title: "Read the code message carefully",
        detail:
          "Many code messages say what the code is for (\"to log in\", \"to approve a payment\"). If you didn't start that action, someone else did.",
      },
    ],
    checklist: [
      "I never read codes out to callers or send them in chat",
      "I never dial * or # codes that a caller or message asks me to",
      "My email and banking passwords are unique",
      "I use a password manager or another safe way to store passwords",
      "Two-step verification is on for email and banking",
    ],
  },
  {
    id: "financial-fraud",
    title: "Suspected financial fraud",
    short: "Money",
    icon: "banknote",
    intro: "If you paid or shared financial details, speed matters. Your bank may be able to stop or reverse a payment if told quickly.",
    steps: [
      {
        title: "Contact your bank or card provider immediately",
        detail:
          "Use the number on the back of your card, in the official app, or on a statement, not one from the suspicious message. Ask them to block the card and review recent transactions.",
      },
      {
        title: "Write down what happened",
        detail:
          "Note dates, amounts, how you paid, and any names, numbers or links used. Take screenshots before deleting anything.",
      },
      {
        title: "Report it through official channels",
        detail:
          "In India, call the National Cyber Crime Helpline 1930 as soon as possible and file a complaint at cybercrime.gov.in; quick reports give the best chance of stopping the money. Elsewhere, find your national fraud or cybercrime reporting service through an official government website you search for yourself.",
      },
      {
        title: "Watch for follow-up scams",
        detail:
          "Victims are sometimes contacted by \"recovery services\" offering to get money back for a fee. These are usually scams too.",
      },
    ],
    checklist: [
      "Called my bank using an official number",
      "Blocked or replaced affected cards",
      "Saved screenshots and notes of what happened",
      "Reported through an official fraud reporting channel (in India: 1930 / cybercrime.gov.in)",
      "I will ignore anyone offering paid \"money recovery\"",
    ],
  },
  {
    id: "lost-device",
    title: "Lost or stolen device",
    short: "Devices",
    icon: "smartphone",
    intro: "A missing phone can expose your messages, codes and accounts. These steps limit the damage.",
    steps: [
      {
        title: "Locate, lock or erase it remotely",
        detail:
          "Use your phone maker's find-my-device service from another device to lock it, show a contact message, or erase it if it can't be recovered.",
      },
      {
        title: "Contact your mobile provider",
        detail:
          "Ask them to suspend the SIM so codes sent by SMS cannot be received by someone else.",
      },
      {
        title: "Secure key accounts",
        detail:
          "Change passwords for email and banking, and sign the lost device out of your accounts from another device.",
      },
      {
        title: "Tell your bank",
        detail: "If banking or payment apps were on the device, let your bank know so they can watch for unusual activity.",
      },
    ],
    checklist: [
      "Locked or erased the device remotely",
      "Asked my mobile provider to suspend the SIM",
      "Signed the device out of email and social accounts",
      "Changed important passwords",
      "Told my bank if payment apps were installed",
    ],
  },
  {
    id: "personal-safety",
    title: "Personal safety & emergencies",
    short: "Safety",
    icon: "life-buoy",
    intro:
      "Some scams and online threats affect your physical safety or wellbeing. You do not have to handle them alone.",
    steps: [
      {
        title: "If you are in immediate danger",
        detail:
          "Contact your local emergency number straight away. Save it in your phone now so you don't need to look it up in a crisis.",
      },
      {
        title: "If you are being threatened or blackmailed online",
        detail:
          "Do not pay or send anything more. Stop responding, keep screenshots as evidence, block the account, and tell someone you trust. Contact local police through their official non-emergency channel.",
      },
      {
        title: "Save trusted contacts in advance",
        detail:
          "Keep your bank's official number, a trusted friend or family member, and your local emergency number in your contacts so you don't rely on numbers from messages.",
      },
      {
        title: "Look after yourself",
        detail:
          "Being targeted by a scam is upsetting, and it happens to careful people too. Talking to someone you trust or a support service in your area can help.",
      },
    ],
    checklist: [
      "Saved my local emergency number in my phone",
      "Saved my bank's official contact number",
      "Chose a trusted person to call if something goes wrong",
      "I know how to block and report an account in my main apps",
    ],
  },
];
