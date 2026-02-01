### Información relevante

Se ha implementado en el módulo `LetsEnctryptACMEClient.server.mjs` un cliente que se encarga de revisar si existen certificados HTTPS válidos y, si no los hay o están caducados, solicitar uno nuevo a Let's Encrypt utilizando el protocolo ACME (Automatic Certificate Management Environment).

Para testear se ha usado "peble" que es también propio de Let's Encrypt para pruebas.

Hay que desactivar la verificación del tls para que así se pueda trabajar con pebble, igualmente, solo usar en pruebas, no en un entorno real eso.

Cuando se habilita peble, se ejecuta de la siguiente manera:

```sh
# --no-verify es para que el tls no se revise (es una instalación local)
pebble.exe -config ./config.json --no-verify
```

Por otro lado para verificar el dominio se ha usado un proxy junto con vps. (En mi caso un vps de 1€ y fast reverse proxy, siendo esta combinación la opción más barata y a la vez útil). En los ajustes del dns del dominio usa una wildcard por ejemplo `*.example.com` y que redirija al vps. Y con eso es suficiente.

Los ajustes del frpclient (FRP) son los siguientes:
```toml
serverAddr = "miDominio.tal"
serverPort = YYYY
auth.token = "algun token"
loginFailExit = false

[[proxies]]
name = "testTalhttp"
type = "http"
localIP = "127.0.0.1"
localPort = NNNN
subdomain = "testTal"

[[proxies]]
name = "testTalhttps"
type = "https"
localIP = "127.0.0.1"
localPort = ZZZZ
subdomain = "testTal"
```

Y en el lado del servidor: 
```toml
bindPort = YYYY
auth.token = "algun token"
subDomainHost = "miDominio.tal"
vhostHTTPPort = 80
vhostHTTPSPort = 443
```

### links de interés

https://github.com/fatedier/frp
https://github.com/letsencrypt/pebble