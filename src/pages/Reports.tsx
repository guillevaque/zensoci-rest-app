import React from 'react'
export const Reports: React.FC = () => {
  return <div className="card">
    <h2 className="font-semibold">Reportes</h2>
    <ul className="list-disc pl-4 text-sm text-gray-700">
      <li>Ventas por día</li>
      <li>Productos más vendidos</li>
      <li>IVA y libros DTE (futuro)</li>
    </ul>
  </div>
}