'use client';

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Open Custom GPT</h1>
        <p className="text-lg text-gray-600 mb-6">
          Get started by creating your own assistant using your Brand Foundation guide.
        </p>
        <Link href="/create/new">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create a New Assistant
          </button>
        </Link>
      </div>
    </main>
  );
}
