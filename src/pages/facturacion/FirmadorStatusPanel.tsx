import React, { useState } from 'react'
import { FiWifi, FiWifiOff, FiRefreshCw, FiClock, FiLink } from 'react-icons/fi'
import { FirmadorAPI, FirmadorStatusResponse, FirmadorProbarResponse } from '../../api/firmador'
import { useAuth } from '../../auth/AuthContext'

type PanelState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'status'; data: FirmadorStatusResponse }
  | { phase: 'testing' }
  | { phase: 'test_result'; data: FirmadorProbarResponse }
  | { phase: 'error'; message: string }

export default function FirmadorStatusPanel() {
  const { user } = useAuth() as { user: { role: string } | null }
  const isAdmin   = user?.role === 'admin' || user?.role === 'manager'

  const [state, setState] = useState<PanelState>({ phase: 'idle' })

  async function checkStatus() {
    setState({ phase: 'loading' })
    try {
      const data = await FirmadorAPI.status()
      setState({ phase: 'status', data })
    } catch (e: any) {
      setState({ phase: 'error', message: e.message ?? 'Error desconocido' })
    }
  }

  async function probarConexion() {
    setState({ phase: 'testing' })
    try {
      const data = await FirmadorAPI.probar()
      setState({ phase: 'test_result', data })
    } catch (e: any) {
      setState({ phase: 'error', message: e.message ?? 'Error al probar conexión' })
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'var(--zs-font-mono)',
    fontSize: 12,
    color: 'var(--zs-mute)',
    flexShrink: 0,
    minWidth: 160,
  }
  const valueStyle: React.CSSProperties = {
    fontFamily: 'var(--zs-font-mono)',
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--zs-ink)',
    wordBreak: 'break-all',
  }
  const rowStyle: React.CSSProperties = {
    display: 'flex',
    gap: 12,
    padding: '8px 0',
    borderBottom: '1px dashed var(--zs-line)',
    alignItems: 'flex-start',
  }

  const available =
    state.phase === 'status' ? state.data.available : null

  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--zs-line)',
      borderRadius: 18,
      padding: '18px 20px',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: available === true
            ? '#d1fae5'
            : available === false
              ? '#fee2e2'
              : 'var(--zs-line)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.2s',
        }}>
          {available === true
            ? <FiWifi size={18} color="#065f46" />
            : available === false
              ? <FiWifiOff size={18} color="#991b1b" />
              : <FiWifi size={18} color="var(--zs-mute)" />}
        </div>
        <div>
          <h3 style={{
            fontFamily: 'var(--zs-font-display)',
            fontSize: 17, color: 'var(--zs-green)',
            margin: 0, lineHeight: 1.2,
          }}>
            Estado del Firmador
          </h3>
          <p style={{
            fontFamily: 'var(--zs-font-mono)',
            fontSize: 11, color: 'var(--zs-mute)',
            margin: '2px 0 0',
          }}>
            Servicio DTE · svfe-api-firmador
          </p>
        </div>

        {/* Status badge */}
        {state.phase !== 'idle' && (
          <div style={{ marginLeft: 'auto' }}>
            {(state.phase === 'loading' || state.phase === 'testing') && (
              <span style={{
                fontFamily: 'var(--zs-font-mono)', fontSize: 11,
                color: 'var(--zs-mute)', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <FiRefreshCw size={11} style={{ animation: 'spin 1s linear infinite' }} />
                Consultando…
              </span>
            )}
            {state.phase === 'status' && (
              <span style={{
                padding: '3px 10px', borderRadius: 999,
                fontFamily: 'var(--zs-font-mono)', fontWeight: 700, fontSize: 11,
                background: state.data.available ? '#d1fae5' : '#fee2e2',
                color: state.data.available ? '#065f46' : '#991b1b',
              }}>
                {state.data.available ? 'Disponible' : 'No disponible'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status details */}
      {state.phase === 'status' && (
        <div style={{ marginBottom: 16 }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Disponible</span>
            <span style={{ ...valueStyle, color: state.data.available ? '#065f46' : '#991b1b' }}>
              {state.data.available ? 'Sí' : 'No'}
            </span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Mensaje</span>
            <span style={valueStyle}>{state.data.message}</span>
          </div>
          {state.data.firmador_url && (
            <div style={rowStyle}>
              <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiLink size={11} /> URL
              </span>
              <span style={{ ...valueStyle, fontWeight: 400, color: 'var(--zs-mute)' }}>
                {state.data.firmador_url}
              </span>
            </div>
          )}
          {state.data.latency_ms !== null && (
            <div style={rowStyle}>
              <span style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FiClock size={11} /> Latencia
              </span>
              <span style={valueStyle}>{state.data.latency_ms} ms</span>
            </div>
          )}
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span style={labelStyle}>Última comprobación</span>
            <span style={{ ...valueStyle, fontWeight: 400, fontSize: 12, color: 'var(--zs-mute)' }}>
              {new Date(state.data.checked_at).toLocaleString('es-SV')}
            </span>
          </div>
        </div>
      )}

      {/* Test result */}
      {state.phase === 'test_result' && (
        <div style={{
          background: 'var(--zs-cream)',
          border: '1px solid var(--zs-line)',
          borderRadius: 12,
          padding: '12px 14px',
          marginBottom: 16,
        }}>
          <p style={{
            fontFamily: 'var(--zs-font-mono)', fontSize: 12,
            color: 'var(--zs-mute)', margin: '0 0 6px',
          }}>
            Resultado del diagnóstico
          </p>
          <p style={{
            fontFamily: 'var(--zs-font-mono)', fontSize: 13,
            fontWeight: 700, color: 'var(--zs-ink)', margin: '0 0 4px',
          }}>
            {state.data.diagnostico}
          </p>
          {state.data.mensaje && (
            <p style={{
              fontFamily: 'var(--zs-font-mono)', fontSize: 12,
              color: 'var(--zs-mute)', margin: '4px 0 0',
            }}>
              {state.data.mensaje}
            </p>
          )}
          <p style={{
            fontFamily: 'var(--zs-font-mono)', fontSize: 11,
            color: 'var(--zs-mute)', margin: '8px 0 0',
            fontStyle: 'italic',
          }}>
            {state.data.nota}
          </p>
        </div>
      )}

      {/* Error */}
      {state.phase === 'error' && (
        <div style={{
          background: '#fee2e2', borderRadius: 10,
          padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{
            fontFamily: 'var(--zs-font-mono)', fontSize: 12,
            color: '#991b1b', margin: 0,
          }}>
            {state.message}
          </p>
        </div>
      )}

      {/* Actions */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={checkStatus}
            disabled={state.phase === 'loading' || state.phase === 'testing'}
            style={{ gap: 6, fontSize: 13 }}
          >
            <FiRefreshCw size={13} />
            {state.phase === 'idle' ? 'Comprobar estado' : 'Actualizar estado'}
          </button>

          {state.phase === 'status' && (
            <button
              className="btn btn-secondary"
              onClick={probarConexion}
              disabled={state.phase === 'testing' as any}
              style={{ gap: 6, fontSize: 13 }}
            >
              <FiWifi size={13} /> Probar conexión
            </button>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
