"use client";

import { useEffect, useState } from "react";
import { sanitizeRichText } from "@/lib/rich-text";
import "./rich-text.css";

interface RichTextContentProps {
  html: string;
  className?: string;
}

export default function RichTextContent({
  html,
  className = "",
}: RichTextContentProps) {
  const [safeHtml, setSafeHtml] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSafeHtml(sanitizeRichText(html));
  }, [html]);

  return (
    <div
      className={`rich-text-content ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
