<?php
/**
 * GET  /api/auth/permissions.php          → permisos del rol del usuario actual
 * GET  /api/auth/permissions.php?all=1   → todos los roles (solo manager)
 * PUT  /api/auth/permissions.php         → actualiza un permiso (solo manager)
 *   body: { "role": "staff", "route": "/reportes", "allowed": true }
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$pdo        = getPDO();
$myRole     = $_SESSION['user_role'] ?? '';
$method     = $_SERVER['REQUEST_METHOD'];
$isTopAdmin = in_array($myRole, ['admin', 'manager'], true);

if ($method === 'GET') {
    if (!empty($_GET['all'])) {
        if (!$isTopAdmin) jsonError(403, 'Sin permisos');

        $rows = $pdo->query("SELECT role, route, allowed FROM role_permissions ORDER BY role, route")
                    ->fetchAll();

        // Devuelve { manager: { '/dashboard': true, ... }, staff: {...}, ... }
        $map = [];
        foreach ($rows as $r) {
            $map[$r['role']][$r['route']] = (bool)$r['allowed'];
        }
        jsonOk($map);
    }

    // Devuelve rutas permitidas + rutas que el servidor conoce (para merge en cliente)
    $stmt = $pdo->prepare("SELECT route, allowed FROM role_permissions WHERE role = ?");
    $stmt->execute([$myRole]);
    $rows   = $stmt->fetchAll();
    $routes = [];
    $known  = [];
    foreach ($rows as $r) {
        $known[] = $r['route'];
        if ($r['allowed']) $routes[] = $r['route'];
    }
    jsonOk(['role' => $myRole, 'routes' => $routes, 'known' => $known]);
}

if ($method === 'PUT') {
    if (!$isTopAdmin) jsonError(403, 'Sin permisos');

    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $role    = trim($body['role']    ?? '');
    $route   = trim($body['route']   ?? '');
    $allowed = isset($body['allowed']) ? (int)(bool)$body['allowed'] : null;

    $validRoles  = ['admin', 'manager', 'gerente', 'mesero', 'cocina', 'caja', 'contador', 'staff'];
    $validRoutes = ['/dashboard','/mesas','/pedidos','/menu','/inventario',
                    '/reportes','/costeo','/personal','/ajustes',
                    '/facturacion/clientes','/facturacion/proveedores','/facturacion/informes'];

    if (!in_array($role, $validRoles, true))   jsonError(400, 'Rol inválido');
    if (!in_array($route, $validRoutes, true)) jsonError(400, 'Ruta inválida');
    if ($allowed === null)                     jsonError(400, 'Campo allowed requerido');

    // admin y manager tienen acceso total — no se puede revocar
    if (in_array($role, ['admin', 'manager'], true))
        jsonError(400, 'Los permisos de admin y manager no se pueden modificar');

    $pdo->prepare("
        INSERT INTO role_permissions (role, route, allowed)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)
    ")->execute([$role, $route, $allowed]);

    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
