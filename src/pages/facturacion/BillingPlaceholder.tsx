import React from 'react';
import { FiFileText } from 'react-icons/fi';

export default function BillingPlaceholder({ title }: { title: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: 360, padding: '40px 24px',
      gap: 20, textAlign: 'center',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 20,
        background: 'var(--zs-line)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <FiFileText size={32} color="var(--zs-mute)" />
      </div>
      <div>
        <h2 style={{
          fontFamily: 'var(--zs-font-display)', fontSize: 28,
          color: 'var(--zs-green)', margin: 0, lineHeight: 1,
        }}>
          {title}
        </h2>
        <p style={{
          fontFamily: 'var(--zs-font-mono)', color: 'var(--zs-mute)',
          fontSize: 14, margin: '12px 0 0',
        }}>
          Módulo en construcción · Próximamente disponible
        </p>
      </div>
    </div>
  );
}
