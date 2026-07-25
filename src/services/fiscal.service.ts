import { http } from './http';
import type {
  ConfiguracionFiscal,
  CreateConfiguracionFiscal,
  UpdateConfiguracionFiscal,
} from '../types/dte';

export const FiscalService = {
  get: (): Promise<ConfiguracionFiscal | null> =>
    http.get('/facturacion/fiscal-config.php'),

  create: (data: CreateConfiguracionFiscal): Promise<ConfiguracionFiscal> =>
    http.post('/facturacion/fiscal-config.php', data),

  update: (data: UpdateConfiguracionFiscal): Promise<ConfiguracionFiscal> =>
    http.put('/facturacion/fiscal-config.php', data),
};
