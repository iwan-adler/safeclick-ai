/**
 * Fictional India-context training messages for the classifier.
 *
 * Why: the public training data (UK/Singapore SMS from the 2000s–2010s) has
 * no Indian transactional alerts, so the first model flagged genuine bank,
 * UPI and delivery messages. These hand-written messages teach it what
 * ordinary Indian SMS look like, plus common Indian scam styles.
 *
 * Training only. Never used for evaluation. All names, numbers, accounts and
 * links are invented; links use the reserved .example domain.
 */

export interface AugmentMessage {
  label: "scam" | "ham";
  text: string;
}

const ham = (text: string): AugmentMessage => ({ label: "ham", text });
const scam = (text: string): AugmentMessage => ({ label: "scam", text });

export const INDIA_AUGMENT: AugmentMessage[] = [
  // Bank and UPI alerts
  ham("Rs.450.00 debited from A/c XX4821 on 03-Nov-26 to VPA ravi.k@okbank (UPI Ref 631204557812). Not you? Call the number on the back of your card."),
  ham("Your A/c XX7710 is credited with Rs.25,000.00 on 01-Nov by NEFT from ACME TECH PVT LTD. Avl Bal Rs.41,236.18"),
  ham("Rs 1,200 sent to Meena Stores via UPI from A/c **3391. UPI Ref No 702233118844. If not done by you, report via the bank app."),
  ham("INR 89.00 spent on Card XX5502 at CAFE BREW on 12-11-2026. Avl limit INR 64,211. To block card, use the official app."),
  ham("Dear Customer, your A/c XX1189 has been debited by Rs.2,150 for Electricity Bill payment. Ref 448812. Thank you for banking with us."),
  ham("Money received! Rs 300 from Arjun S has been added to your wallet. Txn ID 99812345."),
  ham("Your account balance as on 05-Nov is Rs.8,402.55. For details, check the mobile banking app."),
  ham("ATM withdrawal of Rs.2,000 from A/c XX2207 at Andheri West on 06-Nov 18:42. Avl bal Rs.10,115."),
  ham("Auto-debit of Rs.499 for your mobile plan was successful on 07-Nov. Next due date 07-Dec."),
  ham("Your FD of Rs.50,000 has been renewed for 12 months at 7.1% p.a. Maturity date 08-Nov-27."),
  // OTP deliveries (genuine, protective wording)
  ham("482913 is your OTP for login to the bank app. Valid for 5 minutes. Never share your OTP with anyone, including bank staff."),
  ham("OTP for your transaction of Rs.1,250 at ONLINE STORE is 771024. Do not share this OTP with anyone."),
  ham("Your verification code is 5521. Kisi ke saath share na karein."),
  ham("Use 903311 to verify your mobile number on the shopping app. We never ask for this code on calls."),
  // Orders, travel, bills, services
  ham("Your order #OD4419 has been shipped and will be delivered by Thursday. Track it in the app."),
  ham("Your food order is out for delivery. Your delivery partner Ramesh will reach in 12 mins."),
  ham("PNR 4521876630: Train 12951 on 15-Nov, Coach B3, Berth 22 confirmed. Happy journey!"),
  ham("Your electricity bill of Rs.1,834 for Oct is generated. Due date 20-Nov. Pay via the official app or website."),
  ham("Recharge successful! Rs.299 plan activated on 98XXXX1234. Valid till 05-Dec."),
  ham("Your appointment with Dr. Sharma is confirmed for 14-Nov at 11:30 AM at City Clinic, Koregaon Park."),
  ham("Your Aadhaar address update request has been completed. You can download the updated Aadhaar from the official portal."),
  ham("Gas cylinder booking confirmed. Booking No 33218. Expected delivery within 2 days."),
  ham("Your library book 'Data Structures' is due on 18-Nov. Please return or renew at the counter."),
  ham("Reminder: semester fee of Rs.42,000 is due by 30-Nov. Pay through the college ERP portal only."),
  ham("Your parcel from India Post (EM123456789IN) has been delivered at 2:15 PM."),
  ham("Your cab is arriving in 3 mins. Driver: Suresh, KA01AB1234. OTP for the ride: 4412."),
  ham("Thank you for your payment of Rs.649 for broadband. Receipt no 77120."),
  ham("Your mutual fund SIP of Rs.2,000 has been processed on 10-Nov."),
  // Hinglish and English personal / work chats
  ham("Kal class 10 baje hai, notes le aana please"),
  ham("Mummy ne kaha hai shaam ko jaldi ghar aana, mehmaan aa rahe hain"),
  ham("Bhai 500 rupaye bhej de UPI pe, kal wapas kar dunga. Canteen mein card nahi chal raha"),
  ham("Party ke liye 300 rs per head contribution hai, Priya ko bhej dena"),
  ham("Assignment submit ho gaya? Deadline aaj raat 11:59 tak hai"),
  ham("Didi, mera phone charge nahi ho raha, papa ke number pe call karna"),
  ham("Team meeting moved to 4 pm today. Please share your updates in the group before that."),
  ham("Happy Diwali! Wishing you and your family lots of happiness and prosperity"),
  ham("Can you send me the PDF of the lab manual? Mine got deleted"),
  ham("Reached hostel safely. Will call tomorrow morning."),
  ham("Plumber aayega 5 baje, gate khula rakhna"),
  ham("Your rent for November, Rs 12,000, is due on the 5th as usual. Please transfer to the same account. Thanks - Mehta uncle"),
  // Indian scam styles (English, Hinglish, Hindi)
  scam("Dear Customer, your bank KYC has expired. Your account will be blocked today. Update KYC now: http://kyc-update-bank.example"),
  scam("Aapka bank account aaj block ho jayega. Turant KYC update karein is link par: http://ekyc-verify.example"),
  scam("Your electricity connection will be disconnected tonight at 9:30 PM as your previous bill was not updated. Call officer 9XXXXXXX12 immediately."),
  scam("Dear user, your SIM card will be deactivated in 2 hours due to incomplete verification. Press 9 to speak to an executive."),
  scam("Congratulations! You have won Rs.25,00,000 in the KBC lucky draw. To claim, send your name, Aadhaar and bank details on WhatsApp."),
  scam("Badhai ho! Aapko 10 lakh ka inaam mila hai. Processing fee Rs.4,999 jama karein aur paise turant aapke account mein aayenge."),
  scam("Your refund of Rs.4,780 is ready. Scan the QR code to receive the money in your account."),
  scam("Enter your UPI PIN to receive Rs.2,000 cashback in your account. Offer valid for today only."),
  scam("This is a call from the cyber crime department. A case has been registered against your Aadhaar for money laundering. You are under digital arrest. Do not tell anyone."),
  scam("FedEx: your parcel to Taiwan contains illegal items. Call customs officer immediately to avoid legal action."),
  scam("Part time job offer! Earn Rs.3000 daily by liking YouTube videos. Contact HR on Telegram now."),
  scam("Work from home job: complete simple prepaid tasks and earn 30% commission. Message us on WhatsApp to start."),
  scam("Your income tax refund of Rs.15,490 has been approved. Verify your account details to receive it: http://itr-refund.example"),
  scam("To activate your courier delivery please dial *401*9XXXXXXXX08 from your mobile now."),
  scam("Dear customer, your credit card reward points worth Rs.7,250 expire today. Redeem now: http://rewards-redeem.example"),
  scam("Hi Papa, this is my new number. My phone is broken. Please send Rs.15,000 urgently on this UPI ID, will explain later."),
  scam("Your PAN card will be deactivated. Link your PAN with Aadhaar immediately by clicking: http://pan-link.example"),
  scam("Kripya apna OTP batayein taaki aapka refund process ho sake. Yeh bank ki taraf se call hai."),
  scam("आपका खाता आज बंद हो जाएगा। तुरंत केवाईसी अपडेट करें और ओटीपी शेयर करें।"),
  scam("Aapka bijli connection aaj raat kat jayega. Turant is number par call karein: 9XXXXXXX45"),
];
