import { useState } from "react";
import { useAuth } from "../auth/AuthContext";

const brandGreen = "#3C6030";
const brandOrange = "#D86835";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    await login(form); // visual
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar compacto con logo */}
      <div style={{ background: brandGreen }} className="w-full">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-3 text-white">
          <img src="/logo-zensoci.png" alt="Zensoci" className="h-7 w-auto" />
          <span className="font-semibold">Restaurante Vegano</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="mx-auto max-w-md bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-extrabold text-center mb-2">Bienvenido</h1>
          <p className="text-center text-gray-500 mb-8">Inicia sesión para gestionar tu restaurante</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1">Correo Electrónico</label>
              <div className="rounded-xl border border-gray-300 overflow-hidden">
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <div className="rounded-xl border border-gray-300 overflow-hidden flex items-center">
                <input
                  type={show ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-3 outline-none"
                />
                <button type="button" onClick={() => setShow((v) => !v)} className="px-3 text-gray-500">
                  {show ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              style={{ background: brandOrange }}
              className="w-full rounded-xl py-3 text-white font-semibold hover:opacity-95 transition"
            >
              Iniciar Sesión
            </button>

            <p className="text-center text-sm text-gray-500">
              Usa un correo con “@admin” para entrar como <strong>Administrador</strong> (visual).
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
