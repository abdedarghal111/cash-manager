/**
 * Las constantes que deben ser hardcodeadas en el código (identicas en todos los vite y esbuild files)
 * 
 * Importante: Deben declararse las constantes también en el fichero /src/constants.d.mts
 * 
 * Esbuild fuerza a introducir un tipo de variable que serializada exista. Por ejemplo un string debe tener comillas ("") o ('') para ser válido
 * 
 * @see /src/constants.d.mts
*/
import packageJson from "./../../package.json" with { type: 'json' }

export const replacementConstants = {
    '__VERSION__': `'${packageJson.version}'`,
    '__APP_NAME__': `'Cash Manager'`
}