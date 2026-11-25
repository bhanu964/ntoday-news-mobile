import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML document for static web exports.
 * Configures the mobile-first viewport, 100dvh lock, and overscroll-behavior containment
 * to prevent browser pull-to-refresh from interfering with vertical feed snapping.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, maximum-scale=1, user-scalable=no"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root {
                height: 100%;
                height: 100dvh;
                margin: 0;
                padding: 0;
                background-color: #09090b;
                overflow: hidden;
                overscroll-behavior-y: contain;
                overscroll-behavior: contain;
                -webkit-overflow-scrolling: touch;
                touch-action: pan-y;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
