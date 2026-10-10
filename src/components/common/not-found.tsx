import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

/** A document with a question mark, a magnifying glass, and a few drifting shapes: "not here". */
function LostDocument() {
  const bob = (delay: number, distance = 6) => ({
    animate: { y: [0, -distance, 0] },
    transition: { duration: 3.2, delay, repeat: Infinity, ease: "easeInOut" as const },
  });
  return (
    <svg
      viewBox="0 0 320 240"
      role="img"
      aria-label="A document with a question mark and a magnifying glass"
      className="mx-auto h-auto w-full max-w-xs"
    >
      <ellipse cx="160" cy="212" rx="108" ry="12" className="fill-muted" />
      <circle cx="160" cy="112" r="94" className="fill-primary/10" />
      <circle cx="160" cy="112" r="68" className="fill-primary/10" />

      <motion.g {...bob(0, 5)}>
        <rect
          x="100"
          y="42"
          width="112"
          height="146"
          rx="14"
          className="fill-card stroke-border"
          strokeWidth="2"
        />
        <path
          d="M182 42h16a14 14 0 0 1 14 14v14h-16a14 14 0 0 1-14-14V42Z"
          className="fill-muted"
        />
        <rect x="116" y="62" width="44" height="8" rx="4" className="fill-muted" />
        <rect x="116" y="150" width="80" height="8" rx="4" className="fill-muted" />
        <rect x="116" y="166" width="56" height="8" rx="4" className="fill-muted" />
        <text
          x="156"
          y="132"
          textAnchor="middle"
          fontSize="64"
          fontWeight="700"
          className="fill-primary"
        >
          ?
        </text>
      </motion.g>

      <motion.g {...bob(0.5, 8)}>
        <circle cx="214" cy="146" r="30" className="fill-card/70 stroke-primary" strokeWidth="8" />
        <path
          d="m236 168 24 24"
          className="stroke-primary"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M200 136a16 16 0 0 1 14-9"
          className="stroke-primary/40"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>

      <motion.g {...bob(0.2, 4)}>
        <circle cx="62" cy="86" r="6" className="fill-warning" />
        <circle cx="268" cy="62" r="5" className="fill-info-foreground" opacity="0.7" />
        <path
          d="M82 150v12M76 156h12"
          className="stroke-primary"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M252 112v10M247 117h10"
          className="stroke-warning"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </motion.g>
    </svg>
  );
}

/** The "this page does not exist" content: illustration, a plain message, one way back. */
export function NotFoundContent() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-10 text-center">
      <LostDocument />
      <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        Error 404
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Oops! This page doesn't exist</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The link may be broken, or the page may have been moved. Nothing is wrong with your account.
      </p>
      <Button asChild className="mt-6 h-11 px-6">
        <Link to="/dashboard">
          <LayoutDashboard aria-hidden />
          Go to dashboard
        </Link>
      </Button>
    </div>
  );
}
