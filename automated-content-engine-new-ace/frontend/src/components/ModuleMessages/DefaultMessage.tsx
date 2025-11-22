"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeExternalLinks from "rehype-external-links";
import { useAgentMode } from "@/contexts/AgentModeContext";

interface DefaultMessageProps {
  content: string;
}

export function DefaultMessage({ content }: DefaultMessageProps) {
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
            skipHtml={false}
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

  // User mode - clean polished view
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
        skipHtml={false}
        components={{
          // Minimal overrides - let AI control formatting via markdown
          code: ({ node, inline, className, children, ...props }: any) => {
            return !inline ? (
              <div className="relative group">
                <pre>
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
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
