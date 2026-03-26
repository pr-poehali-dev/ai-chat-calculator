import { useState } from "react";
import Icon from "@/components/ui/icon";

interface DiaryEntry {
  id: number;
  date: string;
  title: string;
  content: string;
  mood: string;
}

const MOODS = [
  { icon: "😊", label: "Отлично" },
  { icon: "🙂", label: "Хорошо" },
  { icon: "😐", label: "Нейтрально" },
  { icon: "😔", label: "Грустно" },
  { icon: "🔥", label: "Энергично" },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("ru", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const INITIAL_ENTRIES: DiaryEntry[] = [
  {
    id: 1,
    date: new Date().toISOString().split("T")[0],
    title: "Первая запись",
    content: "Начинаю вести электронный дневник. Буду записывать мысли и важные события каждый день.",
    mood: "😊",
  },
];

export default function DiarySection() {
  const [entries, setEntries] = useState<DiaryEntry[]>(INITIAL_ENTRIES);
  const [selected, setSelected] = useState<DiaryEntry | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editMood, setEditMood] = useState("😊");
  const [view, setView] = useState<"list" | "edit">("list");

  const openNew = () => {
    setSelected(null);
    setEditTitle("");
    setEditContent("");
    setEditMood("😊");
    setIsEditing(true);
    setView("edit");
  };

  const openEntry = (entry: DiaryEntry) => {
    setSelected(entry);
    setEditTitle(entry.title);
    setEditContent(entry.content);
    setEditMood(entry.mood);
    setIsEditing(false);
    setView("edit");
  };

  const saveEntry = () => {
    if (!editTitle.trim() && !editContent.trim()) return;
    if (selected) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === selected.id
            ? { ...e, title: editTitle, content: editContent, mood: editMood }
            : e
        )
      );
    } else {
      const newEntry: DiaryEntry = {
        id: Date.now(),
        date: new Date().toISOString().split("T")[0],
        title: editTitle || "Без названия",
        content: editContent,
        mood: editMood,
      };
      setEntries((prev) => [newEntry, ...prev]);
    }
    setView("list");
    setIsEditing(false);
  };

  const deleteEntry = (id: number) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
    setView("list");
  };

  if (view === "edit") {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--nova-border)]">
          <button
            onClick={() => setView("list")}
            className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors"
          >
            <Icon name="ArrowLeft" size={15} />
          </button>
          <span className="font-semibold text-[var(--nova-text)] text-sm">
            {isEditing ? "Новая запись" : formatDate(selected?.date || "")}
          </span>
          <div className="ml-auto flex gap-2">
            {selected && !isEditing && (
              <button
                onClick={() => deleteEntry(selected.id)}
                className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <Icon name="Trash2" size={15} />
              </button>
            )}
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-lg bg-[var(--nova-indigo-dim)] text-[var(--nova-indigo)] text-xs font-medium hover:bg-[var(--nova-indigo-glow)] transition-colors"
              >
                Изменить
              </button>
            ) : (
              <button
                onClick={saveEntry}
                className="px-3 py-1.5 rounded-lg bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors"
              >
                Сохранить
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Mood */}
          <div className="flex gap-2 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m.icon}
                disabled={!isEditing}
                onClick={() => setEditMood(m.icon)}
                className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                  editMood === m.icon
                    ? "bg-[var(--nova-indigo-dim)] border border-[var(--nova-indigo)] text-[var(--nova-text)]"
                    : "glass text-[var(--nova-text-muted)] disabled:opacity-50"
                }`}
              >
                {m.icon} {m.label}
              </button>
            ))}
          </div>

          {/* Title */}
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            disabled={!isEditing}
            placeholder="Заголовок записи..."
            className="w-full bg-transparent text-[var(--nova-text)] text-xl font-semibold outline-none placeholder:text-[var(--nova-text-muted)] disabled:opacity-70"
          />

          {/* Content */}
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={!isEditing}
            placeholder="Что у вас сегодня произошло? Напишите свои мысли..."
            className="w-full bg-transparent text-[var(--nova-text)] text-sm leading-relaxed outline-none resize-none min-h-64 placeholder:text-[var(--nova-text-muted)] disabled:opacity-70"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nova-border)]">
        <div>
          <div className="font-semibold text-[var(--nova-text)] text-sm">Мой дневник</div>
          <div className="text-xs text-[var(--nova-text-muted)]">{entries.length} записей</div>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors"
        >
          <Icon name="Plus" size={13} />
          Новая запись
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {entries.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--nova-text-muted)]">
            <Icon name="BookOpen" size={40} />
            <div className="text-sm">Пока нет записей</div>
            <button onClick={openNew} className="text-xs text-[var(--nova-indigo)] hover:underline">
              Создать первую запись
            </button>
          </div>
        )}
        {entries.map((entry, i) => (
          <button
            key={entry.id}
            onClick={() => openEntry(entry)}
            className="w-full text-left glass glass-hover rounded-2xl p-4 transition-all animate-fade-in"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="flex items-start gap-3">
              <div className="text-2xl leading-none mt-0.5">{entry.mood}</div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[var(--nova-text)] text-sm truncate">{entry.title}</div>
                <div className="text-xs text-[var(--nova-text-muted)] mt-0.5">{formatDate(entry.date)}</div>
                <div className="text-xs text-[var(--nova-text-muted)] mt-1.5 line-clamp-2 leading-relaxed">
                  {entry.content}
                </div>
              </div>
              <Icon name="ChevronRight" size={14} className="text-[var(--nova-text-muted)] flex-shrink-0 mt-1" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
