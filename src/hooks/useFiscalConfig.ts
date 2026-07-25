import { useState, useEffect, useCallback } from 'react';
import { FiscalService } from '../services/fiscal.service';
import type {
  ConfiguracionFiscal,
  CreateConfiguracionFiscal,
  UpdateConfiguracionFiscal,
} from '../types/dte';

type State = {
  config:   ConfiguracionFiscal | null;
  loading:  boolean;
  error:    string | null;
};

export function useFiscalConfig() {
  const [state, setState] = useState<State>({
    config:  null,
    loading: true,
    error:   null,
  });

  const load = useCallback(async () => {
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const data = await FiscalService.get();
      setState({ config: data, loading: false, error: null });
    } catch (err: any) {
      setState(s => ({ ...s, loading: false, error: err.message ?? 'Error al cargar' }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(
    async (data: CreateConfiguracionFiscal | UpdateConfiguracionFiscal) => {
      setState(s => ({ ...s, loading: true, error: null }));
      try {
        const updated = 'id' in data
          ? await FiscalService.update(data as UpdateConfiguracionFiscal)
          : await FiscalService.create(data as CreateConfiguracionFiscal);
        setState({ config: updated, loading: false, error: null });
        return updated;
      } catch (err: any) {
        setState(s => ({ ...s, loading: false, error: err.message ?? 'Error al guardar' }));
        throw err;
      }
    },
    []
  );

  return { ...state, load, save };
}
