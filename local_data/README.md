# Esta es la carpeta con los datos locales

Para la **seguridad de los datos** no comparta ningún archivo de los que se encuentran en la carpeta ni los mande a nadie.
Estos son solo archivos que deben quedar aquí porque el servidor trabaja con ellos y algunos son **muy sensibles y críticos**.

## Estructura de los datos locales

Esquema:
    - (I): archivos de informativos
    - (S): archivos sensibles, no compartirlos bajo ningún motivo.
    - (C): archivos configurables (guarda una copia por si algo falla)
    - (D): archivos de datos, los crea o modifica el servidor, manejar con extremo cuidado solo si es necesario.
    - (N): archivo necesario, si no existe debe crearse para que el servidor arranque


┌─| local_data
│
├── .env.example            (I) archivo de variables de entorno de ejemplo para que se sepa para lo que sirve cada variable
│
├── .gitignore              (I) archivo para ignorar ciertos archivos en el control de versiones
│
├── README.md               (I) fichero con indicaciones sobre la carpeta y los archivos
│
├── .env                    (SCN) archivo con variables de entorno o configuraciones del sistema
│
├── server.config.json      (SD) archivo con los datos persistentes del servidor (No tocar)
│
├── storage.sqlite          (SD) base de datos sqlite del sistema
│
├── https                   (N) contiene lo relacionado con la capa https (certificados del dominio o autofirmados)
│   │
│   ├── server.crt  -> ...  (SC) certificado o enlace simbólico para el certificado (recomendado enlace simbólico)
│   │
│   └── server.key  -> ...  (SC) certificado o enlace simbólico para el certificado (recomendado enlace simbólico)
│
├── sessions                contiene los certificados usados para firmar las sesiones de usuario (JSON Web Tokens)
│   │
│   ├── private.key -> ...  (SD) clave privada para la firma
│   │
│   └── public.key  -> ...  (SD) clave pública para la firma
│
└── backup                  (D) Carpeta con copias de seguridad que se realizan antes de las actualizaciones para la integridad de los datos

### Información extra.

- Configura el `.env` y configura el servidor conforme a tus comodidades.
- Si ya tienes certificados Let's Encrypt, desactiva el cliente en `.env` en `USE_ACME_CLIENT="false"` y coloca tus certificados en `local_data/https/server.crt` y `local_data/https/server.key`.
- Si vas a desplegar usa HTTPS: `USE_LOCALHOST_MODE=false`.
- No está pensado para instalación local o usarlo en un solo dispositivo, pero si es así, simplemente dejaló en modo localhost.