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

$pdo      = getPDO();
$myRole   = $_SESSION['user_role'] ?? '';
$method   = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    if (!empty($_GET['all'])) {
        // Solo manager puede ver todos los permisos
        if ($myRole !== 'manager') jsonError(403, 'Sin permisos');

        $rows = $pdo->query("SELECT role, route, allowed FROM role_permissions ORDER BY role, route")
                    ->fetchAll();

        // Devuelve { manager: { '/dashboard': true, ... }, staff: {...}, ... }
        $map = [];
        foreach ($rows as $r) {
            $map[$r['role']][$r['route']] = (bool)$r['allowed'];
        }
        jsonOk($map);
    }

    // Devuelve solo las rutas permitidas para el rol actual
    $stmt = $pdo->prepare("SELECT route FROM role_permissions WHERE role = ? AND allowed = 1");
    $stmt->execute([$myRole]);
    $routes = $stmt->fetchAll(PDO::FETCH_COLUMN);
    jsonOk(['role' => $myRole, 'routes' => $routes]);
}

if ($method === 'PUT') {
    if ($myRole !== 'manager') jsonError(403, 'Sin permisos');

    $body    = json_decode(file_get_contents('php://input'), true) ?? [];
    $role    = trim($body['role']    ?? '');
    $route   = trim($body['route']   ?? '');
    $allowed = isset($body['allowed']) ? (int)(bool)$body['allowed'] : null;

    $validRoles  = ['manager', 'staff', 'contador'];
    $validRoutes = ['/dashboard','/mesas','/pedidos','/menu','/inventario',
                    '/reportes','/costeo','/personal','/ajustes'];

    if (!in_array($role, $validRoles, true))   jsonError(400, 'Rol inválido');
    if (!in_array($route, $validRoutes, true)) jsonError(400, 'Ruta inválida');
    if ($allowed === null)                     jsonError(400, 'Campo allowed requerido');

    // manager siempre tiene acceso total — no se puede revocar
    if ($role === 'manager') jsonError(400, 'Los permisos de manager no se pueden modificar');

    $pdo->prepare("
        INSERT INTO role_permissions (role, route, allowed)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE allowed = VALUES(allowed)
    ")->execute([$role, $route, $allowed]);

    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
