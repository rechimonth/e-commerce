# Guía oral de defensa — 30 minutos

Esta guía está escrita para explicarla en voz alta, con tono natural. No hace falta memorizar cada palabra; usala como hilo conductor y adaptá los ejemplos a lo que veas en pantalla. La consigna del Proyecto Integrador y el código actual son la base. No afirmes que un servicio externo quedó validado en producción si no lo comprobaste en vivo.

## Antes de presentar

Abrí la aplicación en https://e-commerce-mauve-one-98.vercel.app/ y dejá preparadas dos cuentas de prueba, una de cliente y otra de administrador. No muestres contraseñas en pantalla. Verificá antes de empezar que las dos cuentas puedan iniciar sesión, que el catálogo tenga productos y que puedas crear una orden de prueba. También tené abiertas estas pestañas: el ecommerce, el repositorio de GitHub y esta documentación.

Recordá una aclaración importante: el checkout del cliente es una simulación y no cobra dinero real; la acción de registrar pago que aparece en el panel de órdenes también confirma manualmente un pago simulado, no se conecta a Mercado Pago, Stripe ni a otra pasarela real.

## Primera parte — demo página por página (00:00 a 15:00)

### 00:00–01:00 — Presentación y página de inicio

“Mi proyecto se llama E-Commerce AI y lo desarrollé como proyecto integrador para una tienda online del rubro retail. La idea es que una persona pueda encontrar productos, guardarlos en favoritos, armar un carrito y generar una orden; y, del otro lado, que un administrador pueda mantener el catálogo y gestionar esas órdenes. La aplicación separa esos dos roles para que cada usuario vea las herramientas que le corresponden.

No es solamente una maqueta visual: la interfaz se conecta con servicios de autenticación, base de datos y almacenamiento. Algunas operaciones sensibles pasan por endpoints de servidor para validar identidad y permisos.”

Mostrá la página inicial. Recorré el encabezado, las opciones de navegación, el acceso al catálogo y el pie de página. Explicá que la cabecera y el pie se reutilizan en varias páginas; así, si hay que corregir un enlace o un estilo común, no hace falta duplicar el cambio en cada pantalla.

### 01:00–03:00 — Catálogo, búsqueda y filtros

Entrá a Catálogo. Mostrá las tarjetas y explicá que cada producto es una unidad de información que se obtiene de Firestore. Probá la búsqueda por nombre y el filtro de categorías; si hay paginación visible, cambiá de página.

“Esta pantalla concentra una de las partes principales del negocio: encontrar un producto sin tener que recorrer toda la tienda. La búsqueda tiene debounce, que significa que espera un breve intervalo después de que dejo de escribir antes de actualizar el valor. Esto evita disparar trabajo innecesario en cada tecla. Los filtros y la paginación se mantienen en la interfaz y la información viene de la capa de servicios, en vez de que la página tenga toda la lógica de acceso a datos mezclada con el diseño.

También cuidé los estados de la interfaz: durante una carga se muestra un indicador y, si no hay resultados, aparece un estado vacío en lugar de dejar una pantalla sin explicación.”

No inventes una cantidad fija de productos ni asegures que todos los datos se encuentran optimizados si no podés comprobarlo; alcanza con explicar el patrón y mostrar el comportamiento real.

### 03:00–04:00 — Detalle del producto

Abrí un producto. Señalá el nombre, la imagen, la descripción, el precio, el stock y los controles disponibles.

“Separé el listado del detalle porque tienen objetivos distintos. En el catálogo quiero comparar rápido; en el detalle puedo revisar más información y decidir qué hacer. El precio y la información de negocio se modelan con tipos de TypeScript para reducir errores al transportar datos entre servicios y componentes.”

Mostrá las reseñas si la pantalla tiene datos. Explicá que la aplicación tiene una API para validar las reseñas y que el diseño del flujo limita quién puede reseñar según las reglas del negocio; no digas que una reseña fue verificada por una compra real si estás usando solo datos de prueba.

### 04:00–05:00 — Favoritos

Presioná el corazón de una tarjeta o del detalle y abrí Favoritos.

“Los favoritos son un ejemplo de estado vinculado con el usuario. El botón es un componente reutilizable: lo puedo colocar en distintos puntos de la tienda sin escribir de nuevo toda la lógica. Así también mantengo el mismo comportamiento visual. La información se gestiona a través del contexto y el servicio de favoritos, y el acceso a la página requiere una sesión.”

Si el entorno de producción no tiene la sesión lista o muestra un error, no pierdas tiempo: explicá el flujo mirando el código y continuá con la demo.

### 05:00–06:00 — Carrito

Agregá un producto y entrá al carrito. Cambiá la cantidad y mostrá el total; si corresponde, eliminá un artículo y enseñá el estado vacío.

“El carrito necesita más lógica que un simple botón. Tiene que agregar, quitar, actualizar cantidades, calcular el total y mantener coherencia si vuelvo a entrar. Para eso uso Context API junto con useReducer. El contexto permite compartir el estado entre componentes y el reducer concentra las operaciones en acciones explícitas. Además, hay persistencia local y sincronización remota por usuario autenticado; así puedo recuperar el carrito sin depender solo de que la página siga abierta.”

Si la persona que evalúa pregunta por qué no usar muchos useState, podés decir: “Podría usarlos para cosas simples, pero acá hay varias operaciones que afectan el mismo estado. Con un reducer las reglas quedan en un solo lugar y se pueden probar con entradas y salidas concretas.”

### 06:00–07:00 — Registro, login y sesión

Mostrá la pantalla de acceso y, si la sesión de prueba lo permite, explicá el registro. No cierres una sesión funcional si no tenés las credenciales a mano para volver a entrar.

“Firebase Authentication resuelve la identidad: quién se registró y quién inició sesión. Pero identidad y rol son dos cosas distintas. El rol customer o admin se obtiene del perfil del usuario. Por eso la aplicación contempla estados de carga, ya que no debería redirigir a alguien antes de terminar de averiguar qué permisos tiene.”

Señalá las opciones disponibles para email y Google si están habilitadas en el entorno. Aclaración: la integración de Google puede depender de la configuración del proyecto Firebase y de los dominios autorizados, así que demostrá que funciona solo si lo verificaste.

### 07:00–09:00 — Checkout y confirmación de orden

Volvé al carrito con productos y avanzá al checkout. Mostrá los campos de dirección y el método de pago simulado. Enviá una orden de prueba solo si no afecta datos que quieras conservar.

“Cuando confirmo una compra, no confío ciegamente en el total calculado en el navegador. El frontend manda los datos necesarios al endpoint de checkout junto con el token de Firebase. La función de servidor valida la sesión, vuelve a comprobar productos, importes y stock, y crea la orden en Firestore. De esa forma el cliente no puede inventar libremente el total de una compra cambiando el navegador.

El pago es simulado, como pide la consigna; no hay un cargo financiero real. Si la operación termina bien, se muestra una confirmación y el carrito se limpia. Si falla la creación de la orden, el flujo debe informar el error y mantener el carrito para que el usuario no pierda su compra.”

Mostrá la confirmación y explicá el número o identificador de orden. No llames a esto una integración de pasarela de pago.

### 09:00–10:00 — Historial, detalle de orden y páginas de ayuda

Entrá al historial de órdenes, abrí el detalle y mostrale a la persona evaluadora dónde aparece el estado y, si hay datos, el seguimiento. Mencioná que también existen páginas de ayuda para contacto, envíos, devoluciones y términos/privacidad.

“El historial permite consultar las compras asociadas al usuario. Las consultas están organizadas para recuperar las órdenes que corresponden a la sesión, y las reglas de Firestore ayudan a evitar que un cliente lea las órdenes de otra persona. En el detalle, la interfaz muestra lo que haya disponible: estado, datos de la compra y seguimiento.”

### 10:00–11:00 — Panel administrativo y dashboard

Iniciá sesión como admin y entrá al dashboard.

“Esta es la segunda experiencia del sistema. La aplicación no se limita a ocultar enlaces: protege las rutas administrativas por rol y los endpoints sensibles vuelven a comprobar los permisos en el servidor. El dashboard reúne accesos y métricas para que el administrador encuentre rápidamente las herramientas del comercio.”

Mostrá los elementos principales sin detenerte en números que podrían ser datos de ejemplo.

### 11:00–12:00 — Productos, formularios y carga de imágenes

Entrá a Productos; abrí un formulario de alta o edición sin guardar cambios innecesarios. Mostrá categorías, campos e imagen. Si tenés un archivo de prueba preparado, podés enseñar una carga real; si no, explicá el recorrido sin fingir que se completó.

“Desde el panel puedo mantener el catálogo. El formulario usa componentes compartidos y tipos de TypeScript para que los campos tengan contratos claros. La imagen tiene un flujo aparte por seguridad: el navegador pide permiso al endpoint, el backend valida que sea admin y genera una política temporal para S3. Después el navegador sube el archivo con esa política, sin recibir ni exponer las credenciales secretas de AWS.”

### 12:00–13:00 — Categorías y usuarios

Mostrá Categorías y después Usuarios, sin modificar permisos del usuario con el que estás presentando.

“Estas pantallas extienden la administración del catálogo y de las cuentas. La asignación de permisos merece especial cuidado: una persona no puede autoconcederse el rol de admin desde el formulario de registro. La aplicación diferencia el rol en el frontend, y las reglas y endpoints del servidor son parte de la protección real.”

### 13:00–14:00 — Órdenes, estados y confirmación manual

Entrá a Órdenes. Mostrá filtros de estado, búsqueda si está disponible, detalle y acciones. Si aparece Registrar pago, enseñá el botón de una orden que esté en estado pendiente o en procesamiento, pero no confirmes una orden real por error.

“Desde acá el administrador consulta y filtra órdenes, revisa el detalle y actualiza estados según las transiciones previstas. Hay una acción de pago por orden para un flujo de confirmación manual: es una herramienta de demostración y no significa que exista una pasarela conectada. La acción solo se habilita para los estados previstos y el cambio vuelve al backend para su validación.”

### 14:00–15:00 — Uploads, analytics, configuración y cierre de la demo

Mostrá rápidamente las secciones de Uploads, Analytics y Settings si están disponibles para la cuenta de prueba.

“Además del flujo principal, dejé secciones para cargas, métricas y configuración administrativa. En el código están separadas por página y servicio, lo que facilita ampliar una sección sin poner toda la lógica en un componente gigante.

Con esto termina la parte funcional: mostramos la experiencia de cliente y la de administrador, y cómo se conectan catálogo, carrito, órdenes, roles y persistencia. Ahora paso a explicar cómo se organizó técnicamente para que sea mantenible y testeable.”

## Segunda parte — carpetas, arquitectura y desarrollo (15:00 a 30:00)

### 15:00–16:00 — Raíz del repositorio y configuración

Abrí el repositorio de GitHub y mostrá la raíz.

“En la raíz tengo los archivos que permiten reproducir el desarrollo. package.json declara scripts y dependencias; package-lock.json fija las versiones; las configuraciones de TypeScript separan el frontend, las funciones de servidor y las pruebas. .env.example explica qué variables hacen falta, mientras que .gitignore excluye los archivos que no se deben subir, especialmente los secretos locales.

También están firebase.json y firestore.rules, porque la seguridad y las reglas de base de datos forman parte del sistema, no son un detalle que se agrega al final. vercel.json determina cómo se sirve la SPA y define cabeceras de seguridad.”

### 16:00–18:00 — src/app, páginas y componentes

Abrí src/app/App.tsx y después src/pages.

“App.tsx es el punto donde se conectan los proveedores globales y las rutas. Varias páginas usan carga diferida con lazy y Suspense, así que el código de una pantalla puede cargarse cuando se necesita y durante la espera hay un indicador de carga. Las rutas de cliente están separadas de las rutas que requieren administrador.

En pages vive cada pantalla y en components están las piezas reutilizables. Por ejemplo, el catálogo usa componentes de búsqueda y filtro, las páginas usan controles de interfaz compartidos y el panel tiene su propio layout. Esta separación ayuda a ubicar un cambio: si quiero corregir un botón genérico, busco el componente UI; si necesito cambiar la lógica del detalle de un producto, voy a la página y al servicio asociado.”

Mencioná que la estructura es por capas funcionales y no un único archivo enorme. Mostrá src/components/ui y src/pages/admin como ejemplos.

### 18:00–20:00 — Contextos, hooks y carrito con reducer

Abrí src/store/cart y src/contexts.

“AuthProvider concentra la sesión y el perfil del usuario. FavoritesContext mantiene los favoritos compartidos entre componentes. El carrito tiene su propio módulo en store/cart, separado de autenticación, porque resuelven problemas distintos.

CartProvider expone el estado y las acciones; el reducer permite expresar cambios de forma explícita e inmutable; cloudPersistence sincroniza con Firestore cuando hay usuario y persistence mantiene una copia local. Los hooks como useCart y useAuth simplifican el consumo desde las páginas, para no repetir cómo se accede a cada contexto.

El beneficio del reducer no es que sea una moda, sino que podemos probarlo como una función con estado inicial y acción, y verificar el estado resultante sin montar toda la tienda.”

### 20:00–22:00 — Types, services e infraestructura Firebase

Mostrá src/types, src/services y src/infrastructure/firebase.

“Los tipos definen el contrato de las entidades: producto, orden, carrito, importes, usuario y respuestas de API. Así TypeScript ayuda a encontrar incompatibilidades en desarrollo. En services se centraliza el caso de uso: productos, checkout, órdenes, reseñas, usuarios y carga de imágenes. Las páginas no deberían tener que conocer todos los detalles de cómo se habla con Firestore.

La carpeta infrastructure/firebase contiene los adaptadores reales del proveedor. Esta separación facilita cambiar o mockear una dependencia y permite que los tests no tengan que conectarse a una base de datos de producción.”

### 22:00–24:00 — api, server y seguridad

Mostrá api y server, luego firestore.rules.

“Las funciones dentro de api son el backend serverless que Vercel ejecuta bajo las rutas /api. Por ejemplo, checkout valida la orden en servidor; cancel-order valida quién puede cancelar y cómo cambia el stock; update-order-status controla los cambios de estado; reviews valida las reseñas; upload genera la política de subida a S3.

server contiene módulos reutilizables que inicializan Firebase Admin y verifican tokens y permisos. No alcanza con proteger los botones en React: el navegador pertenece al usuario y sus requests se pueden modificar. Por eso las operaciones importantes se validan en servidor y las reglas de Firestore definen qué documentos se pueden leer o escribir.”

### 24:00–25:00 — Flujo técnico de S3

Abrí docs/UPLOAD_FLOW.md y api/upload.ts.

“Cuando un admin selecciona una imagen, primero se valida la sesión y el rol. El backend valida también extensión, tipo y tamaño, y crea una presigned POST que expira a los cinco minutos. El navegador sube el archivo a S3 usando los campos firmados. Después, cuando se guarda el producto, Firestore recibe la clave y la URL asociadas.

Una presigned POST no entrega las claves de AWS: es una autorización temporal, acotada a una operación. También hay que configurar CORS del bucket. Y los adjuntos de órdenes se deben mantener privados; se descargan mediante un endpoint que comprueba permisos.”

### 25:00–27:00 — Tests y calidad del código

Mostrá package.json, tests/unit, tests/integration y tests/unit/security.

“Hay tests unitarios para funciones y componentes, tests de integración para flujos que combinan varias partes y tests de reglas de Firestore. Firebase y AWS se mockean cuando la prueba no necesita servicios reales, porque un test no debería depender de una credencial o de una conexión externa para ser repetible.

Los comandos que uso incluyen lint, test, test:rules, build y typecheck:api. Cada uno encuentra una clase distinta de problema: reglas estáticas, comportamiento, seguridad de datos, compilación y tipos del backend. Que las pruebas pasen es evidencia importante, pero no reemplaza el smoke test con credenciales reales de Firebase, Vercel y S3.”

### 27:00–28:00 — GitHub Actions y Vercel

Mostrá .github/workflows/ci.yml y el historial de commits.

“Trabajo en main y los cambios se validan con GitHub Actions. El workflow instala dependencias de forma reproducible, ejecuta lint, tests, pruebas de reglas, build y typecheck de las funciones. Esto reduce la posibilidad de subir algo que no compila. Vercel sirve la SPA y ejecuta las funciones serverless; las variables se configuran en el entorno del proyecto y no en el código.

Una distinción importante: un CI verde confirma las verificaciones automatizadas de ese commit, pero no demuestra que cada cuenta, credencial o bucket de producción funcione. Por eso existe un checklist separado para las comprobaciones reales.”

### 28:00–29:00 — Uso de IA durante el desarrollo

Abrí docs/ai-notes.md y explicá dos o tres entradas concretas.

“Usé herramientas de IA como apoyo para revisar decisiones, detectar causas de fallos y diseñar pruebas. Por ejemplo, revisé conflictos entre mocks de tests, consistencia de componentes UI y accesibilidad de formularios. Lo importante no fue copiar una solución automáticamente: fue entender el problema, contrastar el cambio con el código y pasar las validaciones. La bitácora documenta prompts, aprendizajes y decisiones; no reemplaza la evidencia del repositorio.”

Elegí ejemplos que estén realmente escritos en el archivo de bitácora y contá qué decidiste aceptar o descartar.

### 29:00–30:00 — Aprendizajes y cierre

“Lo más importante que me deja este proyecto es que un ecommerce no es solo un catálogo y un carrito. Hay que pensar identidad, roles, datos, stock, errores, persistencia, permisos, pruebas y despliegue como partes de un mismo flujo.

Las decisiones principales fueron separar responsabilidades, usar TypeScript para los contratos de datos, Context API más useReducer para el carrito, Firebase para identidad y persistencia, funciones serverless para operaciones privilegiadas y presigned POST para que las claves de AWS no lleguen al navegador. También aprendí a distinguir una prueba automatizada de una validación real de producción.

Como mejora futura, una pasarela de pago real sería una integración aparte que requiere proveedor, webhooks, verificación de estados y pruebas end-to-end. En este proyecto el pago está simulado de acuerdo con la consigna.”

## Respuestas cortas para preguntas típicas

**¿Por qué React + TypeScript?** React facilita componer la UI por componentes; TypeScript agrega contratos estáticos para productos, órdenes, roles y respuestas.

**¿Por qué useReducer y no solamente useState en el carrito?** Porque varias acciones modifican el mismo estado relacionado; el reducer concentra reglas en una función explícita y fácil de probar.

**¿Por qué Firebase?** Porque la consigna propone un BaaS y Firebase resuelve autenticación y base de datos con servicios administrados, reduciendo la necesidad de operar un backend tradicional completo.

**¿Por qué hacen falta reglas de Firestore si ya hay rutas protegidas?** Porque el frontend se puede manipular; las reglas y el backend deben validar el permiso en el límite donde se accede al dato.

**¿Qué es una presigned POST?** Es una autorización temporal firmada por el backend para una operación específica de S3; permite subir un archivo sin entregar credenciales secretas al navegador.

**¿El pago es real?** No. El checkout y la confirmación administrativa son simulados; no procesan cargos mediante una pasarela.

**¿Qué te aportó la IA?** Me ayudó a explorar alternativas, revisar fallos y proponer pruebas, pero contrasté los cambios con el código, los tests y las decisiones de arquitectura documentadas.
