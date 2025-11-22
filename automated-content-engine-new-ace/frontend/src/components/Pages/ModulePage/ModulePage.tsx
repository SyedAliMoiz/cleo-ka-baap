"use client";

import { DefaultMessage } from "@/components/ModuleMessages/DefaultMessage";
import { VyraSearchCIAMessage } from "@/components/ModuleMessages/VyraSearchCIAMessage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  createSessionForModule,
  deleteSession as deleteSessionAPI,
  getMessagesForSession,
  getModuleBySlug,
  getSessionsByModule,
  sendMessageToSession,
} from "@/helpers/networking";
import clsx from "clsx";
import { Loader2, Send, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function ModulePage() {
  const params = useParams();
  const router = useRouter();
  const slug = useMemo(() => (params?.module as string) ?? "", [params]);

  const [moduleInfo, setModuleInfo] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isWaitingForAssistant, setIsWaitingForAssistant] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const [info, sess] = await Promise.all([
          getModuleBySlug(slug),
          getSessionsByModule(slug),
        ]);
        setModuleInfo(info);
        setSessions(sess);
        // Don't create a session automatically - only create when user sends first message
      } catch (e) {
        router.push("/modules");
      }
    })();
  }, [slug, router]);

  useEffect(() => {
    if (!activeSessionId) return;
    (async () => {
      const msgs = await getMessagesForSession(activeSessionId);
      setMessages(msgs);
    })();
  }, [activeSessionId]);

  // Initialize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, []);

  // Auto-focus textarea when module loads (only once per module)
  useEffect(() => {
    if (!slug) return;
    const focusTimer = setTimeout(() => {
      if (textareaRef.current && !loading && !activeSessionId) {
        textareaRef.current.focus();
      }
    }, 300);

    return () => clearTimeout(focusTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]); // Only depend on slug, so it runs once when module loads

  const onCreateSession = async () => {
    if (!slug) return;
    const s = await createSessionForModule(slug);
    setSessions((prev) => [s, ...prev]);
    setActiveSessionId(s._id);
    setMessages([]);
  };

  const onDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the session select

    if (
      !confirm(
        "Are you sure you want to delete this session? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteSessionAPI(sessionId);

      // Remove from sessions list
      const updatedSessions = sessions.filter((s) => s._id !== sessionId);
      setSessions(updatedSessions);

      // If it was the active session, handle cleanup
      if (activeSessionId === sessionId) {
        // If there are other sessions, select the first one
        if (updatedSessions.length > 0) {
          setActiveSessionId(updatedSessions[0]._id);
        } else {
          // No sessions left, clear active session
          setActiveSessionId(null);
          setMessages([]);
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
      alert("Failed to delete session. Please try again.");
    }
  };

  const onSend = async () => {
    if (!input.trim() || !slug) return;

    setLoading(true);
    try {
      // Create session if it doesn't exist (first message)
      let sessionId = activeSessionId;
      if (!sessionId) {
        const newSession = await createSessionForModule(slug);
        setSessions((prev) => [newSession, ...prev]);
        sessionId = newSession._id;
        setActiveSessionId(sessionId);
      }

      // Optimistically append user's message
      const userMessage = {
        _id: `temp-${Date.now()}`,
        role: "user",
        content: input.trim(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");

      // Show assistant thinking state
      setIsWaitingForAssistant(true);

      // Send the message and reconcile with server response
      const updated = await sendMessageToSession(
        sessionId!,
        userMessage.content
      );
      setMessages(updated);
      setIsWaitingForAssistant(false);

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } finally {
      setLoading(false);
      // Re-focus textarea after sending message
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);

    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const minHeight = 48; // Matches min-h-[3rem] (48px)
      const maxHeight = 200; // Maximum height in pixels (about 8-10 lines)
      textareaRef.current.style.height =
        Math.max(minHeight, Math.min(scrollHeight, maxHeight)) + "px";
    }
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffInHours = (now.getTime() - d.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) {
      // 7 days
      return d.toLocaleDateString([], {
        weekday: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return d.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  const renderAssistantMessage = (content: string, moduleSlug: string) => {
    switch (moduleSlug) {
      case "vyrasearch-cia":
        return <VyraSearchCIAMessage content={content} />;
      default:
        return <DefaultMessage content={content} />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-background">
      <div
        className={clsx(
          "bg-card border-r border-border transition-all duration-300 ease-in-out",
          sidebarOpen ? "w-80" : "w-0 overflow-hidden"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="font-semibold text-lg truncate">
                {moduleInfo?.name ?? slug}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={onCreateSession}
                  className="shrink-0"
                >
                  New Chat
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarOpen(false)}
                  className="shrink-0"
                >
                  ✕
                </Button>
              </div>
            </div>
            {moduleInfo?.description && (
              <div className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {moduleInfo.description}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {sessions.map((session) => (
              <Card
                key={session._id}
                className={clsx(
                  "p-3 cursor-pointer transition-all duration-200 group",
                  activeSessionId === session._id
                    ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(0,255,136,0.3)] text-foreground"
                    : "hover:bg-card/80 hover:border-primary/30 hover:shadow-sm"
                )}
                onClick={() => setActiveSessionId(session._id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div
                      className={clsx(
                        "text-sm font-medium truncate",
                        activeSessionId === session._id ? "text-primary" : ""
                      )}
                    >
                      {session.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(session.createdAt)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(session._id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
            {!sessions.length && (
              <div className="text-center py-8">
                <div className="text-sm text-muted-foreground mb-4">
                  No conversations yet
                </div>
                <Button size="sm" onClick={onCreateSession}>
                  Start New Chat
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSidebarOpen(true)}
                className="shrink-0"
              >
                ☰
              </Button>
            )}
            <div>
              <div className="font-semibold text-lg">
                {moduleInfo?.name ?? slug}
              </div>
              {moduleInfo?.description && (
                <div className="text-sm text-muted-foreground">
                  {moduleInfo.description}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {messages.map((message) => (
            <div
              key={message._id}
              className={clsx(
                "flex w-full",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={clsx(
                  "flex gap-3 w-full max-w-4xl",
                  message.role === "user"
                    ? "flex-row-reverse justify-start"
                    : "flex-row justify-start"
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1 shadow-lg overflow-hidden",
                    message.role === "user"
                      ? "bg-gradient-to-br from-primary to-accent text-black border-2 border-primary/50 shadow-[0_0_15px_rgba(0,255,136,0.4)]"
                      : "bg-gradient-to-br from-[#00ff88] to-[#00cc6e] text-black border-1 border-[rgba(0,255,136,0.5)]"
                  )}
                >
                  {message.role === "user" ? (
                    "U"
                  ) : moduleInfo?.coverImage ? (
                    <img
                      src={moduleInfo.coverImage}
                      alt={moduleInfo?.name || "Module"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "AI"
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div
                    className={clsx(
                      "flex items-center justify-between text-xs text-muted-foreground px-1",
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <span>
                      {message.role === "user"
                        ? "You"
                        : moduleInfo?.name ?? slug}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        onClick={() =>
                          navigator.clipboard.writeText(message.content)
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-foreground p-1 rounded"
                        title="Copy message"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                  <Card
                    className={clsx(
                      "shadow-sm overflow-hidden message-container group relative transition-all duration-200",
                      message.role === "user"
                        ? "bg-gradient-to-br from-primary/90 to-accent/90 text-black p-6 border border-primary/50 shadow-[0_0_20px_rgba(0,255,136,0.3)] hover:shadow-[0_0_25px_rgba(0,255,136,0.4)] backdrop-blur-sm"
                        : "bg-card border-l-4 border-l-primary hover:border-l-accent transition-colors"
                    )}
                  >
                    {message.role === "assistant" ? (
                      <div className="p-6">
                        {renderAssistantMessage(message.content, slug)}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap leading-relaxed break-words text-base font-medium">
                        {message.content}
                      </div>
                    )}
                  </Card>
                </div>
              </div>
            </div>
          ))}

          {isWaitingForAssistant && (
            <div className={clsx("flex w-full", "justify-start")}>
              <div
                className={clsx(
                  "flex gap-3 w-full max-w-4xl",
                  "flex-row justify-start"
                )}
              >
                <div
                  className={clsx(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-1 shadow-lg overflow-hidden",
                    "bg-gradient-to-br from-[#00ff88] to-[#00cc6e] text-black border-1 border-[rgba(0,255,136,0.5)]"
                  )}
                >
                  {moduleInfo?.coverImage ? (
                    <img
                      src={moduleInfo.coverImage}
                      alt={moduleInfo?.name || "Module"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "AI"
                  )}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
                    <span>{moduleInfo?.name ?? slug}</span>
                  </div>
                  <Card
                    className={clsx(
                      "shadow-sm overflow-hidden message-container group relative transition-all duration-200",
                      "bg-card border-l-4 border-l-primary hover:border-l-accent transition-colors"
                    )}
                  >
                    <div className="p-6 flex items-center gap-3">
                      <img
                        src="/loader.gif"
                        alt="Thinking…"
                        className="h-6 w-6"
                      />
                      <span className="text-sm text-muted-foreground">
                        Thinking…
                      </span>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {!messages.length && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
                <div className="space-y-2">
                  <div className="text-lg font-medium">
                    {moduleInfo?.emptyStateText || "Start a conversation"}
                  </div>
                  <div className="text-sm text-muted-foreground max-w-md">
                    {moduleInfo?.emptyStateText
                      ? ""
                      : "Type your message below to start the conversation."}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-card border-t border-border p-4 pb-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onSend();
                  }
                }}
                disabled={loading}
                className="chat-input w-full max-h-[200px] overflow-y-auto resize-none min-h-[3rem] pr-12 text-base!"
                rows={1}
              />
              <Button
                onClick={onSend}
                disabled={loading || !input.trim()}
                size="sm"
                className="absolute bottom-2 right-2 h-8 w-8 p-0 rounded-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ModulePage;
