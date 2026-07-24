<?php
/**
 * GET    /api/personal/users.php        → lista todos los usuarios
 * POST   /api/personal/users.php        → crea usuario { name, role, pin, color, email? }
 * PUT    /api/personal/users.php        → actualiza { id, name?, role?, status?, color?, email? }
 *                                          o resetea PIN { id, pin }
 * DELETE /api/personal/users.php?id=X  → desactiva usuario
 */
require_once __DIR__ . '/../headers.php';
require_once __DIR__ . '/../config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$myRole = $_SESSION['user_role'] ?? '';
if (!in_array($myRole, ['admin', 'manager'], true)) jsonError(403, 'Sin permisos');

$pdo    = getPDO();
$myId   = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

$VALID_ROLES = ['admin','manager','gerente','mesero','cocina','caja','contador','staff'];

// ── GET: todos los usuarios ───────────────────────────────────────────────
if ($method === 'GET') {
    $rows = $pdo->query(
        "SELECT id, name, email, role, status, color FROM users ORDER BY name ASC"
    )->fetchAll();
    jsonOk($rows);
}

// ── POST: crear usuario ───────────────────────────────────────────────────
if ($method === 'POST') {
    $body  = json_decode(file_get_contents('php://input'), true) ?? [];
    $name  = trim($body['name']  ?? '');
    $role  = trim($body['role']  ?? '');
    $pin   = trim($body['pin']   ?? '');
    $color = trim($body['color'] ?? '#3C6030');
    $email = trim($body['email'] ?? '') ?: null;

    if (!$name)                               jsonError(400, 'Nombre requerido');
    if (!in_array($role, $VALID_ROLES, true)) jsonError(400, 'Rol inválido');
    if (!preg_match('/^\d{4}$/', $pin))       jsonError(400, 'PIN debe ser exactamente 4 dígitos');
    if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError(400, 'Email inválido');

    if ($email) {
        $dup = $pdo->prepare("SELECT id FROM users WHERE email = ?");
        $dup->execute([$email]);
        if ($dup->fetch()) jsonError(409, 'Ya existe un usuario con ese email');
    }

    $pinHash = password_hash($pin, PASSWORD_BCRYPT);

    $stmt = $pdo->prepare(
        "INSERT INTO users (name, email, role, pin, color, status) VALUES (?, ?, ?, ?, ?, 'active')"
    );
    $stmt->execute([$name, $email, $role, $pinHash, $color]);
    $newId = (int)$pdo->lastInsertId();

    jsonOk(['id' => $newId, 'name' => $name, 'email' => $email,
            'role' => $role, 'status' => 'active', 'color' => $color]);
}

// ── PUT: actualizar o resetear PIN ────────────────────────────────────────
if ($method === 'PUT') {
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $id   = (int)($body['id'] ?? 0);
    if (!$id) jsonError(400, 'ID requerido');

    // Solo resetear PIN
    if (array_key_exists('pin', $body) && count($body) === 2) {
        $pin = trim($body['pin']);
        if (!preg_match('/^\d{4}$/', $pin)) jsonError(400, 'PIN debe ser exactamente 4 dígitos');
        $pdo->prepare("UPDATE users SET pin = ? WHERE id = ?")
            ->execute([password_hash($pin, PASSWORD_BCRYPT), $id]);
        jsonOk(['ok' => true]);
    }

    // Actualizar campos
    $sets = []; $vals = [];

    if (isset($body['name'])) {
        $name = trim($body['name']);
        if (!$name) jsonError(400, 'Nombre no puede estar vacío');
        $sets[] = 'name = ?'; $vals[] = $name;
    }
    if (isset($body['role'])) {
        if (!in_array($body['role'], $VALID_ROLES, true)) jsonError(400, 'Rol inválido');
        if ($id === $myId) jsonError(400, 'No puedes cambiar tu propio rol');
        $sets[] = 'role = ?'; $vals[] = $body['role'];
    }
    if (isset($body['status'])) {
        if (!in_array($body['status'], ['active','inactive'], true)) jsonError(400, 'Estado inválido');
        if ($id === $myId && $body['status'] === 'inactive') jsonError(400, 'No puedes desactivarte a ti mismo');
        $sets[] = 'status = ?'; $vals[] = $body['status'];
    }
    if (isset($body['color'])) { $sets[] = 'color = ?'; $vals[] = trim($body['color']); }
    if (isset($body['email'])) {
        $email = trim($body['email']) ?: null;
        if ($email && !filter_var($email, FILTER_VALIDATE_EMAIL)) jsonError(400, 'Email inválido');
        $sets[] = 'email = ?'; $vals[] = $email;
    }

    if (empty($sets)) jsonError(400, 'Sin campos para actualizar');

    $vals[] = $id;
    $pdo->prepare("UPDATE users SET " . implode(', ', $sets) . " WHERE id = ?")->execute($vals);

    $row = $pdo->prepare("SELECT id, name, email, role, status, color FROM users WHERE id = ?");
    $row->execute([$id]);
    jsonOk($row->fetch());
}

// ── DELETE: desactivar usuario ────────────────────────────────────────────
if ($method === 'DELETE') {
    $id = (int)($_GET['id'] ?? 0);
    if (!$id)         jsonError(400, 'ID requerido');
    if ($id === $myId) jsonError(400, 'No puedes eliminarte a ti mismo');

    $pdo->prepare("UPDATE users SET status = 'inactive' WHERE id = ?")->execute([$id]);
    jsonOk(['ok' => true]);
}

jsonError(405, 'Método no permitido');
