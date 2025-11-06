import React from 'react'
export const Settings: React.FC = () => {
  return <div className="card">
    <h2 className="font-semibold">Ajustes</h2>
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <div>
        <h3 className="font-medium mb-2">DTE (MH) — Futuro</h3>
        <label className="block text-sm">Ambiente</label>
        <select className="border rounded p-2 w-full">
          <option>Sandbox</option>
          <option>Producción</option>
        </select>
        <label className="block text-sm mt-2">Client ID</label>
        <input className="border rounded p-2 w-full" placeholder="..."/>
      </div>
      <div>
        <h3 className="font-medium mb-2">Base de datos (Hostinger) — Futuro</h3>
        <p className="text-sm text-gray-600">Conecta tu API en Hostinger y guarda aquí la URL base.</p>
        <input className="border rounded p-2 w-full" placeholder="https://tu-api.com"/>
      </div>
    </div>
  </div>
}