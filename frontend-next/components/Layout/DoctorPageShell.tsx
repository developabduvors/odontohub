import type { ReactNode } from 'react';

interface DoctorPageShellProps {
  badge: string;
  title: string;
  accent: string;
  description: string;
  children: ReactNode;
  contentClassName?: string;
}

const panelBaseClass =
  'rounded-[32px] border border-white/20 bg-white/92 text-[#18213d] shadow-[0_18px_50px_rgba(27,31,92,0.22)]';

export default function DoctorPageShell({
  badge,
  title,
  accent,
  description,
  children,
  contentClassName = '',
}: DoctorPageShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.88),rgba(80,98,238,0.84)_38%,rgba(106,90,225,0.80)_70%,rgba(139,84,214,0.74))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

      <div className="relative z-10 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mx-auto max-w-[1440px] rounded-[40px] border border-white/25 bg-white/10 px-4 py-4 shadow-[0_30px_90px_rgba(39,45,116,0.35)] backdrop-blur-[18px] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
            <section className="rounded-[32px] border border-white/18 bg-white/10 p-6 backdrop-blur-md sm:p-7 xl:sticky xl:top-8">
              <p
                className="text-sm font-semibold uppercase tracking-[0.22em] text-white/80"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {badge}
              </p>
              <h1
                className="mt-4 text-4xl font-bold leading-tight text-white sm:text-5xl"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {title}
              </h1>
              <p
                className="mt-3 text-3xl leading-none text-white/95"
                style={{ fontFamily: '"Great Vibes", cursive' }}
              >
                {accent}
              </p>
              <div className="mt-5 h-px w-32 bg-white/70" />
              <p
                className="mt-5 max-w-sm text-sm leading-7 text-white/82 sm:text-base"
                style={{ fontFamily: '"Space Grotesk", sans-serif' }}
              >
                {description}
              </p>
            </section>

            <section className={`${panelBaseClass} overflow-hidden ${contentClassName}`}>
              {children}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
