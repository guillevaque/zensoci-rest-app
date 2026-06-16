import React from 'react'
import { FaGears } from 'react-icons/fa6'
import { MdReceipt, MdStorage } from 'react-icons/md'

export const Settings: React.FC = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Ajustes</h1>
        <p className="page-subtitle">Configura tu entorno y conexiones</p>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* DTE */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #E2EAE0' }}>
            <div
              className="w-10 h-10 rounded-zs flex items-center justify-center"
              style={{ background: '#EEF4EC' }}
            >
              <MdReceipt size={20} style={{ color: '#3C6030' }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: '#1C2B1A' }}>DTE (MH)</div>
              <div className="text-xs" style={{ color: '#6B7A69' }}>Facturación electrónica — Próximamente</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1A' }}>Ambiente</label>
              <select
                className="input"
                style={{ cursor: 'pointer' }}
              >
                <option>Sandbox</option>
                <option>Producción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1A' }}>Client ID</label>
              <input className="input" placeholder="Tu client ID del MH…" />
            </div>
            <button className="btn btn-primary" disabled style={{ opacity: 0.5 }}>
              <FaGears size={14} /> Guardar DTE
            </button>
          </div>
        </div>

        {/* DB connection */}
        <div className="card space-y-4">
          <div className="flex items-center gap-3 pb-3" style={{ borderBottom: '1px solid #E2EAE0' }}>
            <div
              className="w-10 h-10 rounded-zs flex items-center justify-center"
              style={{ background: '#EEF4EC' }}
            >
              <MdStorage size={20} style={{ color: '#3C6030' }} />
            </div>
            <div>
              <div className="font-bold" style={{ color: '#1C2B1A' }}>Base de datos</div>
              <div className="text-xs" style={{ color: '#6B7A69' }}>Conexión con tu API en Hostinger</div>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-semibold mb-1.5" style={{ color: '#1C2B1A' }}>URL base de la API</label>
              <input className="input" placeholder="https://tu-api.zensoci.com" />
            </div>
            <div
              className="flex items-center gap-2 rounded-zs px-3 py-2.5 text-sm"
              style={{ background: '#DCFCE7', color: '#166534' }}
            >
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Conectado a app.zensoci.com
            </div>
            <button className="btn btn-ghost" disabled style={{ opacity: 0.5 }}>
              Actualizar URL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
