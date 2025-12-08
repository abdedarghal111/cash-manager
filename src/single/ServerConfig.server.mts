/**
 * Clase ServerConfig, se encarga de cargar y guardar configuración persistente del servidor.
 * Esto lo hace creando un fichero json en la carpeta de datos del servidor.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { SERVER_CONFIG_FILE_PATH } from '@data/paths.mjs'

class ServerConfig {
    /**
     * Variable que tiene toda la configuración cargada del fichero
     */
    private static config: Record<string, any> = {}

    // para comprobar si ha cargado
    private static loaded = false

    /**
     * Método que carga la configuración del servidor
     * @throws Error si el json está mal formado
     */
    public static init() {
        // tener un debounce preparado
        if(this.loaded) {
            return
        }
        this.loaded = true

        // si existe entonces cargar
        if (existsSync(SERVER_CONFIG_FILE_PATH)) {
            const fileContent = readFileSync(SERVER_CONFIG_FILE_PATH, 'utf-8')
            try {
                // intentar leer el contenido
                this.config = JSON.parse(fileContent)
            } catch (e) {
                // si falla entonces salir
                console.error("Fatal error: can't parse server.config.json.", e)
                process.exit(1)
            }
        } else {
            // si no existe entonces crearlo
            this.writeConfig()
        }
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

// inicializar la configuración del servidor
ServerConfig.init()

// devolver después de los preparativos
export { ServerConfig }