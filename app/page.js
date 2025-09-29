'use client';

import { useEffect, useRef, useState } from 'react';

export default function EmbedPage({ params: { assistantId } }) {
  const [messages, setMessages] = useState([
    // We render a welcome bubble locally (no network needed)
    {
      role: 'assistant',
      content:
        "Welcome to the Brand Foundation Framework! I'll guide you through the process step-by-step. If you prefer speaking your answers rather than typing, feel free to use voice dictation. Don't worry about being word perfect! Long, rambling answers are great because they give me more to work with. Ready for the first question?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Optional: if you want the assistant to “kick off” the first question
  // from the server (instead of using the local welcome above),
  // flip this to true. It’s guarded so it only runs once.
  const RUN_KICKOFF_ON_LOAD = false;
  const hasKickedOff = useRef(false);

  useEffect(() => {
    if (!RUN_KICKOFF_ON_LOAD) return;
    if (hasKickedOff.current) return;
    hasKickedOff.current = true;

    // Ask the server to start (one time only)
    void sendToAssistant('(start)');
    // ^ you can change this token; your server just treats it like any message
  }, []);

  async function sendToAssistant(text) {
    if (isSending) return; // hard guard against doubles
    setIsSending(true);

    try {
      // show the user's message immediately
      setMessages((prev) => [...prev, { role: 'user', content: text }]);

      const resp = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantId, message: text }),
      });

      // We made the API return plain text. Read it as text.
      const replyText = await resp.text();

      // Append the assistant reply (only once)
      setMessages((prev) => [...prev, { role: 'assistant', content: replyText }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            "Oops — I couldn’t reach the server. Please try again, and if it keeps happening, let me know.",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isSending) return;
    setInput('');
    await sendToAssistant(text);
  }

  return (
    <main className="min-h-screen w-full bg-slate-100">
      {/* Header */}
      <div className="w-full bg-slate-300/60 text-slate-900 font-medium px-4 py-3">
        myAssistant
      </div>

      {/* Messages */}
      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.role === 'assistant'
                ? 'max-w-lg bg-slate-800 text-white rounded-xl p-4'
                : 'max-w-lg ml-auto bg-white text-slate-900 rounded-xl p-3 border'
            }
          >
            {m.content}
          </div>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto p-4 pb-8 flex items-center gap-2"
      >
        <input
          className="flex-1 border rounded-lg px-3 py-3 outline-none focus:ring focus:ring-blue-300 bg-white"
          placeholder="Type your answer…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
        />
        <button
          type="submit"
          disabled={isSending}
          className="px-4 py-3 rounded-lg bg-blue-600 text-white disabled:opacity-60"
        >
          {isSending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </main>
  );
}
