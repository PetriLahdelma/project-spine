"use client";

import "./globals.css";
import { ErrorDetails } from "./components/error-details";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="global-error">
        <div className="global-error__panel">
          <p className="global-error__eyebrow">Unexpected error</p>
          <h1 className="global-error__title">Something broke while rendering that page.</h1>
          <p className="global-error__lede">
            The error has been logged. Retry below, head home, or send us the
            digest on GitHub so we can reproduce it.
          </p>
          <ErrorDetails scope="global-error" error={error} reset={reset} />
        </div>
      </body>
    </html>
  );
}
