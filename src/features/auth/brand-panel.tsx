import { motion } from "framer-motion";
import { AlgihazLogo } from "@/components/brand/algihaz-logo";

const RISE = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

/**
 * Left half of the split-screen account pages; hidden below lg, where AuthShell shows a slim
 * header. Purely presentational, so it is hidden from assistive technology: the form comes first.
 */
export function BrandPanel() {
  return (
    <aside
      aria-hidden
      className="relative hidden overflow-hidden bg-login-panel text-login-foreground lg:flex lg:flex-col"
    >
      {/* two soft colour glows; nothing else competes with the text */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(60% 50% at 15% 10%, oklch(0.55 0.16 250 / 0.40), transparent 70%), radial-gradient(50% 45% at 90% 95%, oklch(0.6 0.12 195 / 0.25), transparent 70%)",
        }}
      />

      <motion.div
        className="relative flex flex-1 flex-col justify-between p-12 xl:p-16"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.div variants={RISE}>
          <AlgihazLogo className="h-14 text-login-foreground" />
        </motion.div>

        <div className="max-w-lg">
          <motion.p
            variants={RISE}
            className="text-xs font-medium uppercase tracking-[0.2em] text-sky-300"
          >
            Legal case management
          </motion.p>
          <motion.h2
            variants={RISE}
            className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight xl:text-5xl"
          >
            Every legal matter, from request to resolution.
          </motion.h2>
          <motion.p
            variants={RISE}
            className="mt-5 max-w-md text-base leading-relaxed text-login-muted"
          >
            Submit, assign, track and close cases in one place, with the deadlines and the record to
            back every decision.
          </motion.p>
        </div>

        {/* keeps the headline vertically centred between the logo and the bottom edge */}
        <div aria-hidden className="h-10" />
      </motion.div>
    </aside>
  );
}
