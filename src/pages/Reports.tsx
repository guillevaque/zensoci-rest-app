import React from 'react'
import { TbReportAnalytics } from 'react-icons/tb'
import { MdTrendingUp, MdBarChart, MdReceipt } from 'react-icons/md'

const upcomingReports = [
  { icon: <MdTrendingUp size={22} />, title: 'Ventas por día', desc: 'Visualiza las ventas diarias y tendencias.' },
  { icon: <MdBarChart size={22} />,   title: 'Productos más vendidos', desc: 'Identifica los platillos con más salida.' },
  { icon: <MdReceipt size={22} />,    title: 'IVA y libros DTE', desc: 'Generación de libros fiscales (próximamente).' },
]

export const Reports: React.FC = () => {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">Reportes</h1>
        <p className="page-subtitle">Análisis y estadísticas de tu restaurante</p>
      </div>

      <div className="card flex flex-col items-center justify-center py-14 gap-4" style={{ borderStyle: 'dashed' }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: '#EEF4EC' }}
        >
          <TbReportAnalytics size={32} style={{ color: '#3C6030' }} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg" style={{ color: '#1C2B1A' }}>Módulo en desarrollo</p>
          <p className="text-sm mt-1" style={{ color: '#6B7A69' }}>Los reportes estarán disponibles próximamente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {upcomingReports.map((r, i) => (
          <div key={i} className="card flex gap-4 items-start opacity-60">
            <div
              className="w-11 h-11 rounded-zs flex items-center justify-center flex-shrink-0"
              style={{ background: '#EEF4EC', color: '#3C6030' }}
            >
              {r.icon}
            </div>
            <div>
              <div className="font-semibold text-sm" style={{ color: '#1C2B1A' }}>{r.title}</div>
              <div className="text-xs mt-0.5" style={{ color: '#6B7A69' }}>{r.desc}</div>
              <span className="badge badge-blue mt-2" style={{ fontSize: '0.65rem' }}>Próximamente</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
