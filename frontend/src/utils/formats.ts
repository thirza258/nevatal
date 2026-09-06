import type { OutputFormat } from "../interface";

/**
 * The output shapes a tool can ask for, and what each one means downstream.
 *
 * One list, used three ways: the selector's options, the file a download
 * produces, and whether the result should be rendered as Markdown or shown
 * verbatim — JSON reflowed as prose would be worse than useless.
 */
export interface OutputFormatDescriptor {
  value: OutputFormat;
  label: string;
  hint: string;
  extension: string;
  mime: string;
  /** Render through Markdown, rather than showing the text as it came. */
  rendered: boolean;
}

export const OUTPUT_FORMATS: OutputFormatDescriptor[] = [
  {
    value: "markdown",
    label: "Markdown",
    hint: "Headings and lists where they help.",
    extension: "md",
    mime: "text/markdown;charset=utf-8",
    rendered: true,
  },
  {
    value: "text",
    label: "Plain text",
    hint: "Prose with no formatting marks.",
    extension: "txt",
    mime: "text/plain;charset=utf-8",
    rendered: false,
  },
  {
    value: "table",
    label: "Table",
    hint: "A single Markdown table.",
    extension: "md",
    mime: "text/markdown;charset=utf-8",
    rendered: true,
  },
  {
    value: "json",
    label: "JSON",
    hint: "One JSON document, nothing else.",
    extension: "json",
    mime: "application/json;charset=utf-8",
    rendered: false,
  },
  {
    value: "csv",
    label: "CSV",
    hint: "A header row, then one row per record.",
    extension: "csv",
    mime: "text/csv;charset=utf-8",
    rendered: false,
  },
];

export const describeFormat = (format?: OutputFormat): OutputFormatDescriptor =>
  OUTPUT_FORMATS.find((entry) => entry.value === format) ?? OUTPUT_FORMATS[0];
