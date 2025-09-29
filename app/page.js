'use client';

import { useEffect, useRef, useState } from 'react';

export default function EmbedPage({ params: { assistantId } }) {
  const [messages, setMessages] = useState([]); // {role:'assistant'|'user', content:string}[]
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef(null);

  // Auto-start: get the welcome + first question
  useEffect(() => {
    const start = async () => {
      setSending(true);
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            assistantId,
            message: 'START',
            history: [], // no history on first turn
          }),
        });
        const text = await res.text();
        setMessages([{ role: 'assistant', content: text }]);
      } catch (e) {
        setMessages([{ role: 'assistant', content: 'Sorry—something went wrong starting the chat.' }]);
      } finally {
        setSending(false);
      }
    };
    start();
  }, [assistantId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const nextHistory = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    setInput('');
    setSending(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          message: trimmed,
          history: nextHistory, // send full conversation so far
        }),
      });
      const text = await res.text();
      setMessages((prev) => [...prev, { role: 'assistant', content: text }]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry—there was a network error. Please try again.' },
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      <div className="p-3 text-sm font-medium">myAssistant</div>

      <div
        ref={scrollerRef}
        className="flex-1 overflow-y-auto px-4 pb-6"
        style={{ scrollBehavior: 'smooth' }}
      >
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg px-4 py-3 text-[15px] leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-slate-800 text-white self-start max-w-[85%]'
                  : 'bg-white border self-end max-w-[85%]'
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      </div>

      <div className="border-t bg-white">
        <div className="max-w-3xl mx-auto flex gap-2 p-3">
          <textarea
            className="flex-1 border rounded-md px-3 py-2 focus:outline-none focus:ring"
            placeholder="Type your answer…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={2}
            disabled={sending}
          />
          <button
            onClick={send}
            disabled={sending}
            className="px-4 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  );
}
