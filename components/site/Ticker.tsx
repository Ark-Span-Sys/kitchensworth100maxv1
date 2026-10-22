/**
 * News ticker — the rotating announcement bar from the reference sites.
 * Server component. Renders nothing if there are no messages.
 */
export function Ticker({ messages }: { messages: string[] }) {
  if (!messages?.length) return null;
  const doubled = [...messages, ...messages];
  return (
    <div className="overflow-hidden border-b border-brand-black/8 bg-brand-yellow text-brand-black">
      <div className="flex animate-ticker-scroll whitespace-nowrap py-1.5 text-[11px] font-semibold uppercase tracking-wide">
        {doubled.map((m, i) => (
          <span key={i} className="mx-8 inline-flex items-center gap-2">
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}
