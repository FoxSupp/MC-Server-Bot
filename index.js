import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
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

client.login((DISCORD_TOKEN || '').trim());
