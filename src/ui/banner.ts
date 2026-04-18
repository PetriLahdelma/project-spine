export const BANNER = `██████╗ ██████╗  ██████╗      ██╗███████╗ ██████╗████████╗
██╔══██╗██╔══██╗██╔═══██╗     ██║██╔════╝██╔════╝╚══██╔══╝
██████╔╝██████╔╝██║   ██║     ██║█████╗  ██║        ██║
██╔═══╝ ██╔══██╗██║   ██║██   ██║██╔══╝  ██║        ██║
██║     ██║  ██║╚██████╔╝╚█████╔╝███████╗╚██████╗   ██║
╚═╝     ╚═╝  ╚═╝ ╚═════╝  ╚════╝ ╚══════╝ ╚═════╝   ╚═╝
     ███████╗██████╗ ██╗███╗   ██╗███████╗
     ██╔════╝██╔══██╗██║████╗  ██║██╔════╝
     ███████╗██████╔╝██║██╔██╗ ██║█████╗
     ╚════██║██╔═══╝ ██║██║╚██╗██║██╔══╝
     ███████║██║     ██║██║ ╚████║███████╗
     ╚══════╝╚═╝     ╚═╝╚═╝  ╚═══╝╚══════╝`;

export const COMPACT_BANNER = `█▀█ █▀█ █▀█ ▄▀█ █▀▀ █▀▀ ▀█▀  █▀ █▀█ █ █▄ █ █▀▀
█▀▀ █▀▄ █ █ █▄█ █▀▀ █     █   ▄█ █▀▀ █ █ ▀█ █▀▀
▀   ▀ ▀ ▀▀▀  ▀  ▀▀▀ ▀▀▀   ▀   ▀▀ ▀   ▀ ▀  ▀ ▀▀▀`;

export const TAGLINE = "the missing context layer for software delivery";

/**
 * Print the banner suited to the current terminal width. Falls back to the
 * compact banner in narrow terminals (<60 cols) and skips entirely when
 * stdout is not a TTY so we never pollute pipes.
 */
export function printBanner(opts: { tagline?: boolean; force?: boolean } = {}): void {
  const tty = process.stdout.isTTY;
  if (!tty && !opts.force) return;
  const cols = process.stdout.columns ?? 80;
  const banner = cols < 60 ? COMPACT_BANNER : BANNER;
  process.stdout.write("\n" + banner + "\n");
  if (opts.tagline !== false) process.stdout.write(`     ${TAGLINE}\n`);
  process.stdout.write("\n");
}
