import { useState } from "react";
import Icon from "@/components/ui/icon";

interface Grade {
  id: number;
  value: number;
  date: string;
  work: string;
}

interface Subject {
  id: number;
  name: string;
  teacher: string;
  color: string;
  grades: Grade[];
}

interface ScheduleLesson {
  subject: string;
  time: string;
  room: string;
}

type View = "journal" | "subject" | "add-grade" | "schedule";

const COLORS = [
  "#7c6df8", "#4f9cf9", "#34d399", "#f59e0b",
  "#f87171", "#a78bfa", "#38bdf8", "#fb923c",
];

const WORK_TYPES = ["Контрольная работа", "Домашнее задание", "Ответ у доски", "Самостоятельная", "Тест", "Проект", "Диктант", "Реферат"];

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт"];
const SCHEDULE: Record<string, ScheduleLesson[]> = {
  "Пн": [
    { subject: "Математика", time: "08:00", room: "Каб. 12" },
    { subject: "Русский язык", time: "09:00", room: "Каб. 5" },
    { subject: "История", time: "10:00", room: "Каб. 8" },
    { subject: "Физика", time: "11:00", room: "Каб. 15" },
    { subject: "Информатика", time: "12:00", room: "Каб. 21" },
  ],
  "Вт": [
    { subject: "Литература", time: "08:00", room: "Каб. 5" },
    { subject: "Биология", time: "09:00", room: "Каб. 9" },
    { subject: "Математика", time: "10:00", room: "Каб. 12" },
    { subject: "Химия", time: "11:00", room: "Каб. 18" },
  ],
  "Ср": [
    { subject: "Физика", time: "08:00", room: "Каб. 15" },
    { subject: "История", time: "09:00", room: "Каб. 8" },
    { subject: "Русский язык", time: "10:00", room: "Каб. 5" },
    { subject: "Биология", time: "11:00", room: "Каб. 9" },
    { subject: "Математика", time: "12:00", room: "Каб. 12" },
    { subject: "Литература", time: "13:00", room: "Каб. 5" },
  ],
  "Чт": [
    { subject: "Информатика", time: "08:00", room: "Каб. 21" },
    { subject: "Химия", time: "09:00", room: "Каб. 18" },
    { subject: "Математика", time: "10:00", room: "Каб. 12" },
    { subject: "История", time: "11:00", room: "Каб. 8" },
  ],
  "Пт": [
    { subject: "Русский язык", time: "08:00", room: "Каб. 5" },
    { subject: "Физика", time: "09:00", room: "Каб. 15" },
    { subject: "Литература", time: "10:00", room: "Каб. 5" },
    { subject: "Биология", time: "11:00", room: "Каб. 9" },
  ],
};

const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 1, name: "Математика", teacher: "Иванова А.П.", color: "#7c6df8",
    grades: [
      { id: 1, value: 5, date: "2026-03-10", work: "Контрольная работа" },
      { id: 2, value: 4, date: "2026-03-15", work: "Домашнее задание" },
      { id: 3, value: 5, date: "2026-03-20", work: "Ответ у доски" },
    ],
  },
  {
    id: 2, name: "Русский язык", teacher: "Петрова О.В.", color: "#4f9cf9",
    grades: [
      { id: 4, value: 4, date: "2026-03-11", work: "Диктант" },
      { id: 5, value: 3, date: "2026-03-18", work: "Самостоятельная" },
    ],
  },
  {
    id: 3, name: "История", teacher: "Сидоров К.Н.", color: "#f59e0b",
    grades: [
      { id: 6, value: 5, date: "2026-03-12", work: "Реферат" },
      { id: 7, value: 4, date: "2026-03-22", work: "Тест" },
    ],
  },
  {
    id: 4, name: "Физика", teacher: "Козлов В.М.", color: "#34d399",
    grades: [
      { id: 8, value: 3, date: "2026-03-14", work: "Контрольная работа" },
      { id: 9, value: 4, date: "2026-03-21", work: "Ответ у доски" },
    ],
  },
  {
    id: 5, name: "Информатика", teacher: "Новикова Е.С.", color: "#fb923c",
    grades: [
      { id: 10, value: 5, date: "2026-03-13", work: "Проект" },
      { id: 11, value: 5, date: "2026-03-20", work: "Тест" },
    ],
  },
  {
    id: 6, name: "Биология", teacher: "Морозова Л.А.", color: "#f87171",
    grades: [
      { id: 12, value: 4, date: "2026-03-16", work: "Самостоятельная" },
    ],
  },
];

function avg(grades: Grade[]): string {
  if (!grades.length) return "—";
  return (grades.reduce((s, g) => s + g.value, 0) / grades.length).toFixed(1);
}

function avgColor(val: string): string {
  const n = parseFloat(val);
  if (isNaN(n)) return "text-[var(--nova-text-muted)]";
  if (n >= 4.5) return "text-emerald-400";
  if (n >= 3.5) return "text-[var(--nova-indigo)]";
  if (n >= 2.5) return "text-amber-400";
  return "text-red-400";
}

function gradeColor(v: number): string {
  if (v === 5) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (v === 4) return "bg-[var(--nova-indigo-dim)] text-[var(--nova-indigo)] border-[var(--nova-indigo)]/30";
  if (v === 3) return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  return "bg-red-500/15 text-red-400 border-red-500/30";
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("ru", { day: "numeric", month: "short" });
}

export default function DiarySection() {
  const [subjects, setSubjects] = useState<Subject[]>(INITIAL_SUBJECTS);
  const [view, setView] = useState<View>("journal");
  const [activeSubject, setActiveSubject] = useState<Subject | null>(null);
  const [activeDay, setActiveDay] = useState<string>(DAYS[new Date().getDay() - 1] || "Пн");

  // Add grade form
  const [gradeVal, setGradeVal] = useState(5);
  const [gradeWork, setGradeWork] = useState(WORK_TYPES[0]);
  const [gradeDate, setGradeDate] = useState(new Date().toISOString().split("T")[0]);

  // Add subject form
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newName, setNewName] = useState("");
  const [newTeacher, setNewTeacher] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const openSubject = (s: Subject) => {
    setActiveSubject(s);
    setView("subject");
  };

  const addGrade = () => {
    if (!activeSubject) return;
    const grade: Grade = { id: Date.now(), value: gradeVal, date: gradeDate, work: gradeWork };
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === activeSubject.id ? { ...s, grades: [...s.grades, grade] } : s
      )
    );
    setActiveSubject((prev) => prev ? { ...prev, grades: [...prev.grades, grade] } : prev);
    setView("subject");
  };

  const deleteGrade = (gid: number) => {
    if (!activeSubject) return;
    setSubjects((prev) =>
      prev.map((s) =>
        s.id === activeSubject.id
          ? { ...s, grades: s.grades.filter((g) => g.id !== gid) }
          : s
      )
    );
    setActiveSubject((prev) =>
      prev ? { ...prev, grades: prev.grades.filter((g) => g.id !== gid) } : prev
    );
  };

  const addSubject = () => {
    if (!newName.trim()) return;
    const s: Subject = {
      id: Date.now(), name: newName, teacher: newTeacher,
      color: newColor, grades: [],
    };
    setSubjects((prev) => [...prev, s]);
    setNewName(""); setNewTeacher(""); setNewColor(COLORS[0]);
    setShowAddSubject(false);
  };

  const deleteSubject = (id: number) => {
    setSubjects((prev) => prev.filter((s) => s.id !== id));
    setView("journal");
  };

  // ── SUBJECT DETAIL ──
  if (view === "subject" && activeSubject) {
    const subject = subjects.find((s) => s.id === activeSubject.id) || activeSubject;
    const average = avg(subject.grades);
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--nova-border)]">
          <button onClick={() => setView("journal")} className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
            <Icon name="ArrowLeft" size={15} />
          </button>
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: subject.color }} />
          <div>
            <div className="font-semibold text-[var(--nova-text)] text-sm">{subject.name}</div>
            <div className="text-xs text-[var(--nova-text-muted)]">{subject.teacher}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`text-lg font-bold font-mono-nova ${avgColor(average)}`}>{average}</div>
            <button
              onClick={() => { setGradeVal(5); setGradeWork(WORK_TYPES[0]); setGradeDate(new Date().toISOString().split("T")[0]); setView("add-grade"); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors"
            >
              <Icon name="Plus" size={12} />
              Оценка
            </button>
            <button onClick={() => deleteSubject(subject.id)} className="p-2 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-400/10 transition-colors">
              <Icon name="Trash2" size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-2">
            {[
              { label: "Средний балл", value: average, color: avgColor(average) },
              { label: "Всего оценок", value: String(subject.grades.length), color: "text-[var(--nova-text)]" },
              { label: "Отличных", value: String(subject.grades.filter((g) => g.value === 5).length), color: "text-emerald-400" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-3 text-center">
                <div className={`text-xl font-bold font-mono-nova ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-[var(--nova-text-muted)] mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {subject.grades.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-[var(--nova-text-muted)]">
              <Icon name="ClipboardList" size={36} />
              <div className="text-sm">Оценок пока нет</div>
            </div>
          )}

          {[...subject.grades].sort((a, b) => b.date.localeCompare(a.date)).map((g) => (
            <div key={g.id} className="glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in">
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-bold font-mono-nova flex-shrink-0 ${gradeColor(g.value)}`}>
                {g.value}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--nova-text)]">{g.work}</div>
                <div className="text-xs text-[var(--nova-text-muted)] mt-0.5">{formatDate(g.date)}</div>
              </div>
              <button onClick={() => deleteGrade(g.id)} className="p-1.5 text-[var(--nova-text-muted)] hover:text-red-400 transition-colors">
                <Icon name="X" size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── ADD GRADE ──
  if (view === "add-grade" && activeSubject) {
    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--nova-border)]">
          <button onClick={() => setView("subject")} className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
            <Icon name="ArrowLeft" size={15} />
          </button>
          <span className="font-semibold text-[var(--nova-text)] text-sm">Добавить оценку</span>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Grade picker */}
          <div>
            <div className="text-xs text-[var(--nova-text-muted)] mb-3 uppercase tracking-wider">Оценка</div>
            <div className="flex gap-3">
              {[2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setGradeVal(v)}
                  className={`flex-1 h-14 rounded-2xl text-2xl font-bold font-mono-nova border transition-all ${
                    gradeVal === v ? gradeColor(v) : "glass text-[var(--nova-text-muted)] border-transparent"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Work type */}
          <div>
            <div className="text-xs text-[var(--nova-text-muted)] mb-3 uppercase tracking-wider">Тип работы</div>
            <div className="grid grid-cols-2 gap-2">
              {WORK_TYPES.map((w) => (
                <button
                  key={w}
                  onClick={() => setGradeWork(w)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium text-left transition-all ${
                    gradeWork === w
                      ? "bg-[var(--nova-indigo-dim)] border border-[var(--nova-indigo)] text-[var(--nova-indigo)]"
                      : "glass text-[var(--nova-text-muted)]"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div>
            <div className="text-xs text-[var(--nova-text-muted)] mb-3 uppercase tracking-wider">Дата</div>
            <input
              type="date"
              value={gradeDate}
              onChange={(e) => setGradeDate(e.target.value)}
              className="w-full glass rounded-xl px-4 py-2.5 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] border border-transparent transition-colors"
            />
          </div>

          <button
            onClick={addGrade}
            className="w-full py-3 rounded-2xl bg-[var(--nova-indigo)] text-white font-medium text-sm hover:bg-[#6b5ce7] transition-colors"
          >
            Сохранить оценку
          </button>
        </div>
      </div>
    );
  }

  // ── SCHEDULE ──
  if (view === "schedule") {
    const todayIdx = new Date().getDay() - 1;
    const defaultDay = DAYS[todayIdx] || "Пн";
    const displayDay = activeDay || defaultDay;
    const lessons = SCHEDULE[displayDay] || [];
    const subjectColors: Record<string, string> = {};
    subjects.forEach((s) => { subjectColors[s.name] = s.color; });

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[var(--nova-border)]">
          <button onClick={() => setView("journal")} className="p-2 rounded-lg glass glass-hover text-[var(--nova-text-muted)] hover:text-[var(--nova-text)] transition-colors">
            <Icon name="ArrowLeft" size={15} />
          </button>
          <span className="font-semibold text-[var(--nova-text)] text-sm">Расписание</span>
        </div>

        {/* Day tabs */}
        <div className="flex gap-2 px-4 py-3 border-b border-[var(--nova-border)]">
          {DAYS.map((d) => (
            <button
              key={d}
              onClick={() => setActiveDay(d)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                activeDay === d
                  ? "bg-[var(--nova-indigo)] text-white"
                  : "glass text-[var(--nova-text-muted)] hover:text-[var(--nova-text)]"
              }`}
            >
              {d}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {lessons.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--nova-text-muted)]">
              <Icon name="Coffee" size={36} />
              <div className="text-sm">Выходной день</div>
            </div>
          )}
          {lessons.map((l, i) => {
            const color = subjectColors[l.subject] || "#7c6df8";
            return (
              <div
                key={i}
                className="glass rounded-2xl px-4 py-3 flex items-center gap-3 animate-fade-in"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className="text-xs font-mono-nova text-[var(--nova-text-muted)] w-12 flex-shrink-0">{l.time}</div>
                <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1">
                  <div className="text-sm font-medium text-[var(--nova-text)]">{l.subject}</div>
                  <div className="text-xs text-[var(--nova-text-muted)] mt-0.5">{l.room}</div>
                </div>
                <div className="text-lg">{i + 1}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── MAIN JOURNAL ──
  const allGrades = subjects.flatMap((s) => s.grades);
  const totalAvg = allGrades.length
    ? (allGrades.reduce((sum, g) => sum + g.value, 0) / allGrades.length).toFixed(1)
    : "—";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--nova-border)]">
        <div>
          <div className="font-semibold text-[var(--nova-text)] text-sm">Электронный журнал</div>
          <div className="text-xs text-[var(--nova-text-muted)]">{subjects.length} предметов</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView("schedule")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
              view === "schedule" ? "bg-[var(--nova-indigo)] text-white" : "glass glass-hover text-[var(--nova-text-muted)]"
            }`}
          >
            <Icon name="CalendarDays" size={13} />
            Расписание
          </button>
          <button
            onClick={() => setShowAddSubject(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--nova-indigo)] text-white text-xs font-medium hover:bg-[#6b5ce7] transition-colors"
          >
            <Icon name="Plus" size={13} />
            Предмет
          </button>
        </div>
      </div>

      {/* Add subject modal */}
      {showAddSubject && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="glass rounded-2xl p-6 w-full max-w-sm animate-scale-in space-y-4">
            <div className="font-semibold text-[var(--nova-text)]">Новый предмет</div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Название предмета"
              className="w-full bg-white/5 border border-[var(--nova-border)] rounded-xl px-3 py-2 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] transition-colors"
            />
            <input
              value={newTeacher}
              onChange={(e) => setNewTeacher(e.target.value)}
              placeholder="Учитель (необязательно)"
              className="w-full bg-white/5 border border-[var(--nova-border)] rounded-xl px-3 py-2 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] transition-colors"
            />
            <div>
              <div className="text-xs text-[var(--nova-text-muted)] mb-2">Цвет</div>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-7 h-7 rounded-lg transition-transform hover:scale-110"
                    style={{ background: c, outline: newColor === c ? `2px solid white` : "none", outlineOffset: 2 }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowAddSubject(false)} className="flex-1 py-2 rounded-xl glass text-[var(--nova-text-muted)] text-sm">Отмена</button>
              <button onClick={addSubject} className="flex-1 py-2 rounded-xl bg-[var(--nova-indigo)] text-white text-sm font-medium hover:bg-[#6b5ce7] transition-colors">Добавить</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Overall average */}
        <div className="glass rounded-2xl px-5 py-4 flex items-center justify-between animate-fade-in">
          <div>
            <div className="text-xs text-[var(--nova-text-muted)]">Общий средний балл</div>
            <div className="text-xs text-[var(--nova-text-muted)] mt-0.5">{allGrades.length} оценок за период</div>
          </div>
          <div className={`text-3xl font-bold font-mono-nova ${avgColor(totalAvg)}`}>{totalAvg}</div>
        </div>

        {/* Subject cards */}
        {subjects.map((s, i) => {
          const a = avg(s.grades);
          const recent = [...s.grades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);
          return (
            <button
              key={s.id}
              onClick={() => openSubject(s)}
              className="w-full text-left glass glass-hover rounded-2xl p-4 transition-all animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: s.color }}>
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--nova-text)] text-sm">{s.name}</div>
                  <div className="text-xs text-[var(--nova-text-muted)]">{s.teacher}</div>
                </div>
                <div className={`text-xl font-bold font-mono-nova ${avgColor(a)}`}>{a}</div>
                <Icon name="ChevronRight" size={14} className="text-[var(--nova-text-muted)]" />
              </div>
              {recent.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {recent.map((g) => (
                    <div key={g.id} className={`w-8 h-8 rounded-lg border flex items-center justify-center text-sm font-bold font-mono-nova ${gradeColor(g.value)}`}>
                      {g.value}
                    </div>
                  ))}
                  {s.grades.length > 4 && (
                    <div className="w-8 h-8 rounded-lg glass flex items-center justify-center text-xs text-[var(--nova-text-muted)]">
                      +{s.grades.length - 4}
                    </div>
                  )}
                </div>
              )}
              {s.grades.length === 0 && (
                <div className="text-xs text-[var(--nova-text-muted)]">Оценок пока нет — нажмите чтобы добавить</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Расписание — отдельный экспорт не нужен, вызывается внутри