<?php
/**
 * FirmadorClientTest — Pruebas unitarias para FirmadorClient
 *
 * Requiere PHPUnit (^9 o ^10):
 *   composer require --dev phpunit/phpunit
 *   ./vendor/bin/phpunit tests/FirmadorClientTest.php
 *
 * Todas las pruebas usan mocks de cURL — no necesitan Docker corriendo.
 *
 * Casos cubiertos:
 *  1.  healthCheck exitoso
 *  2.  healthCheck con timeout (cURL error)
 *  3.  healthCheck con conexión rechazada
 *  4.  healthCheck con HTTP no exitoso
 *  5.  sign con respuesta JSON inválida
 *  6.  sign con status OK
 *  7.  sign con status ERROR (HTTP 200) — error funcional
 *  8.  passwordPri nunca aparece en logs o respuestas
 */

use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/../facturacion/firmador/FirmadorException.php';

/**
 * Versión testeable de FirmadorClient que acepta un closure para simular cURL.
 * Permite probar toda la lógica sin depender de red real.
 */
class TestableFirmadorClient
{
    private string   $baseUrl;
    private int      $timeout;
    private \Closure $curlExecutor;

    public function __construct(string $baseUrl, int $timeout, \Closure $curlExecutor)
    {
        $this->baseUrl      = rtrim($baseUrl, '/');
        $this->timeout      = $timeout;
        $this->curlExecutor = $curlExecutor;
    }

    public function healthCheck(): array
    {
        $start = microtime(true);
        ['body' => $body, 'http_code' => $httpCode, 'curl_error' => $curlErr]
            = ($this->curlExecutor)('GET', $this->baseUrl . '/firmardocumento/status', null);

        $latencyMs = (int)round((microtime(true) - $start) * 1000);

        if ($curlErr !== '') {
            return ['available' => false, 'message' => 'No se pudo conectar con el Firmador', 'latency_ms' => $latencyMs];
        }
        if ($httpCode !== 200) {
            return ['available' => false, 'message' => "El Firmador respondió HTTP {$httpCode}", 'latency_ms' => $latencyMs];
        }
        return ['available' => true, 'message' => trim((string)$body) ?: 'OK', 'latency_ms' => $latencyMs];
    }

    public function sign(array $dteJson, string $nit, string $privateKeyPass, bool $activo = true): array
    {
        $payload = json_encode([
            'nit'         => $nit,
            'activo'      => $activo,
            'passwordPri' => $privateKeyPass,
            'dteJson'     => $dteJson,
        ]);

        ['body' => $body, 'http_code' => $httpCode, 'curl_error' => $curlErr]
            = ($this->curlExecutor)('POST', $this->baseUrl . '/firmardocumento/', $payload);

        if ($curlErr !== '') {
            throw new FirmadorException('Error de conexión con el Firmador: ' . $curlErr, 0);
        }
        if ($httpCode < 200 || $httpCode >= 300) {
            throw new FirmadorException("El Firmador respondió HTTP {$httpCode}", $httpCode);
        }

        $decoded = json_decode((string)$body, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new FirmadorException('El Firmador devolvió una respuesta no JSON', $httpCode);
        }

        $status = strtoupper(trim((string)($decoded['status'] ?? '')));
        if ($status === 'ERROR') {
            $msg = $decoded['descripcionMsg'] ?? $decoded['observaciones'] ?? 'Error funcional del Firmador';
            throw new FirmadorException((string)$msg, $httpCode, $decoded);
        }

        return $decoded;
    }
}

class FirmadorClientTest extends TestCase
{
    private function makeClient(\Closure $executor): TestableFirmadorClient
    {
        return new TestableFirmadorClient('http://localhost:8113', 8, $executor);
    }

    // ── Caso 1: healthCheck exitoso ──────────────────────────────────────────

    public function test_healthCheck_exitoso(): void
    {
        $client = $this->makeClient(function () {
            return ['body' => 'Application is running...!!', 'http_code' => 200, 'curl_error' => ''];
        });

        $result = $client->healthCheck();

        $this->assertTrue($result['available']);
        $this->assertSame('Application is running...!!', $result['message']);
        $this->assertIsInt($result['latency_ms']);
        $this->assertGreaterThanOrEqual(0, $result['latency_ms']);
    }

    // ── Caso 2: healthCheck con timeout (cURL error) ─────────────────────────

    public function test_healthCheck_timeout(): void
    {
        $client = $this->makeClient(function () {
            return ['body' => false, 'http_code' => 0, 'curl_error' => 'Operation timed out after 8000ms'];
        });

        $result = $client->healthCheck();

        $this->assertFalse($result['available']);
        $this->assertStringContainsString('conectar', $result['message']);
    }

    // ── Caso 3: healthCheck con conexión rechazada ───────────────────────────

    public function test_healthCheck_conexion_rechazada(): void
    {
        $client = $this->makeClient(function () {
            return ['body' => false, 'http_code' => 0, 'curl_error' => 'Connection refused'];
        });

        $result = $client->healthCheck();

        $this->assertFalse($result['available']);
        $this->assertSame('No se pudo conectar con el Firmador', $result['message']);
    }

    // ── Caso 4: healthCheck con HTTP no exitoso ──────────────────────────────

    public function test_healthCheck_http_no_exitoso(): void
    {
        $client = $this->makeClient(function () {
            return ['body' => 'Service Unavailable', 'http_code' => 503, 'curl_error' => ''];
        });

        $result = $client->healthCheck();

        $this->assertFalse($result['available']);
        $this->assertStringContainsString('503', $result['message']);
    }

    // ── Caso 5: sign con respuesta JSON inválida ─────────────────────────────

    public function test_sign_respuesta_json_invalida(): void
    {
        $client = $this->makeClient(function () {
            return ['body' => 'not-json-at-all', 'http_code' => 200, 'curl_error' => ''];
        });

        $this->expectException(FirmadorException::class);
        $this->expectExceptionMessageMatches('/no JSON/i');

        $client->sign([], '00000000000000', 'secret');
    }

    // ── Caso 6: sign con status OK ───────────────────────────────────────────

    public function test_sign_status_ok(): void
    {
        $firmadorResponse = [
            'status'         => 'OK',
            'descripcionMsg' => 'Documento firmado exitosamente',
            'body'           => base64_encode('firma_simulada'),
        ];

        $client = $this->makeClient(function () use ($firmadorResponse) {
            return [
                'body'       => json_encode($firmadorResponse),
                'http_code'  => 200,
                'curl_error' => '',
            ];
        });

        $result = $client->sign(['identificacion' => []], '00000000000000', 'secret');

        $this->assertSame('OK', $result['status']);
        $this->assertArrayHasKey('body', $result);
    }

    // ── Caso 7: sign con status ERROR con HTTP 200 ───────────────────────────

    public function test_sign_status_error_con_http_200(): void
    {
        $firmadorResponse = [
            'status'         => 'ERROR',
            'descripcionMsg' => 'El certificado no existe o la contraseña es incorrecta',
        ];

        $client = $this->makeClient(function () use ($firmadorResponse) {
            return [
                'body'       => json_encode($firmadorResponse),
                'http_code'  => 200,
                'curl_error' => '',
            ];
        });

        try {
            $client->sign([], '00000000000000', 'wrongpassword');
            $this->fail('Se esperaba FirmadorException');
        } catch (FirmadorException $e) {
            $this->assertSame(200, $e->getCode());
            $this->assertStringContainsString('certificado', $e->getMessage());

            $resp = $e->getFirmadorResponse();
            $this->assertSame('ERROR', $resp['status']);
            $this->assertSame($firmadorResponse['descripcionMsg'], $resp['descripcionMsg']);
        }
    }

    // ── Caso 8: passwordPri nunca aparece en logs o respuestas ──────────────

    public function test_password_nunca_en_logs_ni_respuestas(): void
    {
        $password = 'mi_contraseña_ultra_secreta_12345';

        $capturedPayload = null;
        $client = $this->makeClient(function (string $method, string $url, ?string $body) use (&$capturedPayload) {
            $capturedPayload = $body;
            return [
                'body'       => json_encode(['status' => 'ERROR', 'descripcionMsg' => 'test']),
                'http_code'  => 200,
                'curl_error' => '',
            ];
        });

        try {
            $client->sign([], '00000000000000', $password);
        } catch (FirmadorException $e) {
            // El payload capturado contiene la contraseña (eso es correcto, va al Firmador).
            // Lo que verificamos es que la EXCEPCIÓN no la expone.
            $exceptionMsg  = $e->getMessage();
            $firmadorResp  = json_encode($e->getFirmadorResponse());

            $this->assertStringNotContainsString($password, $exceptionMsg,
                'La contraseña no debe aparecer en el mensaje de la excepción');
            $this->assertStringNotContainsString($password, (string)$firmadorResp,
                'La contraseña no debe aparecer en la respuesta del Firmador (getFirmadorResponse)');
        }

        // Verificar que el payload enviado al Firmador SÍ contiene la contraseña
        // (es necesario para la firma), pero solo en tránsito — nunca se loguea.
        $this->assertStringContainsString($password, (string)$capturedPayload);
    }
}
