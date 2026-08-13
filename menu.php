<?php
/**
 * /api/menu.php – CRUD para menú
 * Tabla real en DB: name, category, price, description, image_url, active
 */
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    $pdo = getPDO();
    $pdo->exec('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');

    // —— GET ——————————————————————————————————————————————————————————————
    if ($method === 'GET') {
        $where  = ['1=1'];
        $params = [];

        if (!empty($_GET['q'])) {
            $where[]  = '(name LIKE ? OR category LIKE ?)';
            $like     = '%' . $_GET['q'] . '%';
            $params   = array_merge($params, [$like, $like]);
        }
        if (isset($_GET['activo'])) {
            $where[]  = 'active = ?';
            $params[] = (int)$_GET['activo'];
        }

        $sql  = 'SELECT id,
                        name        AS nombre,
                        category    AS categoria,
                        price       AS precio,
                        description AS descripcion,
                        image_url,
                        active      AS activo
                 FROM menu
                 WHERE ' . implode(' AND ', $where) . '
                 ORDER BY category ASC, name ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonOk($stmt->fetchAll());
    }

    // —— POST —————————————————————————————————————————————————————————————
    if ($method === 'POST') {
        $b = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($b['nombre'])) jsonError(400, 'El nombre es requerido');

        $stmt = $pdo->prepare("
            INSERT INTO menu (name, category, price, description, image_url, active)
            VALUES (:name, :category, :price, :description, :image_url, :active)
        ");
        $stmt->execute([
            ':name'        => $b['nombre'],
            ':category'    => $b['categoria']   ?? null,
            ':price'       => (float)($b['precio'] ?? 0),
            ':description' => $b['descripcion'] ?? null,
            ':image_url'   => $b['image_url']   ?? null,
            ':active'      => isset($b['activo']) ? (int)$b['activo'] : 1,
        ]);
        jsonOk(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
    }

    // —— PUT ——————————————————————————————————————————————————————————————
    if ($method === 'PUT') {
        if (!$id) jsonError(400, 'ID requerido');
        $b = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmt = $pdo->prepare("
            UPDATE menu
            SET name        = :name,
                category    = :category,
                price       = :price,
                description = :description,
                image_url   = :image_url,
                active      = :active
            WHERE id = :id
        ");
        $stmt->execute([
            ':name'        => $b['nombre']      ?? '',
            ':category'    => $b['categoria']   ?? null,
            ':price'       => (float)($b['precio'] ?? 0),
            ':description' => $b['descripcion'] ?? null,
            ':image_url'   => $b['image_url']   ?? null,
            ':active'      => isset($b['activo']) ? (int)$b['activo'] : 1,
            ':id'          => $id,
        ]);
        jsonOk(['ok' => true]);
    }

    // —— DELETE ———————————————————————————————————————————————————————————
    if ($method === 'DELETE') {
        if (!$id) jsonError(400, 'ID requerido');
        $pdo->prepare("DELETE FROM menu WHERE id = ?")->execute([$id]);
        jsonOk(['ok' => true]);
    }

    jsonError(405, 'Método no permitido');

} catch (Throwable $e) {
    error_log('[menu.php] ' . $e->getMessage());
    jsonError(500, 'Error interno del servidor');
}
