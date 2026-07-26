<?php
/**
 * scripts/test-firmador-local.php
 *
 * Prueba diagnóstica de FirmadorClient contra el Docker local.
 * Solo ejecución por PHP CLI — bloqueado en contexto web.
 *
 * Uso (desde la raíz del repositorio):
 *   php scripts/test-firmador-local.php
 *
 * Windows (si PHP no está en PATH):
 *   C:\xampp\php\php.exe scripts\test-firmador-local.php
 *
 * Códigos de salida:
 *   0 — healthCheck OK y POST llegó al Firmador (error de certificado esperado)
 *   1 — Firmador no disponible (Docker no está corriendo o URL incorrecta)
 *   2 — Error inesperado (PHP, cURL, configuración)
 *
 * No transmite al Ministerio de Hacienda.
 * No muestra contraseñas ni certificados.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit('Solo accesible desde PHP CLI');
}

// ── Configuración temporal (no requiere .env ni Hostinger) ──────────────────
putenv('DTE_FIRMADOR_URL=http://localhost:8113');
putenv('DTE_FIRMADOR_TIMEOUT_SECONDS=8');

// ── Cargar clases existentes (no se duplica lógica) ─────────────────────────
require_once __DIR__ . '/../facturacion/firmador/FirmadorException.php';
require_once __DIR__ . '/../facturacion/firmador/FirmadorClient.php';

echo '─────────────────────────────────────────────' . PHP_EOL;
echo ' Prueba local: FirmadorClient → Docker :8113 ' . PHP_EOL;
echo '─────────────────────────────────────────────' . PHP_EOL . PHP_EOL;

$client = new FirmadorClient();

try {
    // ── PASO 1: healthCheck ──────────────────────────────────────────────────
    echo '[1] GET /firmardocumento/status' . PHP_EOL;

    $health = $client->healthCheck();

    echo 'healthCheck: ' . json_encode(
        $health,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    ) . PHP_EOL . PHP_EOL;

    if (empty($health['available'])) {
        fwrite(STDERR, 'ERROR: Firmador no disponible — ' . $health['message'] . PHP_EOL);
        fwrite(STDERR, 'Verifica que el contenedor esté corriendo:' . PHP_EOL);
        fwrite(STDERR, '  docker ps | grep firmador' . PHP_EOL);
        fwrite(STDERR, '  curl http://localhost:8113/firmardocumento/status' . PHP_EOL);
        exit(1);
    }

    // ── PASO 2: sign con DTE mínimo ──────────────────────────────────────────
    echo '[2] POST /firmardocumento/' . PHP_EOL;
    echo '    (NIT de prueba, sin certificado real — error esperado)' . PHP_EOL;

    try {
        $client->sign(
            ['identificacion' => ['tipoDte' => '01', 'ambiente' => '00']],
            '00000000000000',
            'test123'
        );

        echo 'ADVERTENCIA: se recibió una firma inesperada sin certificado real.' . PHP_EOL;

    } catch (FirmadorException $exception) {
        echo 'POST llegó al Firmador.' . PHP_EOL;
        echo 'Resultado esperado sin certificado: ' . $exception->getMessage() . PHP_EOL;

        $response = $exception->getFirmadorResponse();

        if ($response !== []) {
            echo 'Respuesta del Firmador: ' . json_encode(
                $response,
                JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
            ) . PHP_EOL;
        }
    }

    echo PHP_EOL;
    echo '─────────────────────────────────────────────' . PHP_EOL;
    echo ' OK — Integración PHP ↔ Firmador validada   ' . PHP_EOL;
    echo ' No se transmitió al Ministerio de Hacienda  ' . PHP_EOL;
    echo '─────────────────────────────────────────────' . PHP_EOL;

    exit(0);

} catch (Throwable $exception) {
    fwrite(STDERR, 'Error inesperado: ' . $exception->getMessage() . PHP_EOL);
    exit(2);
}
