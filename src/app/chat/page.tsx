"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Bot, User, Slash } from "lucide-react";
import { TonyAvatar } from "@/components/tony-avatar";
import { useQuery } from "@tanstack/react-query";
import { AgentStatus } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

const QUICK_COMMANDS = [
  { cmd: "/status", description: "Check Tony's status" },
  { cmd: "/todos", description: "List active tasks" },
  { cmd: "/ideas", description: "List recent ideas" },
  { cmd: "/time", description: "Today's time summary" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "system",
      content:
        "Welcome to Mission Control Chat. This is a local command interface. Use quick commands or type messages.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: status } = useQuery<AgentStatus>({
    queryKey: ["status"],
    queryFn: () => fetch("/api/status").then((r) => r.json()),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const cmd = input.trim();
    setInput("");

    // Handle quick commands
    if (cmd.startsWith("/")) {
      let response = "";

      if (cmd === "/status") {
        const res = await fetch("/api/status");
        const data = await res.json();
        response = `Tony is **${data.state}**${data.currentActivity ? ` - working on: ${data.currentActivity}` : ""}. Sessions: ${data.sessionCount}.`;
      } else if (cmd === "/todos") {
        const res = await fetch("/api/todos?source=active&status=todo");
        const data = await res.json();
        const top5 = data.todos.slice(0, 5);
        response = top5.length > 0
          ? `**Active Tasks (${data.total}):**\n${top5.map((t: { title: string }) => `- ${t.title}`).join("\n")}`
          : "No active tasks.";
      } else if (cmd === "/ideas") {
        const res = await fetch("/api/ideas");
        const data = await res.json();
        const top5 = data.ideas.slice(0, 5);
        response = top5.length > 0
          ? `**Recent Ideas (${data.total}):**\n${top5.map((i: { idea: string }) => `- ${i.idea.slice(0, 80)}...`).join("\n")}`
          : "No ideas.";
      } else if (cmd === "/time") {
        const res = await fetch("/api/timetracking/stats");
        const data = await res.json();
        const mins = data.today?.minutes || 0;
        const cats = Object.entries(data.today?.byCategory || {})
          .map(([k, v]) => `${k}: ${Math.round((v as number) / 60 * 10) / 10}h`)
          .join(", ");
        response = `**Today:** ${Math.round(mins / 60 * 10) / 10}h total${cats ? ` (${cats})` : ""}. ${data.focusSessions} focus sessions.`;
      } else {
        response = `Unknown command: ${cmd}. Try /status, /todos, /ideas, or /time.`;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response,
          timestamp: new Date().toISOString(),
        },
      ]);
    } else {
      // Regular message - just echo for now
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Direct messaging to Tony is not yet connected. Use /commands for quick queries, or interact through the task and idea pages.",
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Chat</h1>
        <p className="text-muted-foreground text-sm">Command interface</p>
      </div>

      {/* Quick Commands */}
      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_COMMANDS.map((cmd) => (
          <Button
            key={cmd.cmd}
            variant="outline"
            size="sm"
            className="text-xs gap-1"
            onClick={() => {
              setInput(cmd.cmd);
            }}
          >
            <Slash className="w-3 h-3" />
            {cmd.cmd}
          </Button>
        ))}
      </div>

      {/* Messages */}
      <Card className="flex-1 overflow-hidden flex flex-col">
        <CardContent className="flex-1 overflow-y-auto pt-4 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
            >
              {msg.role === "assistant" && (
                <TonyAvatar state={status?.state || "idle"} size="sm" />
              )}
              {msg.role === "system" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-muted-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-blue-500/20 text-foreground"
                    : msg.role === "system"
                      ? "bg-secondary text-muted-foreground italic"
                      : "bg-secondary text-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-blue-400" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </CardContent>

        {/* Input */}
        <div className="p-3 border-t border-border">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command or message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
