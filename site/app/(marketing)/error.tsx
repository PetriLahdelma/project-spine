"use client";

import { ErrorDetails } from "../components/error-details";

export default function MarketingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main>
      <header className="page-header">
        <p className="eyebrow">Unexpected error</p>
        <h1>Something broke while rendering that page.</h1>
        <p className="lede">
          The error has been logged. Retry below, head home, or send us the
          digest on GitHub so we can reproduce it.
        </p>
      </header>
      <ErrorDetails scope="marketing-error" error={error} reset={reset} />
    </main>
  );
}
