<?php
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

$FIELDS = ['name','category_label','brand','supplier','presentation','unit',
           'units_per_pack','purchase_price_no_iva','unit_cost','stock_qty','min_stock','activo'];

try {
    $pdo = getPDO();

    if ($method === 'GET') {
        $where  = ['activo = 1'];
        $params = [];
        if (!empty($_GET['q']))                     { $where[] = 'name LIKE ?'; $params[] = '%' . $_GET['q'] . '%'; }
        if (($_GET['filter'] ?? '') === 'bajo')     { $where[] = 'stock_qty > 0 AND stock_qty <= min_stock'; }
        if (($_GET['filter'] ?? '') === 'agotados') { $where[] = 'stock_qty <= 0'; }

        $stmt = $pdo->prepare('SELECT * FROM empaques WHERE ' . implode(' AND ', $where) . ' ORDER BY name');
        $stmt->execute($params);
        jsonOk($stmt->fetchAll());
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $cols = []; $ph = []; $vals = [];
        foreach ($FIELDS as $f) {
            if (array_key_exists($f, $data)) { $cols[] = "`$f`"; $ph[] = '?'; $vals[] = $data[$f]; }
        }
        if (empty($cols)) jsonError(400, 'Sin datos');
        $pdo->prepare('INSERT INTO empaques (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')
            ->execute($vals);
        jsonOk(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
    }

    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $sets = []; $vals = [];
        foreach ($FIELDS as $f) {
            if (array_key_exists($f, $data)) { $sets[] = "`$f` = ?"; $vals[] = $data[$f]; }
        }
        if (empty($sets)) jsonError(400, 'Sin campos');
        $vals[] = $id;
        $pdo->prepare('UPDATE empaques SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        jsonOk(['ok' => true]);
    }

    if ($method === 'DELETE' && $id) {
        $pdo->prepare('UPDATE empaques SET activo = 0 WHERE id = ?')->execute([$id]);
        jsonOk(['ok' => true]);
    }

    jsonError(405, 'Método no permitido');

} catch (Throwable $e) {
    error_log('[empaques.php] ' . $e->getMessage());
    jsonError(500, 'Error interno del servidor');
}
