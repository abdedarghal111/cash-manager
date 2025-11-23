# Cash Manager Server

<p align="center">
    <img src="./buildFiles/assets/icon.png" alt="App icon" width="200">
</p>

Una app todavía en proceso. Solo un pequeño side project, nada especial. Y el icono también.

## Motivación

Esta aplicación nació simplemente porque quería hacer una app. Todavía está en progreso el resto.

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
        - Crear un enlace simbólico de tus certificados
        - Leer y seguir las instrucciones del archivo .env.example
    - compilar el backend con `pnpm run server:build`
    - desplegar con `deploy:start` (se aconseja tener instalado pm2 en el sistema)
    - compilar el frontend con la aplicación preferida (se sigue el mismo método que con cualquier framework individual)
        - Para electron usa tu método preferido (mira package.json si quieres ir más rapido)
        - Para capacitor.js también (se aconseja haber compilado un proyecto aparte porque se necesitan android tools)