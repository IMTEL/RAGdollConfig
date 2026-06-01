import fs from "node:fs";
import path from "node:path";
import type React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const dynamic = "force-static";

interface GuideSection {
  title: string;
  body: string;
}

function readGuide() {
  const guidePath = path.join(process.cwd(), "src", "content", "user-guide.md");
  return fs.readFileSync(guidePath, "utf8");
}

function splitSections(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const title = lines[0]?.replace(/^#\s+/, "").trim() || "Guide";
  const intro: string[] = [];
  const sections: GuideSection[] = [];
  let current: GuideSection | null = null;

  for (const line of lines.slice(1)) {
    const match = line.match(/^##\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = { title: match[1].trim(), body: "" };
      continue;
    }

    if (current) {
      current.body += `${line}\n`;
    } else {
      intro.push(line);
    }
  }

  if (current) sections.push(current);
  return { title, intro: intro.join("\n").trim(), sections };
}

function parseInline(text: string) {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="bg-muted rounded border px-1.5 py-0.5 font-mono text-sm"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function renderTable(lines: string[], key: string) {
  const rows = lines
    .filter((line) => line.trim())
    .map((line) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim())
    );
  const [header, separator, ...body] = rows;
  if (!header || !separator) return null;

  return (
    <div key={key} className="my-4 overflow-x-auto rounded-md border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted">
            {header.map((cell) => (
              <th key={cell} className="border-b px-4 py-2 text-left font-medium">
                {parseInline(cell)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="even:bg-muted/30">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b px-4 py-2 align-top">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderMarkdown(markdown: string) {
  const lines = markdown.split(/\r?\n/);
  const elements: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3);
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        code.push(lines[index]);
        index += 1;
      }
      elements.push(
        <pre
          key={elements.length}
          className="bg-muted my-4 overflow-x-auto rounded-md border p-4 text-sm"
        >
          <code className={language ? `language-${language}` : undefined}>
            {code.join("\n")}
          </code>
        </pre>
      );
      index += 1;
      continue;
    }

    if (trimmed.startsWith("|")) {
      const tableLines: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        tableLines.push(lines[index]);
        index += 1;
      }
      elements.push(renderTable(tableLines, String(elements.length)));
      continue;
    }

    if (trimmed.startsWith("### ")) {
      elements.push(
        <h3 key={elements.length} className="mt-6 mb-3 text-lg font-semibold">
          {parseInline(trimmed.slice(4))}
        </h3>
      );
      index += 1;
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
        index += 1;
      }
      elements.push(
        <ol key={elements.length} className="my-3 list-decimal space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{parseInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const items: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith("- ")) {
        items.push(lines[index].trim().slice(2));
        index += 1;
      }
      elements.push(
        <ul key={elements.length} className="my-3 list-disc space-y-1 pl-5">
          {items.map((item, itemIndex) => (
            <li key={itemIndex}>{parseInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    const paragraph: string[] = [trimmed];
    index += 1;
    while (
      index < lines.length &&
      lines[index].trim() &&
      !lines[index].trim().startsWith("```") &&
      !lines[index].trim().startsWith("|") &&
      !lines[index].trim().startsWith("### ") &&
      !lines[index].trim().startsWith("- ") &&
      !/^\d+\.\s+/.test(lines[index].trim())
    ) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    elements.push(
      <p key={elements.length} className="my-3 leading-7">
        {parseInline(paragraph.join(" "))}
      </p>
    );
  }

  return elements;
}

export default function GuidePage() {
  const guide = splitSections(readGuide());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">{guide.title}</h1>
        <div className="text-muted-foreground max-w-3xl">
          {renderMarkdown(guide.intro)}
        </div>
      </div>

      <Accordion type="multiple" className="rounded-lg border px-4">
        {guide.sections.map((section, index) => (
          <AccordionItem key={section.title} value={`section-${index}`}>
            <AccordionTrigger className="text-base">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose-neutral max-w-none pb-4 text-sm">
                {renderMarkdown(section.body)}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
