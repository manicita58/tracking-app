# tracking-app

App personal de seguimiento (triatlón + inglés). Página estática, sin backend.

## Privacidad

El contenido del plan viaja **cifrado** (AES-GCM, clave derivada con PBKDF2-SHA256,
600k iteraciones). El repo solo contiene el texto cifrado; el plano vive en
`plan.json`, que está en `.gitignore` y nunca se sube.

Los registros del día a día (peso, hábitos, minutos de inglés) se guardan solo en
`localStorage` del dispositivo: nunca salen del teléfono ni tocan el servidor.

## Editar el plan

```sh
# editar plan.json, luego:
PASS='tu-frase' node encrypt-plan.mjs
```

Eso vuelve a cifrar e inyecta el resultado en `index.html`.
