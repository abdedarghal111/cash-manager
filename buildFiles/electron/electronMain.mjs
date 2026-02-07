import { app, BrowserWindow, session } from 'electron/main'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import icon from '@assets/icon.png'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
// const __iconsFolder = resolve(__dirname, '..', 'assets', 'icons')

const createWindow = () => {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			// Path from main/electronMain.js to preload/electronPreload.js
			preload: resolve(__dirname, '../preload/electronPreload.js'),
			webSecurity: false // puede ser arriesgado pero las cors no se pueden manejar casi.
		},
		icon: icon //resolve(__iconsFolder, 'icon.png') (no existe)
	})

	// Path from main/electronMain.js to renderer/index.html
	if (process.env.ELECTRON_RENDERER_URL) {
		// Si estamos en DEV, cargamos la URL (http://localhost:5173)
		win.loadURL(process.env.ELECTRON_RENDERER_URL)
	} else {
		// Si estamos en PROD, cargamos el archivo html compilado
		win.loadFile(resolve(__dirname, '../renderer/index.html'))
	}
	win.webContents.openDevTools()
	win.maximize()
}

app.whenReady().then(() => {
	createWindow()

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})