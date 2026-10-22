import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 px-4 py-20 text-center">
      <div className="text-6xl">🍽️</div>
      <h1 className="heading-xl">This plate is empty</h1>
      <p className="muted">
        The page you're looking for doesn't exist or has been moved. Try the menu. That one's never empty.
      </p>
      <div className="mt-4 flex gap-3">
        <Link href="/menu" className="btn-primary">
          Browse menu
        </Link>
        <Link href="/" className="btn-secondary">
          Back home
        </Link>
      </div>
    </div>
  );
}
