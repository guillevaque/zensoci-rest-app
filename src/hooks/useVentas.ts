import { useState, useCallback, useRef } from 'react'
import { VentasService, type VentasQuery, type VentasListResponse } from '../services/ventas.service'
import type { Venta } from '../types/ventas'

interface VentasState {
  ventas:    Venta[]
  total:     number
  page:      number
  lastPage:  number
  loading:   boolean
  error:     string | null
}

const initial: VentasState = {
  ventas:   [],
  total:    0,
  page:     1,
  lastPage: 1,
  loading:  false,
  error:    null,
}

export function useVentas() {
  const [state, setState]   = useState<VentasState>(initial)
  const [query, setQuery]   = useState<VentasQuery>({ page: 1, per_page: 25 })
  const abortRef            = useRef<AbortController | null>(null)

  const load = useCallback(async (q: VentasQuery) => {
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const res: VentasListResponse = await VentasService.getAll(q)
      setState({
        ventas:   res.data,
        total:    res.total,
        page:     res.page,
        lastPage: res.last_page,
        loading:  false,
        error:    null,
      })
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return
      setState(s => ({
        ...s,
        loading: false,
        error:   err instanceof Error ? err.message : 'Error desconocido',
      }))
    }
  }, [])

  const search = useCallback((q: Partial<VentasQuery>) => {
    const next = { ...query, ...q, page: 1 }
    setQuery(next)
    load(next)
  }, [query, load])

  const setPage = useCallback((page: number) => {
    const next = { ...query, page }
    setQuery(next)
    load(next)
  }, [query, load])

  const reload = useCallback(() => load(query), [load, query])

  const cerrar = useCallback(async (id: number) => {
    const updated = await VentasService.cerrar(id)
    setState(s => ({
      ...s,
      ventas: s.ventas.map(v => v.id === id ? { ...v, ...updated } : v),
    }))
    return updated
  }, [])

  const anular = useCallback(async (id: number) => {
    await VentasService.anular(id)
    setState(s => ({
      ...s,
      ventas: s.ventas.map(v => v.id === id ? { ...v, estado: 'ANULADA' as const } : v),
    }))
  }, [])

  return { ...state, query, search, setPage, reload, cerrar, anular }
}
