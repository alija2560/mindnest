import { BreathingExercise } from "../../components/exercises/BreathingExercise";

export default function ExercisesPage() {
  return (
    <main className="min-h-screen p-6 bg-[#F4F4F5] dark:bg-[#09090B] flex items-center justify-center">
      <div className="w-full">
        <h1 className="text-center text-xl font-medium mb-6 text-slate-800 dark:text-slate-100">فضای تمرین و آرام‌سازی نوا</h1>
        <BreathingExercise />
      </div>
    </main>
  );
}