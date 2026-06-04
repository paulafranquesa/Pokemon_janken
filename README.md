# じゃんけんバトル (estilo Pokémon)

## Cómo jugar

1. Abre `index.html` en el navegador (doble clic o servidor local).
2. Elige una de las **5 skins** de tu personaje (`user.png`).
3. Pulsa **¡A la batalla!**
4. Usa **グー / パー / チョキ** (piedra, papel, tijera).
5. El rival (`enemy.png`) cambia de skin al azar en cada combate y en cada revancha.

**Victoria:** gana 3 rondas antes que el rival.

## Archivos

| Archivo | Uso |
|---------|-----|
| `user1.png` … `user5.png` | Personajes del jugador |
| `enemy1.png` … `enemy5.png` | Personajes del rival |
| `background-song.mp3` | Música de fondo |
| `click.mp3` | Clic al elegir personaje / empezar |
| `assets/battle-bg.svg` | Fondo vectorial del campo (alta calidad) |

## Servidor local (opcional)

```bash
npx --yes serve .
```

Luego abre la URL que indique la terminal.
