<?php
/**
 * POST /api/facturacion/dte/firmador-probar.php
 *
 * Prueba diagnóstica de la firma DTE. Envía una estructura mínima al Firmador
 * y devuelve la respuesta normalizada (sin datos sensibles).
 *
 * Requiere:
 *  - Autenticación (sesión activa)
 *  - Rol: admin o manager
 *  - DTE_ENV=local (solo disponible en entorno local)
 *  - DTE_FIRMADOR_ENABLED=true
 *
 * Credenciales: leídas desde variables de entorno (DTE_FIRMADOR_TEST_NIT,
 * DTE_FIRMADOR_TEST_PASSWORD). React NO envía credenciales en el body.
 *
 * Error por certificado ausente = resultado válido para diagnóstico.
 * NO transmite al Ministerio de Hacienda.
 */
require_once __DIR__ . '/../../headers.php';
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../firmador/FirmadorException.php';
require_once __DIR__ . '/../firmador/FirmadorClient.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'manager'], true)) jsonError(403, 'Sin permisos');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError(405, 'Método no permitido');

// Solo disponible en entorno local
$dteEnv = strtolower((string)(getenv('DTE_ENV') ?: 'production'));
if ($dteEnv !== 'local') {
    jsonError(403, 'Endpoint de prueba no disponible en este entorno');
}

$enabled = filter_var(getenv('DTE_FIRMADOR_ENABLED') ?: 'false', FILTER_VALIDATE_BOOLEAN);
if (!$enabled) {
    jsonError(503, 'Firmador no habilitado (DTE_FIRMADOR_ENABLED=false)');
}

// Credenciales desde el entorno — nunca desde el body de la petición
$testNit  = (string)(getenv('DTE_FIRMADOR_TEST_NIT') ?: '');
$testPass = (string)(getenv('DTE_FIRMADOR_TEST_PASSWORD') ?: '');

if ($testNit === '' || $testPass === '') {
    jsonError(503, 'Credenciales de prueba no configuradas. Definir DTE_FIRMADOR_TEST_NIT y DTE_FIRMADOR_TEST_PASSWORD en el entorno.');
}

// Estructura mínima de DTE para diagnóstico — no es una factura real
$minimalDte = [
    'identificacion' => [
        'version'           => 1,
        'ambiente'          => '00',
        'tipoDte'           => '01',
        'numeroControl'     => 'DTE-01-M001P001-000000000000001',
        'codigoGeneracion'  => strtoupper(vsprintf(
            '%08s-%04s-%04s-%04s-%012s',
            str_split(bin2hex(random_bytes(16)), [8, 4, 4, 4, 12][0]) // Generado localmente
        )),
        'fecEmi'            => date('Y-m-d'),
        'horEmi'            => date('H:i:s'),
        'tipoModelo'        => 1,
        'tipoOperacion'     => 1,
    ],
];

// Generar codigoGeneracion con formato UUID-like
$bytes = bin2hex(random_bytes(16));
$minimalDte['identificacion']['codigoGeneracion'] = strtoupper(sprintf(
    '%s-%s-%s-%s-%s',
    substr($bytes,  0, 8),
    substr($bytes,  8, 4),
    substr($bytes, 12, 4),
    substr($bytes, 16, 4),
    substr($bytes, 20, 12)
));

try {
    $client   = new FirmadorClient();
    $response = $client->sign($minimalDte, $testNit, $testPass);

    jsonOk([
        'diagnostico'  => 'El Firmador procesó la solicitud',
        'status'       => $response['status'] ?? 'OK',
        'mensaje'      => $response['descripcionMsg'] ?? $response['observaciones'] ?? null,
        'firmador_url' => getenv('DTE_FIRMADOR_URL') ?: null,
        'tested_at'    => date('c'),
        'nota'         => 'No se transmitió al Ministerio de Hacienda',
    ]);

} catch (FirmadorException $e) {
    // Error controlado del Firmador (ej. certificado ausente) — es válido como diagnóstico
    $firmadorResp = $e->getFirmadorResponse();
    $mensaje      = $firmadorResp['descripcionMsg']
        ?? $firmadorResp['observaciones']
        ?? $e->getMessage();

    error_log('[firmador-probar] Error controlado: ' . $e->getMessage());

    jsonOk([
        'diagnostico'  => 'El Firmador respondió con error controlado (esperado sin certificado)',
        'status'       => $firmadorResp['status'] ?? 'ERROR',
        'mensaje'      => (string)$mensaje,
        'firmador_url' => getenv('DTE_FIRMADOR_URL') ?: null,
        'tested_at'    => date('c'),
        'nota'         => 'Fallo esperado por certificado ausente o contraseña incorrecta. No se transmitió al Ministerio de Hacienda.',
    ]);

} catch (Throwable $e) {
    error_log('[firmador-probar] ' . $e->getMessage());
    jsonError(503, 'No se pudo contactar con el Firmador');
}
