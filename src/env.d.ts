/// <reference types="astro/client" />

declare namespace astroHTML.JSX {
  interface IntrinsicAttributes {
    /** Hydrate on first use: "search" (⌘K, /, [data-open-search]) or "twin" ([data-open-twin], twin:ask). */
    'client:interaction'?: 'search' | 'twin';
  }
}
