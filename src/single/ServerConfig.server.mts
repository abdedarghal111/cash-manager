/**
 * Clase ServerConfig, se encarga de cargar y guardar configuración persistente del servidor.
 * Esto lo hace creando un fichero json en la carpeta de datos del servidor.
 * 
 * Las variables que existen ahora mismo en la configuración son:
 * 
 * SYSTEM_VERSION: versión actual del servidor
 * VALID_ACME_CERTIFICATES: si los certificados han sido aceptados por Let's Encrypt
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { SERVER_CONFIG_FILE_PATH } from '@data/paths.mjs'
import { Logger } from '@class/Logger.server.mjs'

class ServerConfig {
    /**
     * Variable que tiene toda la configuración cargada del fichero
     */
    private static config: Record<string, any> = {}

    /**
     * Método que carga la configuración del servidor
     * @throws Error si el json está mal formado
     */
    public static init() {
        Logger.info('Cargando la configuración del servidor...')

        // si existe entonces cargar
        if (existsSync(SERVER_CONFIG_FILE_PATH)) {
            const fileContent = readFileSync(SERVER_CONFIG_FILE_PATH, 'utf-8')
            try {
                // intentar leer el contenido
                this.config = JSON.parse(fileContent)
            } catch (e) {
                // si falla entonces salir
                throw new Error("FATAL: JSON mal formado.", {
                    cause: `Ha habido algun problema leyendo el fichero ${SERVER_CONFIG_FILE_PATH}, deberás solucionar tu mismo el error existente para poder continuar.`
                })
            }
        } else {
            // si no existe entonces crearlo
            this.writeConfig()
            Logger.info('Nuevo fichero de configuración creado.', 2)
        }

        Logger.success('Configuración cargada correctamente.', 2)
    }

    /**
     * Guarda la configuración de la tabla en el fichero
     */
    private static writeConfig(): void {
        writeFileSync(SERVER_CONFIG_FILE_PATH, JSON.stringify(this.config), 'utf-8')
    }

    /**
     * Metodo que obtiene los datos de la tabla de configuración
     */
    public static get<T>(key: string, defaultValue: T): T {
        if (key in this.config) {
            return this.config[key] as T
        }

        return defaultValue
    }

    /**
     * Metodo que establece los datos de la tabla de configuración
     * y guarda la configuración de manera persistente
     */
    public static set<T>(key: string, value: T): void {
        this.config[key] = value
        this.writeConfig()
    }
}

// devolver después de los preparativos
export { ServerConfig }