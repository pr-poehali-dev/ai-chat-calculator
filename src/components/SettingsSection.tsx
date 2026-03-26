import { useState } from "react";
import Icon from "@/components/ui/icon";

export default function SettingsSection() {
  const [name, setName] = useState("Пользователь");
  const [email, setEmail] = useState("user@example.com");
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({
    value,
    onChange,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-all duration-200 relative flex-shrink-0 ${
        value ? "bg-[var(--nova-indigo)]" : "bg-white/10"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 absolute top-0.5 ${
          value ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );

  const Row = ({
    icon,
    label,
    desc,
    children,
  }: {
    icon: string;
    label: string;
    desc?: string;
    children: React.ReactNode;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-[var(--nova-border)] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[var(--nova-indigo-dim)] flex items-center justify-center">
          <Icon name={icon as "User"} size={15} className="text-[var(--nova-indigo)]" />
        </div>
        <div>
          <div className="text-sm font-medium text-[var(--nova-text)]">{label}</div>
          {desc && <div className="text-xs text-[var(--nova-text-muted)]">{desc}</div>}
        </div>
      </div>
      {children}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-[var(--nova-border)]">
        <div className="font-semibold text-[var(--nova-text)] text-sm">Настройки</div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Profile */}
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#7c6df8] to-[#4f46e5] flex items-center justify-center text-white text-xl font-bold">
              {name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-semibold text-[var(--nova-text)]">{name}</div>
              <div className="text-xs text-[var(--nova-text-muted)]">{email}</div>
              <div className="mt-1 text-xs text-emerald-400 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Синхронизация активна
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-[var(--nova-text-muted)] mb-1 block">Имя</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-[var(--nova-border)] rounded-xl px-3 py-2 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--nova-text-muted)] mb-1 block">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-[var(--nova-border)] rounded-xl px-3 py-2 text-sm text-[var(--nova-text)] outline-none focus:border-[var(--nova-indigo)] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="glass rounded-2xl px-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <div className="text-xs font-medium text-[var(--nova-text-muted)] pt-4 pb-2 uppercase tracking-wider">
            Уведомления
          </div>
          <Row icon="Bell" label="Push-уведомления" desc="Получать уведомления от ИИ">
            <Toggle value={notifications} onChange={setNotifications} />
          </Row>
          <Row icon="Volume2" label="Звуки" desc="Звуковые сигналы сообщений">
            <Toggle value={sound} onChange={setSound} />
          </Row>
        </div>

        <div className="glass rounded-2xl px-5 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          <div className="text-xs font-medium text-[var(--nova-text-muted)] pt-4 pb-2 uppercase tracking-wider">
            Данные
          </div>
          <Row icon="Cloud" label="Автосохранение" desc="Синхронизировать данные в облако">
            <Toggle value={autoSave} onChange={setAutoSave} />
          </Row>
          <Row icon="Download" label="Экспорт дневника" desc="Скачать все записи в формате txt">
            <button className="text-xs text-[var(--nova-indigo)] hover:underline">
              Скачать
            </button>
          </Row>
          <Row icon="Trash2" label="Очистить данные" desc="Удалить все записи и историю">
            <button className="text-xs text-red-400/70 hover:text-red-400 transition-colors">
              Удалить
            </button>
          </Row>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          className={`w-full py-3 rounded-2xl font-medium text-sm transition-all ${
            saved
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              : "bg-[var(--nova-indigo)] text-white hover:bg-[#6b5ce7]"
          }`}
        >
          {saved ? "Сохранено!" : "Сохранить изменения"}
        </button>

        <div className="text-center text-xs text-[var(--nova-text-muted)] pb-2">
          NOVA v1.0 · Все данные защищены
        </div>
      </div>
    </div>
  );
}
