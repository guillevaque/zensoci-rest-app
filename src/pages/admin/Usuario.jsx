import { useEffect, useMemo, useState } from "react";

const brandOrange = "#D86835";

const seed = [
  { id: "u1", name: "Laura", email: "laura@admin", role: "admin" },
  { id: "u2", name: "Guillermo", email: "memo@correo.com", role: "user" },
];

export default function Usuarios() {
  const [rows, setRows] = useState(seed);
  const [q, setQ] = useState("");
  const [modal, setModal] = useState({ open: false, mode: "add", data: null });
  const filtered = useMemo(
    () => rows.filter(r => `${r.name} ${r.email} ${r.role}`.toLowerCase().includes(q.toLowerCase())),
    [rows, q]
  );

  const onSave = (payload) => {
    if (modal.mode === "add") {
      setRows(prev => [...prev, { ...payload, id: crypto.randomUUID() }]);
    } else {
      setRows(prev => prev.map(r => (r.id === payload.id ? payload : r)));
    }
    setModal({ open: false, mode: "add", data: null });
  };

  const onDelete = (id) => {
    if (confirm("¿Eliminar usuario?")) setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <button
          onClick={() => setModal({ open: true, mode: "add", data: { name: "", email: "", role: "user" } })}
          style={{ background: brandOrange }}
          className="text-white px-4 py-2 rounded-xl"
        >
          + Agregar nuevo
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nombre, email o rol"
          className="w-full max-w-md px-3 py-2 rounded-xl border border-gray-300 outline-none"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50 text-left text-sm">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">{r.name}</td>
                <td className="px-4 py-3">{r.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 rounded-lg bg-gray-100">{r.role}</span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => setModal({ open: true, mode: "edit", data: r })}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-4 py-8 text-center text-gray-500" colSpan={4}>Sin resultados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal.open && (
        <Modal onClose={() => setModal({ open: false, mode: "add", data: null })}>
          <FormUser
            initial={modal.data}
            mode={modal.mode}
            onCancel={() => setModal({ open: false, mode: "add", data: null })}
            onSave={onSave}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function FormUser({ initial, mode, onCancel, onSave }) {
  const [data, setData] = useState(initial);

  const submit = (e) => {
    e.preventDefault();
    onSave(data);
  };

  return (
    <form onSubmit={submit} className="p-6 space-y-4">
      <h2 className="text-xl font-semibold mb-2">{mode === "add" ? "Agregar Usuario" : "Editar Usuario"}</h2>

      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm mb-1">Nombre</label>
          <input
            className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none"
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Correo</label>
          <input
            type="email"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none"
            value={data.email}
            onChange={(e) => setData((d) => ({ ...d, email: e.target.value }))}
            required
          />
        </div>
        <div>
          <label className="block text-sm mb-1">Rol</label>
          <select
            className="w-full px-3 py-2 rounded-xl border border-gray-300 outline-none"
            value={data.role}
            onChange={(e) => setData((d) => ({ ...d, role: e.target.value }))}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl border border-gray-300">
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 rounded-xl text-white" style={{ background: brandOrange }}>
          Guardar
        </button>
      </div>
    </form>
  );
}
