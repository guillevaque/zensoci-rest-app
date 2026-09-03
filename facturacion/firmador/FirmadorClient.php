<?php
/**
 * FirmadorClient — Cliente HTTP para svfe-api-firmador (El Salvador DTE)
 *
 * Lee configuración desde variables de entorno:
 *   DTE_FIRMADOR_URL              URL base del servicio Firmador (sin barra final)
 *   DTE_FIRMADOR_TIMEOUT_SECONDS  Timeout de petición en segundos (defecto: 8)
 *
 * Flujo de integración:
 *   React → API PHP → FirmadorClient → Firmador Docker
 *
 * Seguridad:
 *   - passwordPri nunca se registra en logs
 *   - Los stack traces internos no se exponen al frontend
 *   - El DTE completo no se imprime en producción
 */
class FirmadorClient
{
    private string $baseUrl;
    private int    $timeout;

    /**
     * @throws \RuntimeException Si DTE_FIRMADOR_URL no está configurada.
     */
    public function __construct()
    {
        $url = rtrim((string)(getenv('DTE_FIRMADOR_URL') ?: ''), '/');
        if ($url === '') {
            throw new \RuntimeException('DTE_FIRMADOR_URL no está configurada');
        }
        $this->baseUrl = $url;
        $this->timeout = max(1, (int)((getenv('DTE_FIRMADOR_TIMEOUT_SECONDS') ?: 8)));
    }

    /**
     * Comprueba que el Firmador esté disponible.
     *
     * Consume: GET {baseUrl}/firmardocumento/status
     *
     * @return array{available: bool, message: string, latency_ms: int}
     */
    public function healthCheck(): array
    {
        $start = microtime(true);
        $url   = $this->baseUrl . '/firmardocumento/status';

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_HTTPHEADER     => ['Accept: text/plain'],
            CURLOPT_FOLLOWLOCATION => false,
        ]);

        $body     = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        $latencyMs = (int)round((microtime(true) - $start) * 1000);

        if ($curlErr !== '') {
            return [
                'available'  => false,
                'message'    => 'No se pudo conectar con el Firmador',
                'latency_ms' => $latencyMs,
            ];
        }

        if ($httpCode !== 200) {
            return [
                'available'  => false,
                'message'    => "El Firmador respondió HTTP {$httpCode}",
                'latency_ms' => $latencyMs,
            ];
        }

        return [
            'available'  => true,
            'message'    => trim((string)$body) ?: 'OK',
            'latency_ms' => $latencyMs,
        ];
    }

    /**
     * Envía un DTE al Firmador para obtener la firma criptográfica.
     *
     * Consume: POST {baseUrl}/firmardocumento/
     * Headers: Content-Type: application/json, Accept: application/json
     *
     * Body enviado:
     * {
     *   "nit":         "...",
     *   "activo":      true,
     *   "passwordPri": "...",
     *   "dteJson":     { ... }
     * }
     *
     * IMPORTANTE: El Firmador puede devolver HTTP 200 tanto para éxito como para
     * errores funcionales. El campo "status" diferencia el resultado real.
     *
     * @param  array  $dteJson        Payload DTE a firmar
     * @param  string $nit            NIT del emisor (sin guiones)
     * @param  string $privateKeyPass Contraseña del certificado (nunca se loguea)
     * @param  bool   $activo         Indicador de slot activo del certificado
     * @return array                  Respuesta decodificada del Firmador (status=OK)
     * @throws FirmadorException      En error de red, HTTP no exitoso, JSON inválido
     *                                o status=ERROR (error funcional con HTTP 200)
     */
    public function sign(array $dteJson, string $nit, string $privateKeyPass, bool $activo = true): array
    {
        $url     = $this->baseUrl . '/firmardocumento/';
        $payload = json_encode([
            'nit'         => $nit,
            'activo'      => $activo,
            'passwordPri' => $privateKeyPass,
            'dteJson'     => $dteJson,
        ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        if ($payload === false) {
            throw new FirmadorException('No se pudo serializar el DTE a JSON', 0);
        }

        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $payload,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Accept: application/json',
                'Content-Length: ' . strlen($payload),
            ],
        ]);

        $body     = curl_exec($ch);
        $httpCode = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr !== '') {
            throw new FirmadorException('Error de conexión con el Firmador: ' . $curlErr, 0);
        }

        if ($httpCode < 200 || $httpCode >= 300) {
            throw new FirmadorException("El Firmador respondió HTTP {$httpCode}", $httpCode);
        }

        $decoded = json_decode((string)$body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new FirmadorException(
                'El Firmador devolvió una respuesta no JSON: ' . json_last_error_msg(),
                $httpCode
            );
        }

        // HTTP 200 con error funcional — el campo status diferencia el resultado
        $status = strtoupper(trim((string)($decoded['status'] ?? '')));
        if ($status === 'ERROR') {
            $msg = $decoded['descripcionMsg']
                ?? $decoded['observaciones']
                ?? 'Error funcional del Firmador';
            throw new FirmadorException((string)$msg, $httpCode, $decoded);
        }

        return $decoded;
    }
}
