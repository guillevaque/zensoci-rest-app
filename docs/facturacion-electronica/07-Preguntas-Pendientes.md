# 07 — Preguntas Pendientes

Este documento lista toda la información que debe confirmarse con el equipo o con el Ministerio de
Hacienda antes de comenzar la implementación. **No inventar datos.**

---

## Sobre el Emisor (datos fiscales de Zensoci)

1. **¿Cuál es el NIT de Zensoci?**
   > Requerido para todos los documentos DTE. Formato: XXXX-XXXXXX-XXX-X

2. **¿Cuál es el NRC de Zensoci?**
   > Requerido para emitir DTE como contribuyente registrado.

3. **¿Cuál es el código de Actividad Económica (CAT-019)?**
   > Para un restaurante vegano posiblemente `56101` (Restaurantes) o similar. Confirmar con el MH
   > o con el contador.

4. **¿Cuál es el código de Establecimiento y Punto de Venta asignado por el MH?**
   > El MH asigna estos códigos al momento de inscribir el sistema. Formato: `0001` para
   > establecimiento y `0001` para punto de venta.

5. **¿Cuál es la dirección fiscal exacta?**
   > Departamento (CAT-012), Municipio (CAT-013), y complemento de dirección.
   > "Col. Escalón, San Salvador" es referencial. Se necesita código de departamento `06` (San
   > Salvador) y código de municipio exacto.

6. **¿Cuál es el teléfono y correo electrónico fiscal del emisor?**

7. **¿El restaurante ya está inscrito en el sistema del MH para emitir DTE?**
   > Si no, debe inscribirse antes de poder generar documentos válidos.

---

## Sobre el Firmador

8. **¿Ya se cuenta con las credenciales reales del Firmador?**
   > El error `"No existe llave pública para este NIT"` confirma que el NIT de prueba no tiene
   > llaves. Se necesita el archivo `.jks` o `.p12` con las llaves del NIT real de Zensoci.

9. **¿Cómo se desplegará el Firmador para que el backend en Hostinger pueda acceder a él?**
   > Opciones:
   > - VPS/nube propio con Docker
   > - Mismo servidor Hostinger (si soporta Docker)
   > - Proxy/túnel desde Hostinger hacia máquina local (no recomendado para producción)

10. **¿Cuál es la contraseña de la llave privada (`passwordPri`) para el NIT de Zensoci?**
    > Esta credencial es altamente sensible. Confirmar cómo se almacenará de forma segura.

---

## Sobre el ambiente de pruebas del MH

11. **¿Cuál es la URL del ambiente de pruebas del API del MH?**
    > El Manual Técnico v2.1 define los endpoints. Confirmar si está disponible y si Zensoci ya
    > tiene acceso (usuario y contraseña para el ambiente `00`).

12. **¿Se tiene usuario y contraseña para el portal del MH (ambiente de pruebas)?**

---

## Sobre la base de datos

13. **¿Existe tabla de usuarios en la DB? ¿Cómo se llama?**
    > Se infiere su existencia pero no se encontró en el repositorio. Confirmar nombre y columnas.

14. **¿Existe tabla de mesas en la DB?**
    > `GestionMesas.tsx` existe en el frontend pero no se encontró el PHP ni la tabla.

15. **¿La tabla `costeo_detalle_ingredientes` del script original existe en producción?**
    > O fue reemplazada completamente por el campo `costeo_platillo_id` en `ingredientes`.

16. **¿Cuál es la versión exacta de PHP y MySQL en Hostinger?**

17. **¿El plan de Hostinger permite extensiones PHP adicionales?**
    > Para generar UUIDs v4 (`ramsey/uuid`) o para `openssl_*` si se necesita.

---

## Sobre el negocio y flujos

18. **¿Los clientes solicitan principalmente Facturas (consumidor final) o también CCF?**
    > Determina qué tipo de DTE implementar primero.

19. **¿Se planea facturar delivery? ¿Con alguna plataforma externa?**
    > Puede requerir tipos de DTE adicionales.

20. **¿Cómo se maneja actualmente el cobro? ¿Hay terminal física Stripe?**
    > Settings menciona "Stripe Reader M2". Si los pagos ya se procesan, hay que alinear el flujo
    > de pago con la emisión del DTE.

21. **¿Se requiere enviar el DTE al correo del cliente?**
    > Si sí, se necesita configurar SMTP en el servidor Hostinger.

22. **¿Se imprimirán tickets físicos con el número de control del DTE?**
    > Define si se necesita integración con impresoras térmicas.

---

## Sobre la deuda técnica

23. **¿Se puede consolidar los dos clientes HTTP (`src/api/http.ts` y `src/services/http.ts`)?**
    > Hay duplicación. Para DTE conviene tener un solo cliente HTTP. ¿Se puede refactorizar?

24. **¿El módulo `Pedidos.tsx` (datos hardcodeados) tiene fecha estimada para conectarse al backend?**
    > La emisión del DTE depende de que haya pedidos reales en DB.

---

## Sobre los catálogos

25. **¿Los ítems del menú de Zensoci se clasifican como Bienes (CAT-011 código 1) o Servicios (2)?**
    > Para un restaurante generalmente son Bienes. Confirmar con el contador.

26. **¿Los platillos se venden siempre en Unidad (CAT-014 código 59)?**
    > O hay algún ítem que se venda por peso u otra unidad.
