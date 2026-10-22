import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Policy",
  description:
    "Kitchen's Worth policies: VAT, delivery, refunds, allergy notice, data handling and payment disclaimers.",
};

/**
 * /policy — plain-language terms. Structured so it is easy for the client to
 * edit and easy for customers to skim.
 */
export default function PolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 leading-relaxed">
      <h1 className="heading-xl">Policy</h1>

      <section className="mt-8">
        <h2 className="heading-md">Pricing and VAT</h2>
        <p className="mt-2">
          All prices displayed on this site are in Nigerian Naira (₦) and are inclusive of 7.5% VAT. The
          delivery fee shown at checkout is separate and is disclosed line-by-line before you confirm.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Delivery</h2>
        <p className="mt-2">
          We currently deliver in {`${"Abuja"}`} across six zones. Delivery fees and ETAs vary by zone and
          are shown before you pay. If our rider cannot reach your address, we'll refund the delivery fee in
          full and either reschedule or convert your order to pick-up.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Cancellations and refunds</h2>
        <ul className="mt-2 space-y-2">
          <li>
            <b>Before kitchen starts:</b> full refund, no questions. Message us on WhatsApp with your KW-code.
          </li>
          <li>
            <b>After kitchen starts but before dispatch:</b> 50% refund or free reschedule within 7 days.
          </li>
          <li>
            <b>After dispatch:</b> no refund on food, but we'll replace anything wrong at no cost if you
            send a photo within 30 minutes of delivery.
          </li>
          <li>
            <b>Monnify card payments:</b> refunds are processed back to the original card within 5 to 10
            working days.
          </li>
          <li>
            <b>Manual bank transfers:</b> refunds sent to the bank account you provide.
          </li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Allergens and food safety</h2>
        <p className="mt-2">
          Our kitchen handles peanuts, shellfish, gluten, eggs, dairy and soy. Every dish is cooked on
          shared surfaces, so we cannot guarantee an allergen-free plate. If you have a serious allergy,
          tell us on WhatsApp before we start and we'll advise honestly on what's safe.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Your data</h2>
        <p className="mt-2">
          When you check out we store your name, phone, address (if delivery) and order history in our
          Supabase database, and share payment details with Monnify (our licensed payment processor). We
          do not sell data or send marketing SMS. You can request deletion of your order history at any
          time via WhatsApp.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Party packs and catering</h2>
        <p className="mt-2">
          Party-pack orders are treated like any other menu item, cancellable before kitchen starts.
          Catering bookings require a 50% deposit to secure the date. Rescheduling a catering booking is
          free up to 72 hours before the event; inside 72 hours the deposit is non-refundable.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="heading-md">Contact</h2>
        <p className="mt-2">
          Any question about this policy: WhatsApp us at <b>07030606021</b> or use the{" "}
          <a href="/contact" className="text-brand-green-dark underline">
            contact page
          </a>
          .
        </p>
      </section>
    </div>
  );
}
