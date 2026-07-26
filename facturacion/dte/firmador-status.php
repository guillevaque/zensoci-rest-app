<?php
/**
 * GET /api/facturacion/dte/firmador-status.php
 *
 * Comprueba la disponibilidad del Firmador Docker.
 *
 * Requiere:
 *  - Autenticación (sesión activa)
 *  - Rol: admin o manager
 *
 * Devuelve:
 *  { available, message, latency_ms, firmador_url, checked_at }
 *
 * No devuelve: contraseñas, certificados, datos sensibles.
 * No transmite al Ministerio de Hacienda.
 */
require_once __DIR__ . '/../../headers.php';
require_once __DIR__ . '/../../config.php';
require_once __DIR__ . '/../firmador/FirmadorException.php';
require_once __DIR__ . '/../firmador/FirmadorClient.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'manager'], true)) jsonError(403, 'Sin permisos');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError(405, 'Método no permitido');

$enabled = filter_var(getenv('DTE_FIRMADOR_ENABLED') ?: 'false', FILTER_VALIDATE_BOOLEAN);

if (!$enabled) {
    jsonOk([
        'available'    => false,
        'message'      => 'Firmador no habilitado en esta configuración',
        'latency_ms'   => null,
        'firmador_url' => null,
        'checked_at'   => date('c'),
    ]);
    exit;
}

try {
    $client = new FirmadorClient();
    $result = $client->healthCheck();

    jsonOk([
        'available'    => $result['available'],
        'message'      => $result['message'],
        'latency_ms'   => $result['latency_ms'],
        'firmador_url' => getenv('DTE_FIRMADOR_URL') ?: null,
        'checked_at'   => date('c'),
    ]);

} catch (Throwable $e) {
    error_log('[firmador-status] ' . $e->getMessage());
    jsonOk([
        'available'    => false,
        'message'      => 'Error al inicializar el cliente del Firmador',
        'latency_ms'   => null,
        'firmador_url' => null,
        'checked_at'   => date('c'),
    ]);
}
