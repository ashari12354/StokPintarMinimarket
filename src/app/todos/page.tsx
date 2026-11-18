import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos } = await supabase.from("todos").select();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-lg font-bold text-slate-900 mb-3">
        Supabase SSR Test — Daftar Tugas Gudang (Tabel <code>todos</code>)
      </h1>
      <ul className="space-y-2 list-disc pl-5 text-sm text-slate-700">
        {todos?.map((todo: any) => (
          <li key={todo.id}>{todo.name}</li>
        ))}
      </ul>
    </div>
  );
}
