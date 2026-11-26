interface HeaderProps {
  fullName: string;
  onOpenEditor: () => void;
}

export function Header({ fullName, onOpenEditor }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFA]/95 backdrop-blur-sm border-b border-zinc-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
        <a
          href="#summary"
          className="font-display text-base font-semibold tracking-tight text-zinc-950 whitespace-nowrap shrink-0 truncate min-w-0 max-w-[180px] sm:max-w-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          {fullName || 'Portfolio'}
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-zinc-600"
        >
          <a
            href="#summary"
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Summary
          </a>
          <a
            href="#experience"
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Experience
          </a>
          <a
            href="#projects"
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Projects
          </a>
          <a
            href="#contact"
            className="hover:text-zinc-950 transition-colors whitespace-nowrap shrink-0 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
          >
            Contact
          </a>
        </nav>

        <div className="shrink-0">
          <button
            type="button"
            onClick={onOpenEditor}
            className="px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Edit Portfolio
          </button>
        </div>
      </div>
    </header>
  );
}
