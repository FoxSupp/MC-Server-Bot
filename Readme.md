## MC-Server-Bot

Ein schlanker Discord-Bot, der den Online-Status eines oder mehrerer Minecraft-Server abfragt und als Präsenz anzeigt.

### Voraussetzungen
- Node.js >= 18 (getestet mit Node 24)
- Ein Discord-Bot-Token (Discord Developer Portal)

### Installation
```bash
npm install
```

### .env konfigurieren
Lege eine Datei `.env` im Projektverzeichnis an und fülle sie so:

```ini
# Discord Bot Token – ohne Anführungszeichen, ohne "Bot "-Präfix
DISCORD_TOKEN=dein_token

# Eine oder mehrere Server-Definitionen, durch Komma getrennt
# Format pro Eintrag:
#   host[:port][/Anzeigename]
# Hinweise:
# - Wenn kein Port angegeben ist, wird MC_PORT (oder 25565) verwendet
# - Du kannst optional einen Anzeigenamen nach einem "/" anhängen
# - IPv6 mit Port in eckigen Klammern schreiben, z.B. [2001:db8::1]:25565

# Beispiele (EINEN der folgenden Blöcke verwenden, nicht alle zugleich):
# Einzelner Server mit Default-Port
# MC_HOST=minecraft.example.com

# Einzelner Server mit explizitem Port und Anzeigename
# MC_HOST=minecraft.example.com:25566/Vanilla

# Mehrere Server, rotieren alle 5 Sekunden
# MC_HOST=mc1.example.com:25565/Survival, mc2.example.net:25566/Skyblock

# Optionaler Default-Port für Einträge ohne Port
MC_PORT=25565
```

Wichtig:
- Trage den Token ohne Anführungszeichen ein (kein `'` oder `"`).
- Trage den Token ohne Präfix ein (kein `Bot ` am Anfang).

### Bot in deinen Server einladen
1. Gehe im Discord Developer Portal zu deiner Anwendung → Bot → Token kopieren.
2. Unter OAuth2 → URL Generator: Scopes `bot` wählen; Berechtigungen reichen ohne besondere Privilegien (der Bot schreibt nichts, er setzt nur seine Präsenz).
3. Mit der generierten URL den Bot in deinen Server einladen.

### Starten
```bash
npm start
# oder
node index.js
```

Der Bot rotiert alle 5 Sekunden durch die in `MC_HOST` angegebenen Einträge und setzt seine Präsenz zu:
- "<Anzeigename> — <Online-Spieler> Spieler" wenn erreichbar
- "<Anzeigename> — offline" wenn nicht erreichbar

### Troubleshooting
- Error "TokenInvalid":
  - Prüfe, dass `DISCORD_TOKEN` gesetzt ist
  - Keine Anführungszeichen in `.env`
  - Kein `Bot `-Präfix
  - Keine Leerzeichen am Anfang/Ende
- Keine Präsenz sichtbar: Stelle sicher, dass der Bot online ist (grüner Punkt) und du ihn in deinen Server eingeladen hast.
- Mehrere Server: Achte auf das korrekte Format, Kommas trennen Einträge. Beispiel:
  ```ini
  MC_HOST=mc1.example.com:25565/Survival, mc2.example.net:25566/Skyblock, [2001:db8::1]:25565/IPv6 Node
  ```

### Hinweise zur Performance
- Der Status wird im 5-Sekunden-Takt aktualisiert. Bei vielen Servern und/oder hoher Latenz kannst du das Intervall in `index.js` (`setInterval(updatePresence, 5_000)`) erhöhen.


