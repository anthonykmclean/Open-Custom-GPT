'use client'
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

function Home() {
    const [assistants, setAssistants] = useState([]);

    const fetchData = async () => {
        const response = await fetch('/api');
        const data = await response.json();

        if (data.assistants && Object.keys(data.assistants).length > 0) {
            let getAssistants = [];
            Object.keys(data.assistants).forEach((key) =>
                getAssistants.push(data.assistants[key])
            );
            setAssistants(getAssistants);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
