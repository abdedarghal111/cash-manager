/**
 * Aquí en este fichero se realizan declaraciones que el interprete no conoce.
 * Se declaran las variables hardcodeadas vía "define" (en esbuild y vite)
 * 
 * Principalmente se van a declarar constantes que serán pasadas en el momento de compilar como la versión o nombres o diferentes valores.
 * 
 * @see https://esbuild.github.io/api/#define
 * @see https://vite.dev/config/shared-options#define
 */

// la versión del proyecto como "X.X.X" siendo X un numero unsigned
declare const __VERSION__: string

// nombre de la aplicación
declare const __APP_NAME__: string