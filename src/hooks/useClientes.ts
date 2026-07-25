import { useState, useEffect, useCallback, useRef } from 'react';
import { ClientesService, type ClientesQuery } from '../services/clientes.service';
import type { Cliente, CreateCliente, UpdateCliente } from '../types/dte';

type State = {
  clientes:  Cliente[];
  total:     number;
  page:      number;
  lastPage:  number;
  loading:   boolean;
  error:     string | null;
};

const INITIAL: State = {
  clientes: [],
  total:    0,
  page:     1,
  lastPage: 1,
  loading:  true,
  error:    null,
};

export function useClientes(initialQuery: ClientesQuery = {}) {
  const [state,  setState]  = useState<State>(INITIAL);
  const [query,  setQuery]  = useState<ClientesQuery>({ per_page: 25, ...initialQuery });
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async (q: ClientesQuery = query) => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await ClientesService.getAll(q);
      setState({
        clientes: res.data,
        total:    res.total,
        page:     res.page,
        lastPage: res.last_page,
        loading:  false,
        error:    null,
      });
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setState(s => ({ ...s, loading: false, error: err.message ?? 'Error al cargar' }));
    }
  }, [query]);

  useEffect(() => { load(query); }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

  const search   = useCallback((q: string)    => setQuery(s => ({ ...s, q, page: 1 })), []);
  const setPage  = useCallback((p: number)    => setQuery(s => ({ ...s, page: p })), []);

  const create = useCallback(async (data: CreateCliente): Promise<Cliente> => {
    const created = await ClientesService.create(data);
    await load({ ...query, page: 1 });
    return created;
  }, [load, query]);

  const update = useCallback(async (data: UpdateCliente): Promise<Cliente> => {
    const updated = await ClientesService.update(data);
    setState(s => ({
      ...s,
      clientes: s.clientes.map(c => c.id === updated.id ? updated : c),
    }));
    return updated;
  }, []);

  const toggle = useCallback(async (id: number, activo: boolean) => {
    await ClientesService.setActivo(id, activo);
    setState(s => ({
      ...s,
      clientes: s.clientes.map(c =>
        c.id === id ? { ...c, activo: activo ? 1 : 0 } : c
      ),
    }));
  }, []);

  return {
    ...state,
    query,
    search,
    setPage,
    create,
    update,
    toggle,
    reload: () => load(query),
  };
}
