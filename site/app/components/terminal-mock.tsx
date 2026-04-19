type Props = { title?: string; children: React.ReactNode };

/**
 * Styled terminal window with macOS-style chrome. Children should be
 * pre-formatted terminal content using the .tok-* span classes for
 * syntax-like coloring (see globals.css).
 */
export function TerminalMock({ title = "~/acme-payroll — zsh", children }: Props) {
  return (
    <div className="terminal" role="img" aria-label="Sample Project Spine compile output in a terminal">
      <div className="terminal__chrome">
        <span className="terminal__dot terminal__dot--r" aria-hidden="true" />
        <span className="terminal__dot terminal__dot--y" aria-hidden="true" />
        <span className="terminal__dot terminal__dot--g" aria-hidden="true" />
        <span className="terminal__title">{title}</span>
      </div>
      <pre className="terminal__body" tabIndex={0}>{children}</pre>
    </div>
  );
}
