/**
 * Held-out evaluation set.
 *
 * Written as a separate set from the in-app examples and unit tests, and
 * frozen before the first evaluation run: the rules were not tuned against
 * these messages. Caveat: the same author wrote the rules and this set, so
 * results here are likely optimistic. See eval/README.md.
 *
 * All content is fictional. Links use the reserved .example domain or the
 * 192.0.2.0/24 documentation range.
 */
import type { AnalysisMode } from "../src/lib/analysis/types";

export interface LabelledMessage {
  id: string;
  label: "scam" | "legit";
  category: string;
  mode?: AnalysisMode;
  text: string;
}

export const HELDOUT: LabelledMessage[] = [
  // ---------------------------------------------------------------- scams
  { id: "s01", label: "scam", category: "Banking", text: "Your debit card has been temporarily restricted. Confirm your card number and CVV at https://card-unlock-secure.example to restore access today." },
  { id: "s02", label: "scam", category: "Banking", text: "FRAUD TEAM: we stopped a payment of $899. If this wasn't you, reply with the 6 digit code we just sent so we can reverse it." },
  { id: "s03", label: "scam", category: "Delivery", text: "Your parcel is waiting at the depot. Customs charge of 2.40 GBP must be paid: http://192.0.2.71/pay. Unpaid items are destroyed after 48 hours." },
  { id: "s04", label: "scam", category: "Delivery", text: "Delivery attempt failed. Update your address and pay the handling fee here: bit.ly/3pkg-fix" },
  { id: "s05", label: "scam", category: "Tax", text: "Tax Office: You are eligible for a refund of 312.50. To receive it, submit your bank account details and date of birth via the secure form." },
  { id: "s06", label: "scam", category: "Tax", text: "FINAL WARNING from the revenue service. You owe unpaid tax. Pay immediately with Google Play gift cards or a warrant will be issued for your arrest." },
  { id: "s07", label: "scam", category: "Jobs", text: "Hiring now! Remote product reviewer. Earn $350 per day from your phone, no experience required. Message me on Telegram to start." },
  { id: "s08", label: "scam", category: "Jobs", text: "Your application was approved. Before onboarding, please pay the training fee of $79 for your starter kit. It will be refunded with your first salary." },
  { id: "s09", label: "scam", category: "Family", text: "Hi mum, it's me, I dropped my phone in the sink so this is my new number. Can you send money for a new one? I'll pay you back, can't talk right now." },
  { id: "s10", label: "scam", category: "Family", text: "Grandpa, I'm in trouble and need bail money. Please don't tell mom and dad. My lawyer will tell you how to send it in bitcoin." },
  { id: "s11", label: "scam", category: "Tech support", text: "Microsoft Security: your computer is infected. Call our support line and install TeamViewer so a technician can remove the virus immediately." },
  { id: "s12", label: "scam", category: "Accounts", text: "Your mailbox storage is full and incoming mail will be deleted within 24 hours. Verify your login credentials at https://mail-quota-update.example" },
  { id: "s13", label: "scam", category: "Accounts", text: "Instagram notice: your account will be disabled for copyright violation. Appeal now at https://lnstagram-appeal.example or lose access permanently." },
  { id: "s14", label: "scam", category: "Prizes", text: "You've won a $1000 shopping voucher! Claim your prize before midnight, just pay the small delivery fee." },
  { id: "s15", label: "scam", category: "Prizes", text: "Congrats! Your number was selected in our lucky draw. To release the jackpot send your full name, home address and ID card photo." },
  { id: "s16", label: "scam", category: "Workplace", text: "This is the CEO. I need you to process an urgent wire transfer to a new supplier today. Keep this confidential until the deal is announced." },
  { id: "s17", label: "scam", category: "Workplace", text: "IT helpdesk here. We are migrating accounts tonight. Reply with your password so we can move your files before the deadline." },
  { id: "s18", label: "scam", category: "Utilities", text: "Your electricity will be disconnected in 2 hours due to an overdue bill. Pay now by calling this number. Do not contact the office, they are closed." },
  { id: "s19", label: "scam", category: "Marketplace", text: "I'll buy your sofa. I sent too much by mistake, please refund the extra $300 by gift card and I'll arrange pickup." },
  { id: "s20", label: "scam", category: "Rental", text: "The flat is still available. I'm abroad so you can't view it, but send the security deposit of $800 by wire transfer and I will mail you the keys." },
  { id: "s21", label: "scam", category: "Investment", text: "Exclusive crypto investment opportunity: guaranteed 20% weekly profit. My mentor is a trader with insider tips. Limited spots!" },
  { id: "s22", label: "scam", category: "Subscription", text: "Your streaming subscription payment failed. Update your billing details at http://stream-billing-verify.example within 12 hours to avoid suspension." },
  { id: "s23", label: "scam", category: "Loans", text: "Pre-approved loan of $5,000! No credit check. Pay a processing fee of $49 to receive the funds today." },
  { id: "s24", label: "scam", category: "Charity", text: "Disaster relief appeal: donate now with bitcoin to help families. Act fast, every hour counts." },
  { id: "s25", label: "scam", category: "Accounts", text: "Someone tried to log in to your account. To secure it, share the verification code sent to your phone with our agent." },
  { id: "s26", label: "scam", category: "Shopping", text: "Order #48211 could not be shipped. Confirm your payment card details at https://shop-orders.example@192.0.2.33/confirm" },
  { id: "s27", label: "scam", category: "Tech support", text: "Your phone has 3 viruses! Download the cleaner app from https://phone-clean.example/cleaner.apk now." },
  { id: "s28", label: "scam", category: "Government", text: "Government benefit scheme: you have been selected for a cash grant. Provide your national ID number and bank details to claim." },
  { id: "s29", label: "scam", category: "Romance", mode: "conversation", text: [
    "Liam: Hello beautiful, I saw your profile and had to say hi",
    "Me: Hi!",
    "Liam: You seem so kind. I'm an engineer on an oil rig, it's lonely here",
    "Liam: Good morning dear, I was thinking about you all night",
    "Liam: I feel so connected to you already",
    "Liam: My bank card is blocked on the rig. Could you send $500 in gift cards so I can pay my fees? I'll pay you back when I'm home",
  ].join("\n") },
  { id: "s30", label: "scam", category: "Investment", mode: "conversation", text: [
    "Grace: Hi Tom, are we still meeting at 6?",
    "Me: I think you have the wrong number",
    "Grace: Oh sorry! Nice to meet you anyway. Do you live in the city?",
    "Grace: How was your day? I just finished at the office",
    "Grace: I do some trading on the side, my aunt is an analyst",
    "Grace: You should try it, the platform gave me 15% daily returns. Just deposit $300 to start, I'll show you",
  ].join("\n") },
  { id: "s31", label: "scam", category: "Jobs", mode: "conversation", text: [
    "Recruiter: Hello, we found your CV online. Are you looking for part-time work?",
    "Me: Maybe, what is it?",
    "Recruiter: You like and rate products online. It's easy, 1 hour a day",
    "Recruiter: Today you earned $45 in commission, great work!",
    "Recruiter: To unlock the next task level you need to top up $150 to your work account",
  ].join("\n") },
  { id: "s32", label: "scam", category: "Marketplace", mode: "conversation", text: [
    "Buyer: Hi, is the bike still for sale?",
    "Me: Yes",
    "Buyer: Great, I'll pay full price. Can we continue on WhatsApp?",
    "Buyer: I paid through the courier service. Click the link and enter your card number to receive the money: https://courier-payout.example",
  ].join("\n") },
  { id: "s33", label: "scam", category: "Banking", text: "Dear customer, your account is on hold. Click the link to verify your identity: https://secure-banking-login.example" },
  { id: "s34", label: "scam", category: "Delivery", text: "We tried to deliver your package. Schedule redelivery at www.redeliver-now.example" },
  { id: "s35", label: "scam", category: "Accounts", text: "Your Apple ID was used to sign in on a new device. If this wasn't you, visit https://apple-id-locked.example to unlock." },
  { id: "s36", label: "scam", category: "Family", text: "Hey it's your cousin, I'm stuck abroad and lost my wallet. Can you transfer $200 to my friend's account? I'll explain later." },
  { id: "s37", label: "scam", category: "Prizes", text: "Your survey reward is ready. Claim your free iPhone now." },
  { id: "s38", label: "scam", category: "Jobs", text: "Congratulations, you have been selected for a data entry job. Send a copy of your passport and pay the registration fee to confirm." },
  { id: "s39", label: "scam", category: "QR", text: "Parking fine notice: unpaid parking penalty. Scan the QR code and pay within 24 hours to avoid court action." },
  { id: "s40", label: "scam", category: "Subtle", text: "Hi, it's Jordan from the housing office. Could you confirm your new move-in date and send the deposit to the account below when you get a moment? Thanks!" },

  // ---------------------------------------------------------------- legit
  { id: "l01", label: "legit", category: "OTP", text: "482913 is your Northwind verification code. It expires in 10 minutes. Do not share this code with anyone." },
  { id: "l02", label: "legit", category: "OTP", text: "Your login code is 7731. If you didn't request this, you can ignore this message. We will never call you to ask for it." },
  { id: "l03", label: "legit", category: "Banking", text: "Northwind Bank: A payment of $42.10 to City Grocers was made with your card ending 4421. Not you? Call the number on the back of your card." },
  { id: "l04", label: "legit", category: "Banking", text: "Your monthly statement is now available in the Northwind app." },
  { id: "l05", label: "legit", category: "Delivery", text: "Your order has shipped! Track it at https://www.shop.example/orders/48211. Estimated delivery: Friday." },
  { id: "l06", label: "legit", category: "Delivery", text: "QuickParcel: your package was delivered to your front door at 14:32. Photo available in the app." },
  { id: "l07", label: "legit", category: "Appointments", text: "Reminder: your appointment with Dr. Patel is tomorrow at 9:15 AM. Reply YES to confirm or call 555-0134 to reschedule." },
  { id: "l08", label: "legit", category: "Marketing", text: "Last chance! Our autumn sale ends tonight at midnight. Up to 40% off jackets in store and online." },
  { id: "l09", label: "legit", category: "Marketing", text: "Your loyalty points are about to expire. Use them before Sunday on your next visit." },
  { id: "l10", label: "legit", category: "Friends", text: "Hey! Are you coming to Priya's birthday dinner on Saturday? Let me know so I can book the table." },
  { id: "l11", label: "legit", category: "Friends", text: "Running 10 minutes late, sorry! Grab us a seat if you get there first." },
  { id: "l12", label: "legit", category: "Friends", text: "Can you send me the notes from today's lecture? I missed the last half hour." },
  { id: "l13", label: "legit", category: "Family", text: "Hi love, dad's flight lands at 6. Can you pick him up from the airport? I'm stuck at work." },
  { id: "l14", label: "legit", category: "Work", text: "Hi team, the client meeting has moved to 3pm. Please review the slides before then." },
  { id: "l15", label: "legit", category: "Work", text: "Reminder: submit your timesheet by Friday so payroll can process it." },
  { id: "l16", label: "legit", category: "University", text: "The library will close early on Thursday for maintenance. Online resources remain available." },
  { id: "l17", label: "legit", category: "University", text: "Your assignment for Data Structures has been graded. View feedback on the course portal." },
  { id: "l18", label: "legit", category: "Rent", text: "Hi, just a reminder that rent for November is due on the 1st as usual. Thanks!" },
  { id: "l19", label: "legit", category: "Utilities", text: "Your electricity bill of $64.20 is ready. It will be paid by direct debit on 15 Nov." },
  { id: "l20", label: "legit", category: "Accounts", text: "You signed in to your account from a new device: Chrome on Windows. If this was you, no action is needed." },
  { id: "l21", label: "legit", category: "Accounts", text: "Your password was changed successfully. If you didn't make this change, reset it from the app's security settings." },
  { id: "l22", label: "legit", category: "Receipts", text: "Thanks for your payment of $12.99. Your subscription renews on 3 December." },
  { id: "l23", label: "legit", category: "Receipts", text: "Payment received. Your order #2231 is being prepared." },
  { id: "l24", label: "legit", category: "Health", text: "Your prescription is ready to collect from Riverside Pharmacy." },
  { id: "l25", label: "legit", category: "Travel", text: "Your train to Leeds departs from platform 4 at 08:12. Have a good journey." },
  { id: "l26", label: "legit", category: "Travel", text: "Check-in is now open for your flight. Check in on our app to choose your seat." },
  { id: "l27", label: "legit", category: "Jobs", text: "Thank you for applying to the summer internship. We'd like to invite you to a video interview next week. Please choose a time using the link in your applicant portal." },
  { id: "l28", label: "legit", category: "Jobs", text: "We're pleased to offer you the position. Your contract and start date details are attached. HR will be in touch about onboarding." },
  { id: "l29", label: "legit", category: "Marketplace", text: "Hi, is the desk still available? I can collect it this evening and pay cash." },
  { id: "l30", label: "legit", category: "Community", text: "Neighbourhood watch: street lights on Elm Road are out tonight. The council has been informed." },
  { id: "l31", label: "legit", category: "School", text: "Parents: school photos are on Tuesday. Please make sure uniforms are clean." },
  { id: "l32", label: "legit", category: "Gym", text: "Your gym membership renews next week. No action needed unless you want to change your plan." },
  { id: "l33", label: "legit", category: "Banking", text: "To keep your account secure, we've updated our app. Please install the latest version from the official app store." },
  { id: "l34", label: "legit", category: "Friends", mode: "conversation", text: [
    "Ana: Hey! How was your weekend?",
    "Me: Good thanks, went hiking",
    "Ana: Nice! Miss you, we should catch up",
    "Ana: Are you free for lunch Thursday?",
    "Me: Yes!",
    "Ana: Great, can you send me the address of that cafe you mentioned?",
  ].join("\n") },
  { id: "l35", label: "legit", category: "Family", mode: "conversation", text: [
    "Mum: Good morning dear",
    "Mum: How was your exam?",
    "Me: It went ok!",
    "Mum: Proud of you. Dad says hi",
    "Mum: Don't forget to call grandma on Sunday",
  ].join("\n") },
  { id: "l36", label: "legit", category: "Work", mode: "conversation", text: [
    "Sam: Morning! Did you see the new rota?",
    "Me: Yes, I'm on Friday",
    "Sam: Cool. Can you cover my Tuesday shift? I'll swap with you",
    "Me: Sure",
  ].join("\n") },
  { id: "l37", label: "legit", category: "Splitting bills", text: "Dinner came to $84 total, so $21 each. Send it whenever, no rush!" },
  { id: "l38", label: "legit", category: "Security", text: "Reminder from IT: phishing emails are circulating. Never share your password, and report suspicious messages using the Report button." },
  { id: "l39", label: "legit", category: "Delivery", text: "Your parcel is out for delivery today between 1pm and 3pm." },
  { id: "l40", label: "legit", category: "Events", text: "Your tickets for the concert on 12 December are confirmed. Doors open at 7pm." },
];
