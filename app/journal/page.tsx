import { JournalView } from "@/components/journal/JournalView";

export default function JournalPage() {
  return (
    <main className="min-h-screen p-6 bg-[#F4F4F5] dark:bg-[#09090B]">
      <div className="mb-6 max-w-2xl mx-auto text-right">
        <h1 className="text-xl font-medium text-slate-800 dark:text-slate-100">دفترچه بازتاب افکار</h1>
        <p className="text-xs text-slate-500 mt-1">فضایی امن برای نوشتن بدون سانسور و قضاوت</p>
      </div>
      <JournalView locale="fa" />
    </main>
  );
}