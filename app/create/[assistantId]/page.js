'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/**
 * This version:
 * - Does NOT import or use the OpenAI SDK in the browser
 * - Only talks to our server route (/api/assistant)
 * - No KeyContext, no localStorage, no Audio, nothing global
 * - Works for both /create/new and /create/[existingId]
 */

export default function Create({ params: { assistantId } }) {
  const router = useRouter();

  // basic fields
  const [name, setName] = useState('');
  const [instructions, setInstructions] = useState('');

  // tools
  const [types, setTypes] = useState([]);         // e.g. ['code_interpreter', 'retrieval']
  const [functions, setFunctions] = useState([]); // each item is JSON string for a function tool

  // ui state
  const [assistant, setAssistant] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [busy, setBusy] = useState(false);

  // toggle a tool type
  const toggleType = (type) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const addFunction = () => setFunctions((prev) => [...prev, '']);
  const updateFunction = (index, value) =>
    setFunctions((prev) => prev.map((v, i) => (i === index ? value : v)));
  const removeFunction = (index) =>
    setFunctions((prev) => prev.filter((_, i) => i !== index));

  // load existing assistant (when URL is /create/[id])
  useEffect(() => {
    const load = async () => {
      if (!assistantId || assistantId === 'new') return;
      try {
        const res = await fetch(`/api?assistantId=${assistantId}`);
        const data = await res.json();

        if (data?.assistant) {
          const a = data.assistant;
          setAssistant(a.id);
          setName(a.name || '');
          setInstructions(a.instructions || '');

          const nextTypes = [];
          const nextFns = [];

          (a.tools || []).forEach((tool) => {
            if (tool?.type === 'function' && tool.function) {
              nextFns.push(JSON.stringify(tool.function, null, 2));
            } else if (tool?.type) {
              nextTypes.push(tool.type);
            }
          });

          setTypes(nextTypes);
          setFunctions(nextFns);
          setShowShare(false);
        }
      } catch (e) {
        // leave fields empty on failure
      }
    };
    load();
  }, [assistantId]);

  // create or update on the server
  const onSubmit = async () => {
    if (!name.trim() || !instructions.trim()) {
      alert("Please fill in your assistant's name and instructions.");
      return;
    }

    setBusy(true);
    try {
      // build tools list
      const tools = [];
      types.forEach((t) => tools.push({ type: t }));

      // validate function JSON blocks
      for (const raw of functions) {
        if (!raw.trim()) continue;
        try {
          const fn = JSON.parse(raw);
          tools.push({ type: 'function', function: fn });
        } catch (_) {
          setBusy(false);
          alert('One of your Functions is not valid JSON. Fix it and try again.');
          return;
        }
      }

      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // tell the server what we want
          action: assistant ? 'update' : 'create',
          assistantId: assistant || null,
          name,
          instructions,
          tools,
          // (files omitted here to keep it simple and robust)
        }),
      });

      const data = await res.json();

      // server should return the id (new or updated)
      const newId = data?.id || data?.assistantId || data?.assistant?.id;
      if (!newId) {
        throw new Error(data?.error || 'Unexpected server response');
      }

      setAssistant(newId);
      setShowShare(true);

      // if we just created it from /create/new, move URL to /create/[id]
      if (assistantId === 'new') {
        router.push('/create/' + newId);
      }
    } catch (err) {
      alert(`Sorry—something went wrong: ${err?.message || err}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-myBg">
      <div
        id="header"
        className="flex items-center justify-between flex-wrap gap-2 bg-slate-900 text-white px-2 md:px-8 py-4"
      >
        <div className="flex items-center gap-2">
          <Image src="/assistant.svg" height={50} width={50} alt="logo" />
          <h6 className="text-3xl font-semibold">Open Custom GPT</h6>
        </div>
        <Link href="/">
          <Image src="/home.svg" height={20} width={20} alt="home" />
        </Link>
      </div>

      {!showShare ? (
        <div className="max-w-3xl px-2 md:px-8 py-6 flex flex-col gap-5 text-gray-800">
          <div>
            <label htmlFor="name" className="block mb-2 text-sm font-medium">
              Enter assistant name
            </label>
            <input
              id="name"
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="UX Designer"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block mb-2 text-sm font-medium">
              Enter instructions
            </label>
            <textarea
              id="instructions"
              className="bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
              placeholder="Act as a UX Designer to help with my project."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <div>
            <label className="block mb-2 text-sm font-medium">Select type of assistant</label>

            <div className="flex flex-col gap-3 text-sm">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  onChange={() => toggleType('code_interpreter')}
                  checked={types.includes('code_interpreter')}
                />
                <div
                  className={`w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-mySecondary after:rounded-full after:w-4 after:h-4 after:transition-all ${
                    types.includes('code_interpreter')
                      ? 'after:translate-x-full rtl:after:-translate-x-full after:border-white bg-myPrimary'
                      : 'bg-myBg'
                  }`}
                />
                <span className="ms-3 font-medium">Code Interpreter</span>
              </label>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  onChange={() => toggleType('retrieval')}
                  checked={types.includes('retrieval')}
                />
                <div
                  className={`w-9 h-5 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-mySecondary after:rounded-full after:w-4 after:h-4 after:transition-all ${
                    types.includes('retrieval')
                      ? 'after:translate-x-full rtl:after:-translate-x-full after:border-white bg-myPrimary'
                      : 'bg-myBg'
                  }`}
                />
                <span className="ms-3 font-medium">Retrieval</span>
              </label>

              <div className="flex items-center gap-5 cursor-pointer">
                <button
                  type="button"
                  className="rounded-full bg-myBg text-mySecondary text-xl font-bold px-2"
                  onClick={addFunction}
                >
                  +
                </button>
                <span className="font-medium">Functions</span>
              </div>
            </div>

            {/* function editors */}
            {functions.map((fn, idx) => (
              <div key={idx} className="relative">
                <textarea
                  className="bg-gray-50 mt-3 border border-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 h-60"
                  placeholder='{"name": "get_weather", "description": "Determine weather in my location"}'
                  value={fn}
                  onChange={(e) => updateFunction(idx, e.target.value)}
                />
                <button
                  type="button"
                  className="absolute z-10 top-1 right-4 font-bold"
                  onClick={() => removeFunction(idx)}
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={onSubmit}
            disabled={busy}
            className="bg-mySecondary hover:bg-blue-400 disabled:opacity-60 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
          >
            {assistant ? 'Update Assistant' : 'Submit'}
          </button>
          {assistant && (
            <button
              onClick={() => setShowShare(true)}
              className="bg-mySecondary hover:bg-blue-400 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center"
            >
              Share created assistant
            </button>
          )}
        </div>
      ) : (
        <div className="h-full grow px-2 md:px-8 py-6 flex flex-col gap-5 text-gray-800">
          <div className="flex flex-wrap gap-2 justify-between w-full">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowShare(false)}>
                <Image src="/back.svg" width={10} height={10} alt="back" />
                <small>Back</small>
              </div>
              <div className="flex items-center gap-2">
                <Image src="/link.svg" width={20} height={20} alt="share" />
                <h6 className="font-semibold text-xl">Share your assistant</h6>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/${assistant}" />`)
                }
                className="bg-mySecondary hover:bg-blue-400 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-4 py-2.5 text-center whitespace-nowrap"
              >
                Copy Embed
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(`${window.location.origin}/embed/${assistant}`)}
                className="bg-mySecondary hover:bg-blue-400 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-4 py-2.5 text-center whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>

          <iframe src={`/embed/${assistant}`} className="h-full grow rounded-xl border" />
        </div>
      )}
    </main>
  );
}
