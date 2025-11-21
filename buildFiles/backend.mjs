import { existsSync, readdirSync, rmSync, symlinkSync } from 'fs'
import esbuild from 'esbuild'
import { replace } from 'esbuild-plugin-replace'
import { copy } from 'esbuild-plugin-copy'
import path from 'path'
import { fileURLToPath } from 'url'
import c from 'colors'

/*
Parámetros disponibles:
--dev  => compilar para desarrollo
--no-clean    => no realiza la limpieza
--clean       => realiza limpieza de directorios (por defecto)
*/

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __root = path.join(__dirname, '..')
const __dist = path.join(__root, 'dist', 'backend', 'src')
const __src = path.join(__root, 'src')
const __entry = path.join(__src, 'main.server.mts')

let checkParam = par => process.argv.find(val => val === par)

// limpieza
if (existsSync(__dist) && !checkParam('--no-clean')) {
  let files = readdirSync(__dist)
  let emptyDist = files.length === 0 || (files.length === 1 && files[0] === 'data')
  if (!emptyDist) { console.log('\n==> Limpiando carpeta de compilación...'.yellow) }
  for (const file of files) {
    // si es node_modules y no se pasa el parámetro --clean, se salta
    if(file === 'node_modules' && !checkParam('--clean')) continue
    // borrar todos los archivos (excepto node_modules)
    const filePath = path.join(__dist, file)
    rmSync(filePath, { recursive: true, force: true })
    console.log(`  -> ${file} borrado`.cyan)
  }
  console.log('\n==> Carpeta de compilación limpia'.green)
}


if (checkParam('--dev')) {
  // configuración para produccion
  let ctx = await esbuild.context({
    logLevel: 'info',
    entryPoints: [`${__entry}`],
    // entryPoints: [`${__src}/**/*.mts`],
    sourceRoot: __src,
    outdir: __dist,
    bundle: false,
    sourcemap: false,
    target: 'es2022',
    platform: 'node',
    format: 'esm',
    outExtension: {
      '.js': '.mjs'
    },
    resolveExtensions: ['.mts'],
    //external: ['discord.js', 'dotenv', '@google'],
    tsconfig: './tsconfig.json',
    plugins: [
      replace({
        '.mts': '.mjs'
      }),
      copy({
        assets: [
          {
            from: [`${__src}/**/{*.txt,*.img}`],
            to: [__dist],
          },
        ],
      })
    ]
  })

  // Crear enlace simbólico para node_modules
  const nodeModulesSrc = path.join(__root, 'node_modules')
  const nodeModulesDest = path.join(__dist, 'node_modules')

  if (!existsSync(nodeModulesDest)) {
    console.log('\n==> Creando symlink para node_modules...'.yellow)
    try {
      symlinkSync(nodeModulesSrc, nodeModulesDest, 'junction')
      console.log('  -> Symlink para node_modules creado'.cyan)
    } catch (error) {
      console.error('  -> Error al crear el symlink:'.red, error)
    }
  }

  if (!checkParam('--watch')) {
    await ctx.rebuild()

    ctx.dispose()
  } else {
    await (async () => {
      ctx.watch()
    })()
  }
} else {
  if (!checkParam('--clean')) {
    console.log(c.yellow('\n==> Aviso: No se ha especificado ') + c.red('--production') + c.yellow(' o ') + c.red('--dev') + c.yellow(' como parámetro'))
    console.log('==> Cancelando...'.yellow)
  }
}

console.log('\n==> Cadena de compilación finalizada\n'.green)