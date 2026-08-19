export default function ChatLoading() {
  return (
    <main className="flex h-dvh animate-pulse overflow-hidden bg-[#fbfcfb]">
      <div className="hidden w-72 border-r border-[#dce2e0] bg-[#f0f3f1] p-4 md:block">
        <div className="h-10 w-36 rounded bg-[#dfe5e3]" />
        <div className="mt-8 h-11 rounded-lg bg-[#cbdde8]" />
        <div className="mt-8 space-y-3">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-8 rounded bg-[#e0e5e3]" />)}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="h-[4.6rem] border-b border-[#e1e6e4] bg-white" />
        <div className="mx-auto my-auto h-48 w-full max-w-xl rounded-2xl bg-[#f0f3f2]" />
        <div className="mx-auto mb-7 h-20 w-[calc(100%-2rem)] max-w-3xl rounded-2xl bg-[#e8eceb]" />
      </div>
    </main>
  );
}
