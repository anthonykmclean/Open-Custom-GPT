'use client';
import Image from 'next/image';
import { useState, useRef } from 'react';

function Embed({ params: { assistantId } }) {
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState([]);
  const [loading, setLoading] = useState(false);

  const chatRef = useRef(chat);
  chatRef.current = chat;

  const refreshChat = () => {
    setChat([]);
  };

  async function askAssistant() {
    const getQuestion = question.trim();
    if (!getQuestion) return;

    // show user's message immediately
    setQuestion('');
    const nextChat = [...chatRef.current, { isBot: false, msg: getQuestion }];
    setChat(nextChat);
    setLoading(true);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assistantId,         // comes from the URL /embed/[assistantId]
          message: getQuestion // the user's prompt
        }),
      });

      // Try to read JSON; fall back to text if needed
      let botMsg = '';
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        botMsg = data.msg || data.message || data.text || data.answer || JSON.stringify(data);
      } else {
        botMsg = await res.text();
      }

      setChat([...chatRef.current, { isBot: true, msg: botMsg }]);
    } catch (err) {
      setChat([
        ...chatRef.current,
        { isBot: true, msg: `Sorry—something went wrong: ${err?.message || err}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="h-screen w-screen md:p-4 flex flex-col bg-myBg gap-4">
      <div className="flex justify-between bg-myPrimary rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Image height={25} width={25} src="/assistant.svg" alt="logo" />
          <span className="font-semibold">myAssistant</span>
        </div>
        <div className="d-flex align-items-center gap-2 cursor-pointer">
          <Image height={20} width={20} onClick={refreshChat} src="/refresh.svg" alt="refresh" />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex flex-col gap-2 w-full h-full overflow-y-auto scroll">
        {chat.map((msg, index) => (
          <div
            key={index}
            className={`${
              msg.isBot
                ? 'bg-gray-900 text-gray-100 self-start'
                : 'text-gray-900 bg-gray-100 self-end border-2'
            } rounded-lg px-3 py-2 max-w-sm`}
          >
            {msg.msg}
          </div>
        ))}

        {loading && (
          <div className="bg-gray-900 text-gray-100 self-start rounded-lg px-3 py-2 max-w-sm">
            <div className="flex h-4 items-center gap-2">
              <div className="bounce bounce1 rounded-full bg-slate-500 h-2 w-2" />
              <div className="bounce bounce2 rounded-full bg-slate-500 h-2 w-2" />
              <div className="bounce bounce3 rounded-full bg-slate-500 h-2 w-2" />
            </div>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="flex gap-2 mt-auto">
        <input
          id="question"
          className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
          placeholder="Ask a question"
          required
          value={question}
          onKeyDown={(e) => {
            if (e.code === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              askAssistant();
            }
          }}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button
          onClick={askAssistant}
          className="bg-mySecondary hover:bg-blue-400 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-4 py-2.5 text-center"
        >
          <Image height={20} width={20} src="/send.svg" alt="send" />
        </button>
      </div>
    </div>
  );
}

export default Embed;
