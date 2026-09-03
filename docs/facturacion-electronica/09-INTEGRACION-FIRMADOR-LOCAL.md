# 09 — Integración Diagnóstica con el Firmador DTE (Local)

## Objetivo de esta fase

Integración **diagnóstica y desacoplada** entre el backend PHP de Zensoci y el Firmador Docker.

**Esta fase NO:**
- genera facturas completas
- transmite documentos al Ministerio de Hacienda
- requiere certificado válido para ejecutar la prueba diagnóstica

---

## Arquitectura

```
React (Frontend)
    │  Solo llama a rutas del backend PHP de Zensoci
    ▼
API PHP Zensoci
    │  /api/facturacion/dte/firmador-status.php
    │  /api/facturacion/dte/firmador-probar.php
    ▼
FirmadorClient.php
    │  Wrapper HTTP con cURL
    ▼
Firmador Docker  (localhost:8113)
    │  GET  /firmardocumento/status
    │  POST /firmardocumento/
    ▼
(En fases futuras → Ministerio de Hacienda)
```

**React nunca llama directamente al puerto 8113.**

---

## Imagen oficial

```
svfe/svfe-api-firmador:v20260316
```

Registrada en Docker Hub bajo el usuario oficial `svfe`.

---

## Levantar el Firmador sin SSL (desarrollo local)

El Firmador corre en HTTP puro (`localhost:8113`). No usa HTTPS localmente.

```bash
# 1. Preparar entorno
cp infra/firmador/svfe-api.env.example infra/firmador/svfe-api.env
# Editar svfe-api.env con NIT y demás variables

# 2. Certificado (opcional para diagnóstico, requerido para firma real)
mkdir -p infra/firmador/certificado
# cp /ruta/tu.p12 infra/firmador/certificado/

# 3. Levantar
docker compose -f infra/firmador/docker-compose.example.yml up -d

# 4. Verificar
curl http://localhost:8113/firmardocumento/status
```

**Respuesta esperada:**
```
Application is running...!!
```

---

## Endpoint: GET /firmardocumento/status

Verifica que el servicio está activo.

- **Método:** GET
- **Autenticación:** ninguna (servicio local)
- **Respuesta:** texto plano `Application is running...!!`

---

## Endpoint: POST /firmardocumento/

Firma un DTE. El endpoint **termina en barra** (`/firmardocumento/`).

- **Método:** POST
- **Content-Type:** `application/json`
- **Accept:** `application/json`

### Request

```json
{
  "nit": "00000000000000",
  "activo": true,
  "passwordPri": "contraseña_del_certificado",
  "dteJson": {
    "identificacion": { ... },
    "emisor": { ... },
    "receptor": { ... },
    "cuerpoDocumento": [ ... ],
    "resumen": { ... }
  }
}
```

### Respuesta exitosa (HTTP 200, status OK)

```json
{
  "status": "OK",
  "descripcionMsg": "...",
  "body": "...firma_criptografica_base64..."
}
```

### Respuesta de error funcional (también HTTP 200, status ERROR)

```json
{
  "status": "ERROR",
  "descripcionMsg": "El certificado no existe o la contraseña es incorrecta"
}
```

> **IMPORTANTE:** El Firmador devuelve HTTP 200 tanto para éxito como para errores funcionales.
> El campo `status` es la única fuente de verdad sobre el resultado.
> `FirmadorClient::sign()` lanza `FirmadorException` cuando `status === "ERROR"`.

---

## Errores funcionales con HTTP 200

| status | Causa                                     | Acción                         |
|--------|-------------------------------------------|-------------------------------|
| ERROR  | Certificado ausente                       | Colocar .p12 en /uploads      |
| ERROR  | Contraseña incorrecta                     | Verificar DTE_FIRMADOR_TEST_PASSWORD |
| ERROR  | NIT no coincide con certificado           | Usar NIT del certificado       |
| ERROR  | DTE mal formado                           | Validar contra JSON Schema     |

---

## Configuración

Variables de entorno del **backend PHP** (Hostinger o `.htaccess`):

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `DTE_FIRMADOR_ENABLED` | Habilitar integración | `true` |
| `DTE_FIRMADOR_URL` | URL base del Firmador | `http://localhost:8113` |
| `DTE_FIRMADOR_TIMEOUT_SECONDS` | Timeout cURL | `8` |
| `DTE_ENV` | Entorno (`local`/`production`) | `local` |
| `DTE_FIRMADOR_TEST_NIT` | NIT para diagnóstico | (solo local) |
| `DTE_FIRMADOR_TEST_PASSWORD` | Password para diagnóstico | (solo local) |

Ver `.env.example` en la raíz del repositorio para documentación completa.

---

## Seguridad

- `passwordPri` **nunca** se registra en logs ni aparece en respuestas al frontend
- El archivo `.p12` no se sube al repositorio
- `infra/firmador/certificado/` está en `.gitignore`
- El endpoint `firmador-probar.php` solo funciona con `DTE_ENV=local`
- Las credenciales de prueba se leen del entorno, nunca del body de la petición
- Los stack traces internos no se exponen al frontend

---

## Prueba manual con Postman

### 1. Status

```
GET http://localhost:8113/firmardocumento/status
```

### 2. Firma (diagnóstica — esperar error por certificado)

```
POST http://localhost:8113/firmardocumento/
Content-Type: application/json

{
  "nit": "00000000000000",
  "activo": true,
  "passwordPri": "test123",
  "dteJson": {
    "identificacion": {
      "version": 1,
      "ambiente": "00",
      "tipoDte": "01"
    }
  }
}
```

**Respuesta esperada (sin certificado):**
```json
{
  "status": "ERROR",
  "descripcionMsg": "El certificado no existe o la contraseña es incorrecta"
}
```
Esto confirma que el Firmador está funcionando y rechaza de forma controlada.

---

## Prueba directa por PHP CLI

El script `scripts/test-firmador-local.php` valida la integración completa:

```
PHP CLI
  → FirmadorClient (reutiliza las clases existentes)
    → Docker Firmador en localhost:8113
```

No requiere Hostinger, ngrok, sesión web ni certificado real.

### Requisito previo

El Firmador Docker debe estar corriendo:

```bash
docker run -d -p 8113:8113 svfe/svfe-api-firmador:v20260316
# o con compose:
docker compose -f infra/firmador/docker-compose.example.yml up -d

# Verificar:
curl http://localhost:8113/firmardocumento/status
```

### Comando de ejecución

Desde la **raíz del repositorio**:

```bash
# Linux / macOS / Git Bash
php scripts/test-firmador-local.php

# Windows (CMD o PowerShell, si PHP está en PATH)
php scripts\test-firmador-local.php

# Windows (PHP de XAMPP no en PATH)
C:\xampp\php\php.exe scripts\test-firmador-local.php

# Windows (PHP de Laragon)
C:\laragon\bin\php\php-8.x.x-Win32-vs16-x64\php.exe scripts\test-firmador-local.php
```

### Salida esperada (Firmador corriendo)

```
─────────────────────────────────────────────
 Prueba local: FirmadorClient → Docker :8113 
─────────────────────────────────────────────

[1] GET /firmardocumento/status
healthCheck: {"available":true,"message":"Application is running...!!","latency_ms":12}

[2] POST /firmardocumento/
    (NIT de prueba, sin certificado real — error esperado)
POST llegó al Firmador.
Resultado esperado sin certificado: El certificado no existe o la contraseña es incorrecta
Respuesta del Firmador: {"status":"ERROR","descripcionMsg":"El certificado no existe o la contraseña es incorrecta"}

─────────────────────────────────────────────
 OK — Integración PHP ↔ Firmador validada   
 No se transmitió al Ministerio de Hacienda  
─────────────────────────────────────────────
```

### Salida cuando el Firmador no está corriendo

```
[1] GET /firmardocumento/status
healthCheck: {"available":false,"message":"No se pudo conectar con el Firmador","latency_ms":1}

ERROR: Firmador no disponible — No se pudo conectar con el Firmador
Verifica que el contenedor esté corriendo:
  docker ps | grep firmador
  curl http://localhost:8113/firmardocumento/status
```

### Códigos de salida

| Código | Significado |
|--------|-------------|
| `0` | healthCheck OK y POST llegó al Firmador (error de certificado es correcto) |
| `1` | Firmador no disponible — Docker no está corriendo o URL incorrecta |
| `2` | Error inesperado de PHP, cURL o configuración |

### Por qué `status: ERROR` es el resultado correcto

El Firmador rechaza el POST porque no hay un certificado `.p12` válido en `/uploads`.
Eso confirma que:
1. PHP alcanzó el Docker
2. El Docker procesó la petición
3. El protocolo de firma funciona
4. `FirmadorClient` interpreta correctamente el `status: ERROR` con HTTP 200

No se firmó ningún documento. No se transmitió nada al Ministerio de Hacienda.

### Nota sobre localhost

`localhost:8113` funciona **solo cuando PHP y Docker corren en la misma máquina**.

| Contexto | URL |
|---|---|
| PHP en tu máquina + Docker en tu máquina | `http://localhost:8113` |
| PHP en contenedor Docker + Firmador en otro contenedor | `http://host.docker.internal:8113` |
| PHP en Hostinger + Firmador en tu máquina | **Imposible** — redes distintas |
| PHP en Hostinger + Firmador en VPS | `http://IP_PRIVADA_VPS:8113` |

### Sustitución futura (producción en VPS)

Cuando el Firmador esté en un VPS propio, solo cambia la variable de entorno:

```
# Antes (local):
DTE_FIRMADOR_URL=http://localhost:8113

# Después (VPS con IP privada o dominio interno):
DTE_FIRMADOR_URL=http://192.168.1.100:8113
# o
DTE_FIRMADOR_URL=http://firmador.internal:8113
```

No se modifica ningún código — solo la configuración.

---

## localhost vs. host.docker.internal

| Contexto PHP | URL a usar |
|---|---|
| PHP corriendo directamente en la máquina | `http://localhost:8113` |
| PHP corriendo dentro de un contenedor Docker | `http://host.docker.internal:8113` |

Configurable en `DTE_FIRMADOR_URL` sin cambiar código.

---

## Limitación en Hostinger

Hostinger (shared hosting) **no admite Docker**.

El Firmador en producción debe correr en un VPS o servidor dedicado accesible desde
el backend PHP vía red privada o VPN. Esta fase local sirve exclusivamente para
validar la integración antes del despliegue.

---

## Endpoints internos de Zensoci

| Endpoint | Método | Requiere |
|----------|--------|---------|
| `/api/facturacion/dte/firmador-status.php` | GET | Sesión + admin/manager |
| `/api/facturacion/dte/firmador-probar.php` | POST | Sesión + admin/manager + DTE_ENV=local |

---

## Siguiente etapa

1. Incorporar JSON Schemas oficiales y validar DTE antes de firmar
2. Construir el DTE completo (emisor, receptor, cuerpoDocumento, resumen)
3. Almacenar el sello de recepción en la tabla `ordenes` o nueva tabla `dte_emitidos`
4. Implementar transmisión al MH (`/api/transmision/` del sistema SVFE)
5. Generar PDF del DTE firmado para descarga
6. Manejar contingencias y re-envíos

---

*Documento creado: 2026-07-26 — No hacer merge ni despliegue hasta completar los criterios de aceptación.*
