# Infraestructura local — svfe-api-firmador

## Descripción

El Firmador es el servicio oficial del Ministerio de Hacienda de El Salvador  
que realiza la firma criptográfica de los Documentos Tributarios Electrónicos (DTE)  
antes de su transmisión al sistema de recepción del MH.

**Imagen oficial:** `svfe/svfe-api-firmador:v20260316`  
**Puerto:** `8113` (HTTP, sin SSL — solo para uso local)

---

## Arquitectura de integración

```
React (Frontend)
    └── API PHP Zensoci   (/api/facturacion/dte/firmador-status.php)
            └── FirmadorClient.php
                    └── Firmador Docker  (localhost:8113)
```

React **nunca** llama directamente al puerto 8113.

---

## Requisitos previos

- Docker Desktop instalado y corriendo
- Certificado digital `.p12` del emisor (obtenido en el MH)
- Contraseña del certificado (definida al momento de generarlo en el MH)

---

## Levantar el Firmador localmente

```bash
# 1. Copiar el archivo de entorno de ejemplo
cp infra/firmador/svfe-api.env.example infra/firmador/svfe-api.env
# Editar svfe-api.env con los valores reales (NIT, certificado, etc.)

# 2. Colocar el certificado en la carpeta local montada
#    (la carpeta certificado/ está en .gitignore)
mkdir -p infra/firmador/certificado
cp /ruta/a/tu/certificado.p12 infra/firmador/certificado/

# 3. Levantar el servicio
docker compose -f infra/firmador/docker-compose.example.yml up -d

# 4. Verificar que responde
curl http://localhost:8113/firmardocumento/status
# Respuesta esperada: Application is running...!!
```

---

## Endpoints del Firmador

### GET /firmardocumento/status

Verifica que el servicio está corriendo.

**Respuesta exitosa (HTTP 200):**
```
Application is running...!!
```

### POST /firmardocumento/

Firma un documento DTE.

**Request:**
```json
{
  "nit": "00000000000000",
  "activo": true,
  "passwordPri": "contraseña_del_certificado",
  "dteJson": { ... }
}
```

**Respuesta exitosa (HTTP 200):**
```json
{
  "status": "OK",
  "descripcionMsg": "...",
  "body": "...firma_base64..."
}
```

**Respuesta de error funcional (también HTTP 200):**
```json
{
  "status": "ERROR",
  "descripcionMsg": "El certificado no existe o la contraseña es incorrecta",
  "observaciones": "..."
}
```

> **Importante:** El Firmador puede devolver HTTP 200 tanto para éxito como para errores  
> funcionales. Siempre verificar el campo `status` de la respuesta.

---

## Errores comunes

| Síntoma | Causa probable | Solución |
|---------|---------------|---------|
| `status: ERROR`, mensaje de certificado | Certificado ausente o contraseña incorrecta | Verificar ruta y password del .p12 |
| Connection refused | Docker no está corriendo | `docker compose up -d` |
| Timeout | Firewall o puerto bloqueado | Verificar que 8113 esté libre |

---

## Nota sobre localhost vs. host.docker.internal

- **PHP corriendo directamente en la máquina:** usar `http://localhost:8113`
- **PHP corriendo dentro de un contenedor Docker:** usar `http://host.docker.internal:8113`

Configurable en `DTE_FIRMADOR_URL` (ver `.env.example`).

---

## Limitación en Hostinger

El Firmador Docker **no puede ejecutarse en Hostinger** (hosting compartido).  
El flujo local sirve exclusivamente para desarrollo y pruebas.  
En producción, el Firmador debe ejecutarse en un servidor propio (VPS, cloud)  
con acceso seguro desde el backend PHP (red privada o VPN).

---

## Siguiente etapa

La siguiente fase contempla:
1. Integración completa del schema DTE (validación antes de firmar)
2. Transmisión al MH via `/api/transmision` del sistema oficial
3. Almacenamiento del sello de recepción en la base de datos
4. Generación de PDF del DTE firmado

---

## Seguridad

- La contraseña del certificado (`passwordPri`) **nunca** se registra en logs.
- El archivo `.p12` del certificado **nunca** se sube al repositorio.
- La carpeta `infra/firmador/certificado/` está en `.gitignore`.
- El endpoint de prueba solo funciona con `DTE_ENV=local`.
