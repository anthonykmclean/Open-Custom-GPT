'use client';
import { useEffect, useRef, useState } from 'react';

export default function EmbedPage({ params: { assistantId } }) {
  const [messages, setMessages] = useState([]); // [{role:'assistant'|'user', content:string}]
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const scrollerRef = useRef(null);
  const startedRef = useRef(false); // guard against double start()

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  // Start conversation once per mount/assistant
  useEffect(() => {
    setMessages([]);            // reset when assistant changes
    startedRef.current = false; // reset the guard
    startConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assistantId]);

  async function startConversation() {
    if (startedRef.current) return;
    startedRef.current = true;

    setSending(true);
    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          message: 'START',
          history: [], // first turn, no history
        }),
      });

      const text = await res.text();
      setMessages([{ role: 'assistant', content: text }]);
    } catch (e) {
      setMessages([{ role: 'assistant', content: "Sorry—something went wrong starting the chat." }]);
    } finally {
      setSending(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();           // prevent double submit (button + Enter)
    if (sending) return;

    const val = inputRef.current?.value ?? '';
    const trimmed = val.trim();
    if (!trimmed) return;

    // Locally append the user's message
    const nextHistory = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextHistory);
    inputRef.current.value = '';
    setSending(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,
          message: trimmed,     // last user input
          history: nextHistory, // full convo so far (so the server has context)
        }),
      });

      const text = await res.text();
      setMessages(prev => [...prev, { role: 'assistant', content: text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry—something went wrong. Try again." }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-100">
      <div ref={scrollerRef} className="mx-auto max-w-3xl h-[calc(100vh-2rem)] overflow-auto p-4">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`my-3 flex ${m.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 leading-relaxed ${
                m.role === 'assistant'
                  ? 'bg-slate-800 text-white'
                  : 'bg-white border border-gray-300 text-gray-900'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        <form onSubmit={onSubmit} className="sticky bottom-0 mt-4 flex gap-2 bg-gray-100 py-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type your answer…"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:ring"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white disabled:opacity-60"
          >
            {sending ? 'Sending…' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
