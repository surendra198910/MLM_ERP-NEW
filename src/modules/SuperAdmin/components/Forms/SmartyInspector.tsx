import React, { useEffect, useState } from "react";
import {
  SmartyActionStoreInstance,
  type SmartyStoreShape,
} from "../../../../core/smarty/SmartyActionStore";

const SmartyInspector: React.FC = () => {
  const [store, setStore] = useState<SmartyStoreShape>(
    SmartyActionStoreInstance.getAll()
  );

  const [pageName, setPageName] = useState("");
  const [actions, setActions] = useState<any[]>([]);
  const [error, setError] = useState("");

  // 🔔 keep store in sync (live updates)
  useEffect(() => {
    return SmartyActionStoreInstance.subscribe(setStore);
  }, []);

  // 🔍 Fetch actions for entered page
  const fetchActions = () => {
    if (!pageName.trim()) {
      setError("Please enter a page name");
      setActions([]);
      return;
    }

    const result = store[pageName.trim()];

    if (!result || result.length === 0) {
      setError("No actions found for this page");
      setActions([]);
      return;
    }

    setError("");
    setActions(result);
  };

  // 📦 group by tag (button, div, input, etc.)
  const grouped = actions.reduce((acc: any, a) => {
    if (!acc[a.tag]) acc[a.tag] = [];
    acc[a.tag].push(a);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">
        Smarty Action Inspector
      </h2>

      {/* INPUT + BUTTON */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Enter Page Name (e.g. SuperAdmin.FormCategories)"
          value={pageName}
          onChange={(e) => setPageName(e.target.value)}
          className="border px-3 py-2 rounded w-[360px]"
        />

        <button
          onClick={fetchActions}
          className="px-4 py-2 bg-blue-600 text-white rounded"
        >
          Fetch Actions
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <p className="text-red-500 mb-4">{error}</p>
      )}

      {/* RESULTS */}
      {Object.keys(grouped).length === 0 && !error && (
        <p className="text-gray-500">
          No actions to display.
        </p>
      )}

      {Object.entries(grouped).map(([tag, items]: any) => (
        <div key={tag} className="mb-6">
          <h3 className="font-semibold text-lg mb-2 uppercase">
            {tag}
          </h3>

          <table className="w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-3 py-1">Action</th>
                <th className="border px-3 py-1">Type</th>
                <th className="border px-3 py-1">Text</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a: any, i: number) => (
                <tr key={i}>
                  <td className="border px-3 py-1">{a.action}</td>
                  <td className="border px-3 py-1">{a.type || "-"}</td>
                  <td className="border px-3 py-1">{a.text || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
};

export default SmartyInspector;
