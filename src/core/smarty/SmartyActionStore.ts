import type { SmartyActionItem } from "./SmartyActionScanner";

export type SmartyStoreShape = Record<string, SmartyActionItem[]>;
type Listener = (store: SmartyStoreShape) => void;

const STORAGE_KEY = "__SMARTY_ACTION_STORE__";

class SmartyActionStore {
  private store: SmartyStoreShape = {};
  private listeners = new Set<Listener>();

  constructor() {
    // ✅ restore from localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        this.store = JSON.parse(saved);
      } catch {
        this.store = {};
      }
    }

    // ✅ sync across tabs + instant updates
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        this.store = JSON.parse(e.newValue);
        this.emit();
      }
    });

    console.log("🧠 SmartyActionStore initialized (localStorage)");
  }

  set(page: string, actions: SmartyActionItem[]) {
    this.store[page] = actions;

    // ✅ persist globally
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(this.store)
    );

    this.emit(); // 🔥 instant notify (same tab)
  }

  get(page: string) {
    return this.store[page] ?? [];
  }

  getAll(): SmartyStoreShape {
    return { ...this.store };
  }

  clear() {
    this.store = {};
    localStorage.removeItem(STORAGE_KEY);
    this.emit();
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    listener(this.getAll());

    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snapshot = this.getAll();
    this.listeners.forEach((l) => l(snapshot));
  }
}

export const SmartyActionStoreInstance = new SmartyActionStore();
