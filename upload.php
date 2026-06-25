<?php
/**
 * /api/upload.php – Subida de imágenes para el menú
 * POST multipart/form-data con campo "image"
 * Devuelve: { "url": "/assets/menu/filename.ext" }
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
        UPLOAD_ERR_INI_SIZE   => 'El archivo supera el límite del servidor',
        UPLOAD_ERR_FORM_SIZE  => 'El archivo supera el límite del formulario',
        UPLOAD_ERR_PARTIAL    => 'El archivo se subió de forma incompleta',
        UPLOAD_ERR_NO_FILE    => 'No se seleccionó ningún archivo',
        UPLOAD_ERR_NO_TMP_DIR => 'Sin directorio temporal',
        UPLOAD_ERR_CANT_WRITE => 'No se pudo escribir el archivo',
    ];
    jsonError(400, $msgs[$error] ?? 'Error al subir el archivo');
}

$allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$mime    = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed, true)) {
    jsonError(400, 'Solo se permiten imágenes JPG, PNG, WebP o GIF');
}

$ext      = match($mime) {
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif',
};

// Construir nombre seguro a partir del nombre original
$original = pathinfo($file['name'], PATHINFO_FILENAME);
$slug     = preg_replace('/[^a-z0-9]+/', '-', strtolower($original));
$slug     = trim($slug, '-') ?: 'imagen';
$filename = $slug . '-' . uniqid() . '.' . $ext;

// Directorio destino (relativo a la raíz del sitio en Hostinger)
$uploadDir = __DIR__ . '/assets/menu/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$dest = $uploadDir . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    jsonError(500, 'No se pudo guardar la imagen');
}

jsonOk(['url' => '/assets/menu/' . $filename]);
