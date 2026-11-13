"use client";

import { useEffect, useRef } from "react";
import { sanitizeRichText } from "@/lib/rich-text";
import "./rich-text.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const toolbarActions = [
  { label: "Bold", command: "bold", text: "B", className: "is-bold" },
  { label: "Italic", command: "italic", text: "I", className: "is-italic" },
  { label: "Underline", command: "underline", text: "U", className: "is-underline" },
  { label: "Heading 2", command: "formatBlock", value: "h2", text: "H2" },
  { label: "Heading 3", command: "formatBlock", value: "h3", text: "H3" },
  { label: "Paragraph", command: "formatBlock", value: "p", text: "¶" },
  { label: "Bulleted list", command: "insertUnorderedList", text: "• List" },
  { label: "Numbered list", command: "insertOrderedList", text: "1. List" },
  { label: "Insert link", command: "createLink", text: "Link" },
  { label: "Clear formatting", command: "removeFormat", text: "Clear" },
];

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Write a description...",
  label = "Rich text editor",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor) return;

    const safeValue = sanitizeRichText(value);
    if (editor.innerHTML !== safeValue) {
      editor.innerHTML = safeValue;
    }
  }, [value]);

  const runCommand = (
    command: string,
    value?: string,
  ) => {
    let commandValue = value;
    if (command === "createLink") {
      const link = window.prompt("Enter a link URL", "https://");
      if (!link) return;
      commandValue = link;
    }

    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    onChange(editorRef.current?.innerHTML || "");
  };

  return (
    <div className="rich-text-editor">
      <div className="rich-text-toolbar" role="toolbar" aria-label="Description formatting">
        {toolbarActions.map((action) => (
          <button
            key={action.label}
            type="button"
            className={action.className}
            aria-label={action.label}
            title={action.label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(action.command, action.value)}
          >
            {action.text}
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        className="rich-text-editable"
        contentEditable
        role="textbox"
        aria-label={label}
        aria-multiline="true"
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={(event) => onChange(event.currentTarget.innerHTML)}
      />
    </div>
  );
}
