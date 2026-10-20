'use client';

import React from 'react';
import { AppErrorView } from './components/AppErrorBoundary';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <AppErrorView error={error} onReset={reset} />
      </body>
    </html>
  );
}
