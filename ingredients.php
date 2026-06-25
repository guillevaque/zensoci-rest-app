<?php
/**
 * /api/ingredients.php – CRUD para ingredientes
 * Tabla: ingredientes (columnas ya en español tras migración)
 */
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

try {
    $pdo = getPDO();

    // ── GET ────────────────────────────────────────────────────────────────
    if ($method === 'GET') {
        $where  = ['costeo_platillo_id IS NULL'];
        $params = [];

        if (!empty($_GET['q'])) {
            $where[]  = '(nombre LIKE ? OR categoria LIKE ? OR proveedor LIKE ?)';
            $like     = '%' . $_GET['q'] . '%';
            $params   = array_merge($params, [$like, $like, $like]);
        }
        if (!empty($_GET['filter'])) {
            if ($_GET['filter'] === 'bajo')     { $where[] = 'stock > 0 AND stock <= stock_minimo'; }
            if ($_GET['filter'] === 'agotados') { $where[] = 'stock = 0'; }
        }

        $sql  = 'SELECT id, nombre, categoria, proveedor, unidad,
                        stock, stock_minimo AS minimo, precio_compra AS costo
                 FROM ingredientes
                 WHERE ' . implode(' AND ', $where) . '
                 ORDER BY nombre ASC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonOk($stmt->fetchAll());
    }

    // ── POST ───────────────────────────────────────────────────────────────
    if ($method === 'POST') {
        $b = json_decode(file_get_contents('php://input'), true) ?? [];
        if (empty($b['nombre'])) jsonError(400, 'El nombre es requerido');

        $stmt = $pdo->prepare("
            INSERT INTO ingredientes (nombre, categoria, proveedor, unidad, stock, stock_minimo, precio_compra)
            VALUES (:nombre, :categoria, :proveedor, :unidad, :stock, :stock_minimo, :precio_compra)
        ");
        $stmt->execute([
            ':nombre'        => $b['nombre'],
            ':categoria'     => $b['categoria']  ?? null,
            ':proveedor'     => $b['proveedor']  ?? null,
            ':unidad'        => $b['unidad']     ?? 'u',
            ':stock'         => (float)($b['stock']  ?? 0),
            ':stock_minimo'  => (float)($b['minimo'] ?? 0),
            ':precio_compra' => (float)($b['costo']  ?? 0),
        ]);
        jsonOk(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
    }

    // ── PUT ────────────────────────────────────────────────────────────────
    if ($method === 'PUT') {
        if (!$id) jsonError(400, 'ID requerido');
        $b = json_decode(file_get_contents('php://input'), true) ?? [];

        $stmt = $pdo->prepare("
            UPDATE ingredientes
            SET nombre        = :nombre,
                categoria     = :categoria,
                proveedor     = :proveedor,
                unidad        = :unidad,
                stock         = :stock,
                stock_minimo  = :stock_minimo,
                precio_compra = :precio_compra
            WHERE id = :id AND costeo_platillo_id IS NULL
        ");
        $stmt->execute([
            ':nombre'        => $b['nombre']    ?? '',
            ':categoria'     => $b['categoria'] ?? null,
            ':proveedor'     => $b['proveedor'] ?? null,
            ':unidad'        => $b['unidad']    ?? 'u',
            ':stock'         => (float)($b['stock']  ?? 0),
            ':stock_minimo'  => (float)($b['minimo'] ?? 0),
            ':precio_compra' => (float)($b['costo']  ?? 0),
            ':id'            => $id,
        ]);
        jsonOk(['ok' => true]);
    }

    // ── DELETE ─────────────────────────────────────────────────────────────
    if ($method === 'DELETE') {
        if (!$id) jsonError(400, 'ID requerido');
        $pdo->prepare("DELETE FROM ingredientes WHERE id = ? AND costeo_platillo_id IS NULL")
            ->execute([$id]);
        jsonOk(['ok' => true]);
    }

    jsonError(405, 'Método no permitido');

} catch (Throwable $e) {
    error_log('[ingredients.php] ' . $e->getMessage());
    jsonError(500, 'Error interno del servidor');
}
