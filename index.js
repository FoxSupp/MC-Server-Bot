import 'dotenv/config';
import { Client, GatewayIntentBits, Events, MessageFlags } from 'discord.js';
import { status as mcStatus } from 'minecraft-server-util';

const { DISCORD_TOKEN, MC_HOST, MC_PORT } = process.env;

// --- Hosts parsen ---
function parseHosts(input) {
  return input
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(entry => {
      // split in [host:port, name]
      const [hostPort, displayName] = entry.split('/');
      let host = hostPort;
      let port = MC_PORT ? Number(MC_PORT) : 25565;

      // host:port Erkennung (IPv6 in [])
      const m = hostPort.match(/^\[?([^\]]+)\]?:(\d+)$/);
      if (m) {
        host = m[1];
        port = Number(m[2]);
      }

      return {
        host,
        port,
        name: displayName || hostPort
      };
    });
}

const hosts = parseHosts(MC_HOST || '');
if (hosts.length === 0) {
  console.error('MC_HOST ist leer.');
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // Slash-Command /ip pro Guild registrieren (schnelle Verfügbarkeit)
  try {
    const commandData = [{ name: 'ip', description: 'Zeigt die Minecraft-Server IP(s)' }, { name: 'players', description: 'Zeigt alle Spieler auf den Servern' }];
    await Promise.all(
      client.guilds.cache.map((guild) => guild.commands.set(commandData))
    );
    console.log('Slash-Command /ip registriert.');
  } catch (e) {
    console.warn('Konnte Slash-Command /ip nicht registrieren:', e);
  }

  let idx = 0;

  const updatePresence = async () => {
    const { host, port, name } = hosts[idx];
    idx = (idx + 1) % hosts.length;

    try {
      const res = await mcStatus(host, port, { timeout: 4000, enableSRV: true });
      const online = res.players?.online ?? 0;
      const max = res.players?.max ?? '?';
      client.user.setPresence({
        status: 'online',
        activities: [{ name: `${name} — ${online} Spieler`, type: 3 }]
      });
    } catch {
      client.user.setPresence({
        status: 'dnd',
        activities: [{ name: `${name} — offline`, type: 3 }]
      });
    }
  };

  await updatePresence();
  setInterval(updatePresence, 5_000); // alle 5 Sekunden rotieren
});

// /ip Handler
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName == 'ip') {
    let list = "SERVERS\n";
    list += hosts
      .map(({ host, port, name }) => `• ${name} — ${host}:${port}`)
      .join('\n');
    list += "\n\n";

    await interaction.reply({
      content: list || 'Keine Server konfiguriert.',
      flags: MessageFlags.Ephemeral
    });
  }
  if (interaction.commandName == 'players') {
    let list = "PLAYERS\n";
    // Für alle Server Status abfragen und Spielernamen sammeln
    const results = await Promise.all(
      hosts.map(async ({ host, port, name }) => {
        try {
          const res = await mcStatus(host, port, { timeout: 4000, enableSRV: true });
          const online = res.players?.online ?? 0;
          const max = res.players?.max ?? '?';
          const playerNames = res.players?.sample?.length
            ? res.players.sample.map(p => p.name).join(', ')
            : (online > 0 ? 'Namen nicht verfügbar' : 'Keine Spieler online');
          return `• ${name} — ${host}:${port}\n  Spieler (${online}/${max}): ${playerNames}`;
        } catch {
          return `• ${name} — ${host}:${port}\n  Server offline`;
        }
      })
    );
    list += results.join('\n\n');
    list += "\n";

    await interaction.reply({
      content: list || 'Keine Server konfiguriert.',
      flags: MessageFlags.Ephemeral
    });
  }
    } catch (e) {
    try {
      if (!interaction.replied) {
        await interaction.reply({ content: 'Fehler beim Anzeigen der IPs.', ephemeral: true });
      }
    } catch {}
  }
});

client.login((DISCORD_TOKEN || '').trim());
