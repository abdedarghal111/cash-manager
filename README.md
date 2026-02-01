# Cash Manager Server

<p align="center">
    <img src="./buildFiles/assets/icons/icon.png" alt="App icon" width="200">
</p>

Una app todavía en proceso. Solo un pequeño side project, nada especial.

## Motivación

Esta aplicación nació simplemente porque quería hacer una app para tener un conteo y finanzas básicas que
pueda revisar y modificarse desde cualquier lado pero que a la vez mis datos los tenga yo y no otra entidad.

Y así es como surge esta aplicación. Un pequeño proyecto de desarrollo personal, con el objetivo de aprender y mejorar mis habilidades en desarrollo web y introducirme un poco más en el desarrollo multiplataforma. No son aplicaciones eficientes porque son ports de tecnologías web pero funcionan que es lo que importa.

Para poder convertirlo en un proyecto android se hace uso de Capacitor.js, que convierte el proyecto en un proyecto de android con
java, esto ayuda también a "mojarse" un poco en el desarrollo android para entender que está sucediendo aunque sea mínimamente.

## Stack del proyecto

- Frontend: svelte y tailwind
- Backend: express.js, sqlite y sequelize
- comunicación: Axios

## Convencion de este proyecto

- Idea:
    - Se ha pensado para combinar el backend y frontend con el mismo código fuente para facilitar la reutilización.
    - La gerarquía de rutas está pensada para tener la lógica de negocio alado de la vista correspondiente.

- Nombres de archivos:
    - `*.client.mts`: código exclusivamente del lado del cliente
    - `*.server.mts`: código exclusivamente del lado del servidor
    - `*.mts`: código compatible con ambos lados
    - `*.view.svelte`: vistas de la app

- Gerarquía de directorios:
    - `local_data`: Contiene los datos de la app y sobre todo la configuración que debes modificar según tus necesidades.
    - `src`: Contiene el código fuente de la app.
    - `src/class`: Contiene las clases de la app.
    - `src/single`: Contiene los singleton de la app.
    - `src/components`: Contiene los componentes de svelte de la app.
    - `src/routes`: Contiene las gerarquía y ficheros las rutas de api y sus respectivas vistas de la app.
    - `assets`: Contiene los assets de la app.


## Instrucciones

- Después de clonar:
    - Instalar dependencias
    - Ir a la carpeta local_data
        - Leer, clonar el archivo .env.example pegarlo como `.env` modificando sus variables a gusto.
    - compilar el backend con `pnpm run server:build`
    - Se aconseja desplegar con pm2
    - compilar el frontend con la aplicación preferida (se sigue el mismo método que con cualquier framework individual)
        - Para electron usa tu método preferido (mira package.json si quieres ir más rapido)
        - Para capacitor.js también (se aconseja haber compilado un proyecto aparte, porque se necesitan android tools)

## Extras

Al querer profundizar y evitar el uso de librerías extras (obviando los frameworks y las librerías para exportar a otras plataformas), he decidido realizar mis propias implementaciones a varias librerías, siendo algunas de estas:

- `ACMEClient`: He estudiado el protocolo ACME e implementado un módulo que hace la petición a Let's Encrypt revisando si los certificados son válidos y pidiendo unos nuevos si fuese necesario.
- `express-session`: Se ha prescindido de sesiones y he implementado mi propio JSON Web Token, una cookie que funciona como un DNI del cliente y que solo puede emitir el servidor.
- `cookie-parser`: No se ha usado para evitar dependencias innecesarias, en su lugar se han parseado las cookies manualmente. Con mi propio constructor.
- `dotenv`: He creado mi propio lector de ficheros `.env` para evitar dependencias externas y también tener implementaciones propias.
- `readline`: He implementado un lector linea por linea que va leyendo de manera eficiente el fichero poco a poco así gestionando la memoria de manera eficiente en vez de un readline muy abstraido.

Existen muchas otras implementaciones pero no representan una sustitución a librerías existentes sino más bien parte del servidor.
Como por ejemplo una utilidad de terminal `pnpm run terminal` que contiene macros para usar scripts rápidos o cosas similares como borrar todas las cuentas etcétera.