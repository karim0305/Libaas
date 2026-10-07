import Link from 'next/link';
import { TERMS_UPDATED, TERMS_VERSION } from '@/lib/terms';

export const metadata = { title: 'Terms & Conditions – Libaas' };

const sections: { title: string; body: string[] }[] = [
  { title: 'About Libaas', body: [
    'Libaas is an online advertising and listing platform. It lets independent clothing shops (“Shops”) advertise their products, and lets visitors (“Customers”) discover those products and place orders with the Shops.',
    'Libaas is not the seller, maker, supplier, warehouse or delivery company of any product. Every sale is a contract between the Customer and the Shop only. Libaas is not a party to that contract.',
  ] },
  { title: 'Accounts', body: [
    'You must give true and complete information when you register and keep your password private. You are responsible for everything done through your account.',
    'You must be at least 18 years old, or use the platform with a parent or guardian’s permission.',
    'Libaas may suspend or close any account that breaks these Terms or that Libaas reasonably believes is being used for fraud or anything unlawful.',
  ] },
  { title: 'Customers', body: [
    'An order is a request to buy from a Shop. Orders are Cash on Delivery: you pay the full amount, including any delivery charge shown at checkout, when the order reaches you.',
    'Product descriptions, photos, sizes, prices, stock and delivery times are provided by the Shops. Colours may look different on your screen.',
    'If you receive a wrong, damaged or faulty item, or something that is not as described, contact the Shop directly. The Shop is responsible for replacing, repairing or refunding it according to its own policy and the law. Libaas does not guarantee any refund or exchange and is not responsible for product quality, size, delivery delays or non-delivery.',
    'If you refuse to accept an order, are unreachable at delivery, or do not pay, the Shop or its delivery company is responsible for dealing with you and may take any action the law allows. Libaas may also suspend or block accounts that place false orders or repeatedly refuse deliveries.',
  ] },
  { title: 'Shops', body: [
    'You are solely responsible for the products you list and sell: that they are genuine, lawful, safe, correctly described and priced, that you have the right to sell them, and that you have the right to use the photos and text you upload.',
    'You must not list counterfeit, stolen, hazardous, prohibited or unlawful items, or anything that infringes another person’s intellectual property.',
    'You are responsible for packing and sending the correct item, for delivery (using your own staff or a delivery company of your choice), for collecting cash, and for handling returns, exchanges, complaints and refunds with Customers.',
    'If you send a wrong, defective or misdescribed product, you must resolve it with the Customer. Libaas is not liable for it.',
    'If a Customer does not pay or refuses delivery, you or your delivery company bear the loss. Libaas does not pay Shops for unpaid, refused or undelivered orders.',
    'You are responsible for any dispute, loss or claim involving your delivery company, and for your own taxes and legal obligations.',
  ] },
  { title: 'How orders are handled', body: [
    'New orders may be reviewed by Libaas and then referred to the relevant Shop. Referring an order is an administrative step only. It does not mean Libaas accepts any responsibility for the order, the product or the delivery.',
    'The Shop confirms the order and keeps its status accurate (confirmed, processing, shipped, delivered). Marking an order delivered when it has not been delivered is a breach of these Terms.',
    'Libaas may cancel or refuse any order it reasonably suspects is fraudulent, unlawful or in breach of these Terms.',
  ] },
  { title: 'Commission and fees', body: [
    'Libaas charges Shops a commission on the product value of delivered orders. The current rate is shown in the Shop dashboard. Libaas may change the rate, and a new rate applies to orders delivered after the change. Delivery charges are set by each Shop, are kept by the Shop, and carry no commission.',
    'Shops must pay the commission they owe to Libaas in the way and within the time Libaas communicates. Libaas may suspend a Shop that does not pay.',
  ] },
  { title: 'Prohibited conduct and illegality', body: [
    'You must not use Libaas for fraud, fake orders or reviews, money laundering, harassment, selling unlawful goods, or any other illegal activity. You must not attempt to access other users’ data, interfere with the platform, or bypass its rules.',
    'Libaas may remove products, suspend or close accounts without notice, and report unlawful activity to law enforcement. Libaas may share information with authorities when the law requires it or when it reasonably believes it is necessary to prevent harm.',
  ] },
  { title: 'Intellectual property', body: [
    'Shops keep ownership of the photos and descriptions they upload and give Libaas a free, non-exclusive right to display them on the platform and in advertising for the platform. The Libaas name, logo and software belong to Libaas.',
  ] },
  { title: 'No warranty and limits on liability', body: [
    'The platform is provided “as is”. Libaas does not guarantee that any Shop, product, price or description is accurate, or that the platform will always be available or error-free.',
    'To the fullest extent the law allows, Libaas is not liable for any loss or damage arising from dealings between Customers and Shops, including defective, wrong, counterfeit or unsafe products, late or failed delivery, non-payment, refused orders, delivery company conduct, or any indirect or consequential loss.',
  ] },
  { title: 'Indemnity', body: [
    'Shops agree to compensate Libaas for any claim, loss, penalty or cost that arises from their products, listings, orders, breach of these Terms or breach of the law. Customers agree to do the same for losses caused by their breach of these Terms, including fraudulent orders.',
  ] },
  { title: 'Privacy', body: [
    'Libaas collects your name, email, phone number, address and order details to run the platform. When you place an order, the details needed to fulfil it are shared with the Shop and its delivery company. Libaas does not sell your personal data.',
    'When you register, Libaas records that you accepted these Terms, together with the date, time and version.',
  ] },
  { title: 'Suspension and ending', body: [
    'You may stop using Libaas at any time. Libaas may suspend or end your access if you breach these Terms. Sections about liability, indemnity and governing law continue after your account ends.',
  ] },
  { title: 'Changes to these Terms', body: [
    'Libaas may update these Terms. The latest version is always on this page. If you keep using the platform after an update, you accept the new Terms, and Libaas may ask you to accept them again.',
  ] },
  { title: 'Governing law and disputes', body: [
    'These Terms are governed by the laws of Pakistan. Please try to settle any dispute with Libaas by contacting us first. Disputes that cannot be settled are subject to the courts of Pakistan.',
  ] },
  { title: 'Contact', body: ['Questions about these Terms: help@libaas.pk.'] },
];

export default function Terms() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-semibold sm:text-4xl">Terms &amp; Conditions</h1>
      <p className="mt-2 text-sm text-slate-500">Version {TERMS_VERSION} · Last updated {TERMS_UPDATED}</p>
      <p className="mt-5 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800"><b>In short:</b> Libaas advertises Shops’ products. The sale, the product and the delivery are between you and the Shop. If something goes wrong with a product, delivery or payment, you deal with the Shop. Libaas is not responsible for it.</p>
      <div className="mt-8 space-y-8">
        {sections.map((s, i) => (
          <section key={s.title}>
            <h2 className="text-xl font-semibold">{i + 1}. {s.title}</h2>
            <div className="mt-2 space-y-2.5 leading-relaxed text-slate-700">{s.body.map((p) => <p key={p}>{p}</p>)}</div>
          </section>
        ))}
      </div>
      <p className="mt-10"><Link href="/register" className="btn btn-primary">Create an account</Link></p>
    </div>
  );
}
