"use client";

import { useState } from "react";
import { buildWaLink } from "@/lib/whatsapp";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

/**
 * Catering enquiry form. Sends the enquiry to WhatsApp with a structured
 * body the events desk can quote from. Not stored in DB in v1.
 */
export function CateringEnquiryForm({ waNumber }: { waNumber: string }) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    guests: "",
    venue: "",
    notes: "",
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = [
      `*Catering enquiry at Kitchen's Worth*`,
      `👤 ${form.name}`,
      `📞 ${form.phone}${form.email ? `  ✉️ ${form.email}` : ""}`,
      `📅 Event date: ${form.date}`,
      `👥 Guests: ${form.guests}`,
      `📍 Venue / area: ${form.venue}`,
      form.notes ? `📝 Notes: ${form.notes}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    window.open(buildWaLink(waNumber, msg), "_blank", "noopener,noreferrer");
  };

  return (
    <form onSubmit={submit} className="card flex flex-col gap-3 p-6">
      <Input
        required
        label="Your name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          required
          type="tel"
          label="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <Input
          type="email"
          label="Email (optional)"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          required
          type="date"
          label="Event date"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
        />
        <Input
          required
          type="number"
          min={50}
          label="Guest count (50+)"
          value={form.guests}
          onChange={(e) => setForm({ ...form, guests: e.target.value })}
        />
      </div>
      <Input
        required
        label="Venue / area in Abuja"
        value={form.venue}
        onChange={(e) => setForm({ ...form, venue: e.target.value })}
      />
      <Textarea
        rows={4}
        label="Menu preferences or notes"
        value={form.notes}
        onChange={(e) => setForm({ ...form, notes: e.target.value })}
      />
      <Button type="submit" size="lg" variant="green" className="mt-2 w-full">
        Send enquiry via WhatsApp
      </Button>
      <p className="muted text-xs">
        Opens WhatsApp with your enquiry typed out, no data leaves your device.
      </p>
    </form>
  );
}
