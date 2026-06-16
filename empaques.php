<?php
// api/empaques.php
// CRUD del catálogo de empaques de Zensoci POS.
// Sube este archivo a tu carpeta /api/ en Hostinger (junto a ingredients.php).

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php'; // $pdo

$method = $_SERVER['REQUEST_METHOD'];
$id     = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Campos editables desde la app
$FIELDS = ['name','category_label','brand','supplier','presentation','unit',
           'units_per_pack','purchase_price_no_iva','unit_cost','stock_qty','min_stock','activo'];

try {
    if ($method === 'GET') {
        $where  = ['activo = 1'];
        $params = [];
        if (!empty($_GET['q'])) { $where[] = 'name LIKE ?'; $params[] = '%' . $_GET['q'] . '%'; }
        if (($_GET['filter'] ?? '') === 'bajo')     { $where[] = 'stock_qty > 0 AND stock_qty <= min_stock'; }
        if (($_GET['filter'] ?? '') === 'agotados') { $where[] = 'stock_qty <= 0'; }

        $sql  = 'SELECT * FROM empaques WHERE ' . implode(' AND ', $where) . ' ORDER BY name';
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
        exit;
    }

    if ($method === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $cols = []; $ph = []; $vals = [];
        foreach ($FIELDS as $f) {
            if (array_key_exists($f, $data)) { $cols[] = "`$f`"; $ph[] = '?'; $vals[] = $data[$f]; }
        }
        if (empty($cols)) { http_response_code(400); echo json_encode(['error' => 'Sin datos']); exit; }
        $pdo->prepare('INSERT INTO empaques (' . implode(',', $cols) . ') VALUES (' . implode(',', $ph) . ')')
            ->execute($vals);
        echo json_encode(['ok' => true, 'id' => (int)$pdo->lastInsertId()]);
        exit;
    }

    if ($method === 'PUT' && $id) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $sets = []; $vals = [];
        foreach ($FIELDS as $f) {
            if (array_key_exists($f, $data)) { $sets[] = "`$f` = ?"; $vals[] = $data[$f]; }
        }
        if (empty($sets)) { http_response_code(400); echo json_encode(['error' => 'Sin campos']); exit; }
        $vals[] = $id;
        $pdo->prepare('UPDATE empaques SET ' . implode(', ', $sets) . ' WHERE id = ?')->execute($vals);
        echo json_encode(['ok' => true]);
        exit;
    }

    if ($method === 'DELETE' && $id) {
        // Borrado lógico para no romper enlaces de costeo
        $pdo->prepare('UPDATE empaques SET activo = 0 WHERE id = ?')->execute([$id]);
        echo json_encode(['ok' => true]);
        exit;
    }

    http_response_code(405);
    echo json_encode(['error' => 'Método no permitido']);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
