"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Pin, Trash2, Smile, MessageSquare, Shield, PinOff } from "lucide-react";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isHost: boolean;
  isPinned?: boolean;
  reactions?: Record<string, number>;
}

interface InRoomChatProps {
  roomId: string;
  currentUserId: string;
  currentUserName: string;
  isHost?: boolean;
  onSendMessageBroadcast?: (msg: ChatMessage) => void;
  externalMessages?: ChatMessage[];
}

export default function InRoomChat({
  roomId,
  currentUserId,
  currentUserName,
  isHost = false,
  onSendMessageBroadcast,
  externalMessages = [],
}: InRoomChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg_welcome",
      senderId: "system",
      senderName: "Virella System",
      text: `Welcome to Room #${roomId}! Shared Pomodoro and Whiteboard are now synced across all active scholars.`,
      timestamp: Date.now() - 1000 * 60 * 3,
      isHost: false,
      isPinned: true,
      reactions: { "🔥": 4, "🎯": 6 },
    },
    {
      id: "msg_1",
      senderId: "user_sarah",
      senderName: "Sarah L.",
      text: "Starting Feynman cycle on Operating Systems memory paging. Who wants to review my whiteboard explanation?",
      timestamp: Date.now() - 1000 * 60 * 1,
      isHost: true,
      reactions: { "💡": 3 },
    },
  ]);

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Merge external incoming messages
  useEffect(() => {
    if (externalMessages.length > 0) {
      setMessages((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        externalMessages.forEach((m) => map.set(m.id, m));
        return Array.from(map.values()).sort((a, b) => a.timestamp - b.timestamp);
      });
    }
  }, [externalMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      senderId: currentUserId,
      senderName: currentUserName,
      text: inputText.trim(),
      timestamp: Date.now(),
      isHost,
      reactions: {},
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    onSendMessageBroadcast?.(newMsg);
  };

  const handleReact = (msgId: string, emoji: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId) {
          const currentReactions = { ...(m.reactions || {}) };
          currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
          return { ...m, reactions: currentReactions };
        }
        return m;
      })
    );
  };

  const handlePin = (msgId: string) => {
    if (!isHost) return;
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isPinned: !m.isPinned } : m))
    );
  };

  const handleDelete = (msgId: string) => {
    if (!isHost) return;
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const pinnedMessages = messages.filter((m) => m.isPinned);

  return (
    <div className="glass-panel p-4 rounded-2xl border border-white/10 shadow-xl flex flex-col h-full select-none">
      {/* HEADER */}
      <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#b4f000]" />
          <span className="font-mono text-xs uppercase tracking-wider text-slate-300">
            [ ROOM CHAT ]
          </span>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {messages.length} messages
        </span>
      </div>

      {/* PINNED ANNOUNCEMENT IF ANY */}
      {pinnedMessages.length > 0 && (
        <div className="mb-2 p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs">
          <div className="flex items-center justify-between text-purple-300 font-mono text-[10px] mb-1">
            <span className="flex items-center gap-1">
              <Pin className="w-3 h-3 text-[#b4f000]" /> PINNED BY HOST
            </span>
            <span>{pinnedMessages[0].senderName}</span>
          </div>
          <p className="text-slate-200 line-clamp-2">{pinnedMessages[0].text}</p>
        </div>
      )}

      {/* MESSAGE STREAM */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUserId;
          const isSys = msg.senderId === "system";

          return (
            <div
              key={msg.id}
              className={`p-2.5 rounded-xl transition-colors group relative ${
                isSys
                  ? "bg-purple-950/20 border border-purple-800/30 text-purple-200"
                  : isMe
                  ? "bg-white/[0.05] border border-white/10 ml-4"
                  : "bg-white/[0.02] border border-white/[0.04] mr-4"
              }`}
            >
              {/* SENDER & TIME */}
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className={`font-semibold ${isMe ? "text-[#b4f000]" : "text-white"}`}>
                    {msg.senderName}
                  </span>
                  {msg.isHost && (
                    <span className="text-[9px] font-mono text-[#b4f000] bg-[#b4f000]/10 px-1 rounded border border-[#b4f000]/20">
                      HOST
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {formatTimestamp(msg.timestamp)}
                </span>
              </div>

              {/* MESSAGE BODY */}
              <p className="text-slate-300 leading-relaxed break-words">{msg.text}</p>

              {/* REACTIONS */}
              {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {Object.entries(msg.reactions).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(msg.id, emoji)}
                      className="px-1.5 py-0.5 rounded-full bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 border border-white/10 flex items-center gap-1"
                    >
                      <span>{emoji}</span>
                      <span className="font-mono text-purple-300">{count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* HOVER QUICK ACTIONS */}
              <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-[#120e24] px-1.5 py-0.5 rounded-md border border-white/10 shadow-md">
                <button
                  onClick={() => handleReact(msg.id, "👍")}
                  className="p-1 hover:text-[#b4f000]"
                  title="Thumbs up"
                >
                  👍
                </button>
                <button
                  onClick={() => handleReact(msg.id, "💡")}
                  className="p-1 hover:text-amber-400"
                  title="Idea"
                >
                  💡
                </button>
                {isHost && (
                  <>
                    <button
                      onClick={() => handlePin(msg.id)}
                      className="p-1 text-slate-400 hover:text-[#b4f000]"
                      title="Pin message"
                    >
                      <Pin className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(msg.id)}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Delete message"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT FORM */}
      <form onSubmit={handleSend} className="mt-2 pt-2 border-t border-white/[0.08] flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type message to room..."
          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#b4f000]/60 transition-colors"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl bg-[#b4f000] text-black disabled:opacity-30 disabled:pointer-events-none hover:bg-[#c6ff00] transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
