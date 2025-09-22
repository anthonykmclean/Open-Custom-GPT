export default function CreatePage() {
  return (
    <main className="flex min-h-screen flex-col bg-myBg">
      <div className="p-6 text-gray-800 max-w-3xl">
        <h1 className="text-2xl font-semibold">Assistant creation is disabled</h1>
        <p className="mt-2">
          Use the live chat embed at <code>/embed/[your-assistant-id]</code>.
        </p>
      </div>
    </main>
  );
}
