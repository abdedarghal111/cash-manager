### Antes de empezar

Esto no debes hacerlo por cualquier razón porque conlleva mucho peligro y más si te conectas a un servidor en linea.
También te pueden espiar directamente sin ningún problema, pero en caso de que quieras continuar pues aquí te digo como se hace.

Por la parte del servidor es muy facil, simplemente modifica `.env` desactivando ACME y activando el modo localhost.

Por la parte del cliente depende de lo que quieras:

#### Si estás usando Capacitor

Capacitor es un amargo, android cada vez es más restrictivo (eso no ayuda en nada.)

Por lo que tienes que agregar a `capacitor.config.json` lo siguiente:
```json
{
    "android": {
        "allowMixedContent": true
    },
    "server": {
        "androidScheme": "http",
        "cleartext": true
    }
}
```
No me he enterado bien de sus modificaciones pero se supone que sirve.
Fijate que con eso no es suficiente, aparte tienes que especificar en el config de los proyectos android, osea en:
`android/app/src/main/AndroidManifest.xml` y añadir dentro del tag `<application>` esto: `android:usesCleartextTraffic="true"`.

Con eso ya funcionaría el protocolo HTTP.

La buena noticia es que en principio no deberías de necesitar eso para nada.

#### Si estás usando Electron

Funciona perfectamente con lo colocado, antes aparecía un warning y se arregló añadiendo una regla en el
index que permite solo obtener contenidos y hacer peticiones externas pero no ejecutar código remoto.

#### Si estas usando Barebone (simplemente desplegar cliente con otro servidor)

Creo que eso funciona sin hacer nada, por lo que he probado ahora todo bien.

#### Conclusión

Si realmente quieres usar http, solo tienes que hacer malabares con android.