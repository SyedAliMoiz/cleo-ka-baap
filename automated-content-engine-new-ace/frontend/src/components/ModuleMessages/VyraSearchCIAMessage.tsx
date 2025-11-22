"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeExternalLinks from "rehype-external-links";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { useAgentMode } from "@/contexts/AgentModeContext";

interface VyraSearchCIAMessageProps {
  content: string;
}

interface ParsedVyraSearchOutput {
  headerBlock?: Record<string, string>;
  items: VyraSearchItem[];
}

interface VyraSearchItem {
  title?: string;
  summary?: string;
  takeaway?: string;
  surpriseRating?: string;
  similarHook?: string;
  expandLink?: string;
  [key: string]: string | undefined;
}

export function VyraSearchCIAMessage({ content }: VyraSearchCIAMessageProps) {
  const { isDeveloperMode } = useAgentMode();

  // In developer mode, show raw content with scaffolding
  if (isDeveloperMode) {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-l-yellow-500 p-4 rounded">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono bg-yellow-200 dark:bg-yellow-800 px-2 py-1 rounded">
              DEVELOPER MODE
            </span>
            <span className="text-xs text-yellow-700 dark:text-yellow-300">
              Showing raw scaffolding and debug info
            </span>
          </div>
        </div>
        <div className="prose max-w-none prose-invert chat-message-prose">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[
              [
                rehypeExternalLinks,
                {
                  target: "_blank",
                  rel: "noopener noreferrer",
                },
              ],
            ]}
            components={{
              // Preserve scaffolding in developer mode
              code: ({ node, inline, className, children, ...props }: any) => {
                return !inline ? (
                  <div className="relative group">
                    <pre className="bg-gray-900 text-green-400 p-4 rounded border">
                      <code className={className} {...props}>
                        {children}
                      </code>
                    </pre>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(String(children))
                      }
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600 text-white p-1 rounded text-xs z-10"
                      title="Copy code"
                    >
                      Copy
                    </button>
                  </div>
                ) : (
                  <code
                    className={`${className} bg-yellow-200 dark:bg-yellow-800 px-1 py-0.5 rounded text-xs`}
                    {...props}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  // User mode - parse and display structured content
  const parsedOutput = parseVyraSearchContent(content);

  if (!parsedOutput.items.length) {
    // Fallback to regular markdown if not structured
    return (
      <div className="prose max-w-none prose-invert chat-message-prose">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[
            [
              rehypeExternalLinks,
              {
                target: "_blank",
                rel: "noopener noreferrer",
              },
            ],
          ]}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Block */}
      {parsedOutput.headerBlock && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-l-4 border-l-blue-500 p-6">
          <h3 className="text-lg font-semibold mb-4 text-blue-700 dark:text-blue-300">
            Input Summary
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(parsedOutput.headerBlock).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {key}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-200 bg-white/50 dark:bg-gray-800/50 rounded px-3 py-2">
                  {value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Content Ideas */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Content Ideas
        </h3>

        <div className="grid gap-6">
          {parsedOutput.items.map((item, index) => (
            <VyraSearchIdeaCard key={index} item={item} index={index + 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function VyraSearchIdeaCard({
  item,
  index,
}: {
  item: VyraSearchItem;
  index: number;
}) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const copyFullIdea = () => {
    const fullText = Object.entries(item)
      .filter(([key, value]) => value && key !== "expandLink")
      .map(([key, value]) => `**${key}:** ${value}`)
      .join("\n\n");
    copyToClipboard(fullText);
  };

  return (
    <Card className="overflow-hidden border-l-4 border-l-purple-500 hover:border-l-purple-400 transition-colors">
      <div className="p-6 space-y-4">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                {index}
              </div>
              {item.title && (
                <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex-1">
                  {item.title}
                  {item.surpriseRating && (
                    <span className="ml-2 text-xl">{item.surpriseRating}</span>
                  )}
                </h4>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={copyFullIdea}
              className="h-8 w-8 p-0"
              title="Copy full idea"
            >
              <Copy className="h-3 w-3" />
            </Button>

            {item.expandLink && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(item.expandLink, "_blank")}
                className="h-8 w-8 p-0"
                title="Expand this idea"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Content sections */}
        <div className="space-y-4">
          {item.summary && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Summary
              </h5>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {item.summary}
              </p>
            </div>
          )}

          {item.takeaway && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Key Takeaway
              </h5>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed font-medium bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border-l-4 border-l-yellow-400">
                {item.takeaway}
              </p>
            </div>
          )}

          {item.similarHook && (
            <div>
              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                Similar Hook
              </h5>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border-l-4 border-l-green-400">
                <div className="font-mono text-sm text-gray-800 dark:text-gray-200 whitespace-pre-line leading-relaxed">
                  {item.similarHook}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(item.similarHook!)}
                  className="mt-2 h-6 text-xs"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Hook
                </Button>
              </div>
            </div>
          )}

          {/* Expand Link */}
          {item.expandLink && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={() => window.open(item.expandLink, "_blank")}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Expand this Idea in Perplexity
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function parseVyraSearchContent(content: string): ParsedVyraSearchOutput {
  const lines = content.split("\n");
  const result: ParsedVyraSearchOutput = { items: [] };

  let currentSection = "";
  let headerBlock: Record<string, string> = {};
  let currentItem: VyraSearchItem = {};
  let inHeaderBlock = false;
  let inItem = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for header block start
    if (
      line.includes("Input Summary") ||
      line.includes("VyraSearch Input Summary")
    ) {
      inHeaderBlock = true;
      continue;
    }

    // Parse header block fields
    if (inHeaderBlock && line.startsWith("[") && line.includes("] = ")) {
      const match = line.match(/\[([^\]]+)\] = "?([^"]*)"?/);
      if (match) {
        const key = match[1];
        const value = match[2];
        headerBlock[key] = value;
      }
      continue;
    }

    // Check for item separator (hyphen on its own line)
    if (line === "-" || (line === "" && inHeaderBlock)) {
      if (inHeaderBlock) {
        result.headerBlock = headerBlock;
        inHeaderBlock = false;
      }

      if (inItem && Object.keys(currentItem).length > 0) {
        result.items.push(currentItem);
        currentItem = {};
      }
      inItem = true;
      continue;
    }

    // Parse item fields
    if (inItem && line.startsWith("**") && line.includes(":**")) {
      const match = line.match(/\*\*([^*]+):\*\* (.+)/);
      if (match) {
        const fieldName = match[1].toLowerCase().replace(/\s+/g, "");
        let fieldValue = match[2];

        // Handle multi-line fields
        let j = i + 1;
        while (
          j < lines.length &&
          !lines[j].trim().startsWith("**") &&
          lines[j].trim() !== "-"
        ) {
          if (lines[j].trim()) {
            fieldValue += "\n" + lines[j].trim();
          }
          j++;
        }
        i = j - 1; // Update the main loop counter

        // Special handling for expand link
        if (fieldName.includes("expand")) {
          const linkMatch = fieldValue.match(/\[([^\]]+)\]\(([^)]+)\)/);
          if (linkMatch) {
            currentItem.expandLink = linkMatch[2];
          }
        } else {
          currentItem[fieldName] = fieldValue;
        }
      }
    }
  }

  // Add the last item if exists
  if (inItem && Object.keys(currentItem).length > 0) {
    result.items.push(currentItem);
  }

  return result;
}
