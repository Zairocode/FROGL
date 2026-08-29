"use client";

/**
 * Front-only: Convex desactivado. Cuando haya NEXT_PUBLIC_CONVEX_URL +
 * `npx convex dev`, volvé a cablear ConvexProvider acá.
 */
export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
