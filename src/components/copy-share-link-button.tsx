"use client";

import { useState } from "react";

export function CopyShareLinkButton({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const fullUrl = window.location.origin + shareUrl;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
        copied
          ? "bg-emerald-600 text-white"
          : "bg-[#0891B2] text-white hover:bg-[#0E7490]"
      }`}
    >
      {copied ? (
        <>
          <span>✓</span> Copied Link!
        </>
      ) : (
        <>
          <span>📋</span> Copy Link
        </>
      )}
    </button>
  );
}
