utilities_css = """
/* === TAILWIND SHIM UTILITIES === */
.relative { position: relative; }
.absolute { position: absolute; }
.isolate { isolation: isolate; }
.overflow-hidden { overflow: hidden; }
.z-10 { z-index: 10; }
.z-20 { z-index: 20; }
.hidden { display: none !important; }
.block { display: block; }
.inline-flex { display: inline-flex; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1 1 0%; }
.shrink-0 { flex-shrink: 0; }
.items-center { align-items: center; }
.items-baseline { align-items: baseline; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-5 { gap: 1.25rem; }
.gap-6 { gap: 1.5rem; }
.gap-8 { gap: 2rem; }
.text-center { text-align: center; }
.text-right { text-align: right; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.w-4 { width: 1rem; }
.h-4 { height: 1rem; }
.w-5 { width: 1.25rem; }
.h-5 { height: 1.25rem; }
.w-6 { width: 1.5rem; }
.h-6 { height: 1.5rem; }
.w-8 { width: 2rem; }
.h-8 { height: 2rem; }
.w-10 { width: 2.5rem; }
.h-10 { height: 2.5rem; }
.w-12 { width: 3rem; }
.h-12 { height: 3rem; }
.w-px { width: 1px; }
.h-16 { height: 4rem; }
.m-0 { margin: 0; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-16 { margin-top: 4rem; }
.mt-auto { margin-top: auto; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-5 { margin-bottom: 1.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.ml-auto { margin-left: auto; }
.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-1400 { max-width: 1400px; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.px-1\.5 { padding-left: 0.375rem; padding-right: 0.375rem; }
.py-0\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.pt-5 { padding-top: 1.25rem; }
.pl-3 { padding-left: 0.75rem; }
.pr-9 { padding-right: 2.25rem; }
.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }
.tracking-wide { letter-spacing: 0.025em; }
.uppercase { text-transform: uppercase; }
.line-through { text-decoration: line-through; }
.leading-tight { line-height: 1.25; }
.leading-none { line-height: 1; }
.rounded { border-radius: 0.25rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-t-2xl { border-top-left-radius: 1rem; border-top-right-radius: 1rem; }
.border { border-width: 1px; border-style: solid; }
.border-t { border-top-width: 1px; border-top-style: solid; }
.border-border { border-color: var(--color-border); }
.border-sidebar-border { border-color: var(--color-border); }
.bg-white { background-color: #fff; }
.bg-card { background-color: #fff; }
.bg-sidebar { background-color: var(--color-cream-light); }
.text-white { color: #fff; }
.text-brand-gold { color: var(--color-gold); }
.text-brand-gold-deep { color: var(--brand-gold-deep); }
.text-brand-gold-accent { color: var(--brand-gold-accent); }
.text-brand-green { color: var(--brand-green); }
.text-brand-green-text { color: var(--brand-green-text); }
.text-brand-ink { color: var(--brand-ink); }
.text-brand-ink-70 { color: rgba(32, 51, 37, 0.7); }
.text-brand-ink-80 { color: rgba(32, 51, 37, 0.8); }
.text-handwrite { color: var(--color-handwrite); }
.text-muted-foreground { color: var(--color-sub); }
.opacity-30 { opacity: 0.3; }
.opacity-80 { opacity: 0.8; }
.pointer-events-none { pointer-events: none; }
.appearance-none { appearance: none; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.top-3 { top: 0.75rem; }
.left-3 { left: 0.75rem; }

@media (min-width: 640px) {
    .sm-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (min-width: 768px) {
    .md-flex { display: flex !important; }
    .md-flex-row { flex-direction: row !important; }
    .md-items-center { align-items: center !important; }
    .md-gap-16 { gap: 4rem !important; }
    .md-px-8 { padding-left: 2rem; padding-right: 2rem; }
}
@media (min-width: 1024px) {
    .lg-flex-row { flex-direction: row !important; }
    .lg-w-64 { width: 16rem !important; }
}
@media (min-width: 1280px) {
    .xl-block { display: block !important; }
    .xl-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
}
"""
with open(r'u:\SatvikSwad\public\site\style.css', 'a', encoding='utf-8') as f:
    f.write(utilities_css)

print("Utility CSS appended.")
