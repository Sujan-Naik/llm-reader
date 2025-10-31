// app/providers.tsx
"use client"

import { ThemeProvider } from "headed-ui";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}