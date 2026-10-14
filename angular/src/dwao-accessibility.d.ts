declare global {
  interface Window {
    DWAOAccessibility?: {
      /** Widget version string, e.g. "2.0.0" */
      version: string;
      /** Resets all active accessibility settings to their defaults */
      reset: () => void;
      /**
       * Re-scans the page for typography elements and re-applies any active
       * font-size / letter-spacing / line-height / text-align classes.
       * Call this after a client-side route change so the widget picks up
       * newly rendered DOM nodes.
       */
      reinit: () => void;
    };
  }
}

export {};
