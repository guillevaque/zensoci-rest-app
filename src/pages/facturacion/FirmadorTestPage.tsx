/**
 * Página de prueba temporal para el Firmador Docker.
 * Acceso: http://localhost:5173/firmador-test
 *
 * Llama directo a localhost:8113 via el proxy de Vite (/firmador-local/*).
 * No requiere backend PHP ni sesión.
 *
 * REVERTIR cuando no se necesite: eliminar este archivo y la ruta en App.tsx.
 */
import React, { useState } from 'react'

const PROXY = '/firmador-local'

type Result = { ok: boolean; data: unknown; ms: number }

async function call(method: 'GET' | 'POST', path: string, body?: object): Promise<Result> {
  const t0  = Date.now()
  const res = await fetch(`${PROXY}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body:    body ? JSON.stringify(body) : undefined,
  })
  const ms   = Date.now() - t0
  const text = await res.text()
  let data: unknown = text
  try { data = JSON.parse(text) } catch { /* texto plano */ }
  return { ok: res.ok, data, ms }
}

export default function FirmadorTestPage() {
  const [statusResult, setStatusResult] = useState<Result | null>(null)
  const [signResult,   setSignResult]   = useState<Result | null>(null)
  const [loading,      setLoading]      = useState<'status' | 'sign' | null>(null)

  async function testStatus() {
    setLoading('status')
    setStatusResult(null)
    try {
      setStatusResult(await call('GET', '/firmardocumento/status'))
    } catch (e: any) {
      setStatusResult({ ok: false, data: e.message, ms: 0 })
    }
    setLoading(null)
  }

  async function testSign() {
    setLoading('sign')
    setSignResult(null)
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    const hex   = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
    const guid  = `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`.toUpperCase()

    try {
      setSignResult(await call('POST', '/firmardocumento/', {
        nit:         '00000000000000',
        activo:      true,
        passwordPri: 'test-sin-certificado',
        dteJson: {
          identificacion: {
            version: 1, ambiente: '00', tipoDte: '01',
            numeroControl:    'DTE-01-M001P001-000000000000001',
            codigoGeneracion: guid,
            fecEmi: new Date().toISOString().slice(0, 10),
            horEmi: new Date().toTimeString().slice(0, 8),
            tipoModelo: 1, tipoOperacion: 1,
          },
        },
      }))
    } catch (e: any) {
      setSignResult({ ok: false, data: e.message, ms: 0 })
    }
    setLoading(null)
  }

  const box: React.CSSProperties = {
    background: '#f8f8f8', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '14px 16px', marginTop: 12,
    fontFamily: 'monospace', fontSize: 13, whiteSpace: 'pre-wrap',
    wordBreak: 'break-all', maxHeight: 360, overflowY: 'auto',
  }

  return (
    <div style={{ maxWidth: 680, margin: '40px auto', padding: '0 20px' }}>
      <div style={{
        background: '#fef3c7', border: '1px solid #fbbf24',
        borderRadius: 10, padding: '10px 14px', marginBottom: 24,
        fontFamily: 'monospace', fontSize: 12, color: '#92400e',
      }}>
        Página de prueba temporal — solo funciona con <code>npm run dev</code> y el Firmador corriendo en localhost:8113
      </div>

      <h1 style={{ fontFamily: 'sans-serif', fontSize: 22, marginBottom: 24, color: '#1a202c' }}>
        Prueba Firmador DTE
      </h1>

      {/* ── Test 1: status ── */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontFamily: 'sans-serif', fontSize: 16, color: '#374151', marginBottom: 8 }}>
          1. GET /firmardocumento/status
        </h2>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
          Verifica que el Firmador está corriendo.
        </p>
        <button
          onClick={testStatus}
          disabled={loading !== null}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: '#3b82f6', color: '#fff', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
          }}
        >
          {loading === 'status' ? 'Consultando…' : 'Probar status'}
        </button>

        {statusResult && (
          <div style={box}>
            <div style={{ color: statusResult.ok ? '#065f46' : '#991b1b', fontWeight: 700, marginBottom: 6 }}>
              {statusResult.ok ? '✓ OK' : '✗ ERROR'} · {statusResult.ms}ms
            </div>
            {JSON.stringify(statusResult.data, null, 2)}
          </div>
        )}
      </section>

      {/* ── Test 2: sign ── */}
      <section>
        <h2 style={{ fontFamily: 'sans-serif', fontSize: 16, color: '#374151', marginBottom: 8 }}>
          2. POST /firmardocumento/
        </h2>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          Envía un DTE mínimo con NIT de prueba y sin certificado real.
        </p>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#6b7280', marginBottom: 10 }}>
          Respuesta esperada: <code>status: "ERROR"</code> por certificado ausente — eso es correcto.
        </p>
        <button
          onClick={testSign}
          disabled={loading !== null}
          style={{
            padding: '8px 18px', borderRadius: 8, border: 'none',
            background: '#7c3aed', color: '#fff', cursor: 'pointer',
            fontFamily: 'monospace', fontSize: 13, fontWeight: 700,
          }}
        >
          {loading === 'sign' ? 'Enviando…' : 'Probar firma'}
        </button>

        {signResult && (
          <div style={box}>
            <div style={{ color: signResult.ok ? '#065f46' : '#b45309', fontWeight: 700, marginBottom: 6 }}>
              HTTP {signResult.ok ? 'OK' : 'responded'} · {signResult.ms}ms
              {typeof signResult.data === 'object' && signResult.data !== null &&
               'status' in (signResult.data as any) && (
                <span style={{
                  marginLeft: 10,
                  color: (signResult.data as any).status === 'OK' ? '#065f46' : '#991b1b',
                }}>
                  · Firmador status: {(signResult.data as any).status}
                </span>
              )}
            </div>
            {JSON.stringify(signResult.data, null, 2)}
          </div>
        )}
      </section>
    </div>
  )
}
