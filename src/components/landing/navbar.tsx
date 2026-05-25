import Link from "next/link";
import { BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const links = [
    { label: "Platform", href: "#platform" },
    { label: "Intelligence", href: "#intelligence" },
    { label: "Alerts", href: "/alerts" },
    { label: "Voice AI", href: "#voice-ai" },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-sentra-ink/55 backdrop-blur-2xl">
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-sentra-cyan to-sentra-violet shadow-glow">
            <BrainCircuit className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">Sentra AI</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
          {links.map((link) => (
            <a key={link.label} href={link.href} className="transition hover:text-white">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="neon">
            <Link href="/dashboard">Launch OS</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
