import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="container flex flex-col justify-between gap-4 text-sm text-white/45 md:flex-row">
        <p>Sentra AI. Autonomous enterprise intelligence for the live web.</p>
        <div className="flex gap-5">
          <Link href="/dashboard" className="hover:text-white">Dashboard</Link>
          <Link href="/chat" className="hover:text-white">AI Chat</Link>
          <Link href="/alerts" className="hover:text-white">Alerts</Link>
        </div>
      </div>
    </footer>
  );
}
