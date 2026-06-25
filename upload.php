<?php
/**
 * /api/upload.php – Subida de imágenes para el menú
 * POST multipart/form-data con campo "image"
 * Devuelve: { "url": "https://app.zensoci.com/assets/menu/filename.ext" }
 */
require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/config.php';

startSession();
if (empty($_SESSION['user_id'])) jsonError(401, 'No autenticado');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError(405, 'Método no permitido');

if (empty($_FILES['image'])) jsonError(400, 'No se recibió ninguna imagen');

$file  = $_FILES['image'];
$error = $file['error'] ?? UPLOAD_ERR_NO_FILE;

if ($error !== UPLOAD_ERR_OK) {
    $msgs = [
        UPLOAD_ERR_INI_SIZE   => 'El archivo supera el límite del servidor (upload_max_filesize)',
        UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el límite del formulario',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió de forma incompleta',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Sin directorio temporal en el servidor',
        UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo en disco',
    ];
    jsonError(400, $msgs[$error] ?? 'Error al subir el archivo (código ' . $error . ')');
}

// Detectar MIME con finfo (disponible desde PHP 5.3), fallback a $_FILES type
$mime = null;
if (function_exists('finfo_open')) {
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime  = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
} elseif (function_exists('mime_content_type')) {
    $mime = mime_content_type($file['tmp_name']);
} else {
    $mime = $file['type'] ?? '';
}

$extMap = [
    'image/jpeg' => 'jpg',
    'image/jpg'  => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
];

if (!isset($extMap[$mime])) {
    jsonError(400, 'Solo se permiten imágenes JPG, PNG, WebP o GIF. MIME detectado: ' . $mime);
}

$ext = $extMap[$mime];

// Nombre seguro: slug del original + uniqid
$original = pathinfo($file['name'], PATHINFO_FILENAME);
$slug     = preg_replace('/[^a-z0-9]+/', '-', strtolower($original));
$slug     = trim($slug, '-') ?: 'imagen';
$filename = $slug . '-' . uniqid() . '.' . $ext;

// Directorio destino: un nivel arriba del directorio del script + /assets/menu/
// En Hostinger: /public_html/assets/menu/
$uploadDir = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/assets/menu/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true)) {
        jsonError(500, 'No se pudo crear el directorio de uploads: ' . $uploadDir);
    }
}

$dest = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonError(500, 'No se pudo mover el archivo a: ' . $dest);
}

// URL pública absoluta para que funcione tanto en dev como en prod
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host   = $_SERVER['HTTP_HOST'];
$url    = $scheme . '://' . $host . '/assets/menu/' . $filename;

jsonOk(['url' => $url]);
