import React, { useState } from 'react';
import { MdAdd, MdEdit, MdPeople } from 'react-icons/md';

type Role = 'admin' | 'manager' | 'staff';

type Staff = {
  id: number;
  name: string;
  email: string;
  role: Role;
  position: string;
  status: 'active' | 'inactive';
  color: string;
};

const STAFF: Staff[] = [
  { id: 1, name: 'Andrés García',   email: 'andres@zensoci.com',   role: 'staff',   position: 'Mesero',  status: 'active', color: '#D86835' },
  { id: 2, name: 'Marisol Torres',  email: 'marisol@zensoci.com',  role: 'staff',   position: 'Cajera',  status: 'active', color: '#3C6030' },
  { id: 3, name: 'Carlos Medina',   email: 'carlos@zensoci.com',   role: 'staff',   position: 'Cocina',  status: 'active', color: '#5B8C3A' },
  { id: 4, name: 'Lucía Ramírez',   email: 'lucia@zensoci.com',    role: 'staff',   position: 'Mesera',  status: 'active', color: '#C0392B' },
  { id: 5, name: 'Pablo Vásquez',   email: 'pablo@zensoci.com',    role: 'manager', position: 'Manager', status: 'active', color: '#2C3E50' },
  { id: 6, name: 'Sofía Jiménez',   email: 'sofia@zensoci.com',    role: 'staff',   position: 'Mesera',  status: 'active', color: '#E07B54' },
  { id: 7, name: 'Admin Zensoci',   email: 'admin@zensoci.com',    role: 'admin',   position: 'Admin',   status: 'active', color: '#1C2B1A' },
];

const ROLE_BADGE: Record<Role, { label: string; bg: string; color: string }> = {
  admin:   { label: 'Admin',   bg: '#FEF3EE', color: '#D86835' },
  manager: { label: 'Manager', bg: '#DBE4FF', color: '#3451B2' },
  staff:   { label: 'Staff',   bg: '#EEF4EC', color: '#3C6030' },
};

export default function Personal() {
  const [staff] = useState<Staff[]>(STAFF);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">PERSONAL</h1>
          <p className="page-subtitle">Gestión de usuarios y accesos</p>
        </div>
        <button className="btn btn-primary">
          <MdAdd size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total personal', value: staff.length, icon: '👥' },
          { label: 'Activos hoy',    value: staff.filter(s => s.status === 'active').length, icon: '✅' },
          { label: 'Managers',       value: staff.filter(s => s.role === 'manager' || s.role === 'admin').length, icon: '⭐' },
        ].map((s, i) => (
          <div key={i} className="card flex items-center gap-4">
            <div className="w-11 h-11 rounded-zs flex items-center justify-center text-xl flex-shrink-0" style={{ background: '#EEF4EC' }}>
              {s.icon}
            </div>
            <div>
              <div className="font-black text-2xl" style={{ color: '#1C2B1A' }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#6B7A69' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Staff table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="zs-table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Cargo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {staff.map(s => {
              const rb = ROLE_BADGE[s.role];
              return (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: s.color, color: '#fff' }}
                      >
                        {s.name[0]}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: '#1C2B1A' }}>{s.name}</span>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: '#6B7A69' }}>{s.email}</td>
                  <td className="text-sm" style={{ color: '#1C2B1A' }}>{s.position}</td>
                  <td>
                    <span className="badge" style={{ background: rb.bg, color: rb.color }}>{rb.label}</span>
                  </td>
                  <td>
                    <span className="badge badge-green">{s.status === 'active' ? 'Activo' : 'Inactivo'}</span>
                  </td>
                  <td className="text-right">
                    <button className="btn btn-ghost" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                      <MdEdit size={13} /> Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info card */}
      <div className="card flex gap-4 items-start" style={{ background: '#EEF4EC', border: '1px solid #D6E8D1' }}>
        <div className="w-10 h-10 rounded-zs flex items-center justify-center flex-shrink-0" style={{ background: '#3C6030' }}>
          <MdPeople size={20} style={{ color: '#fff' }} />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: '#1C2B1A' }}>Gestión de accesos por PIN</div>
          <div className="text-xs mt-0.5" style={{ color: '#3C6030' }}>
            Cada usuario tiene un PIN de 4 dígitos para ingresar al sistema. Los PINs se gestionan desde el panel de administración de Hostinger. Próximamente podrás cambiarlos desde aquí.
          </div>
        </div>
      </div>
    </div>
  );
}
