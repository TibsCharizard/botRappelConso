import { Client, embedLength, GatewayIntentBits, REST, Routes} from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
import config from './config.json' assert { type: "json" };
import got from 'got';
import fs from 'fs/promises';

if (!await fs.access('db.json', fs.constants.F_OK).catch(() => '')) {
    await fs.writeFile('db.json', JSON.stringify({
        last_id: 0,
        channels: []
    }));
}

let db = JSON.parse(await fs.readFile('db.json'));

async function writeDB(newDB = {
    last_id: 0,
    channels: []
}) {
    await fs.writeFile('db.json', JSON.stringify({
        last_id: newDB.last_id,
        channels: newDB.channels
    }));
}

async function rappelConso() {
    const result = await got.get('https://data.economie.gouv.fr/api/v2/catalog/datasets/rappelconso0/records?order_by=date_de_publication%20desc,reference_fiche%20desc&limit=10&offset=0&timezone=UTC')
    let produit = JSON.parse(result.body).records[0].record.fields;
    let message = {
        "title": `${produit.noms_des_modeles_ou_references} - ${produit.nom_de_la_marque_du_produit}`,
        "description": `${produit.informations_complementaires}`,
        "url": `${produit.lien_vers_la_fiche_rappel}`,
        "color": 15241224,
        "fields": [
            {
                "name": "Motif du rappel",
                "value": `${produit.motif_du_rappel}`
            },
            {
                "name": "Risques encourus par le consommateur",
                "value": `${produit.risques_encourus_par_le_consommateur}`
            },
            {
                "name": "Conduites à tenir par le consommateur",
                "value": `${produit.conduites_a_tenir_par_le_consommateur}`
            },
            {
                "name": "Modalités de compensation",
                "value": `${produit.modalites_de_compensation}`
            },
            {
                "name": "Date de fin de procédure de rappel",
                "value": `${produit.date_de_fin_de_la_procedure_de_rappel}`
            },
            {
                "name": "Préconisations sanitaire",
                "value": `${produit.preconisations_sanitaires}`
            },
            {
                "name": "Nature juridique du rappel",
                "value": `${produit.nature_juridique_du_rappel}`
            },
            {
                "name": "Ditributeurs",
                "value": `${produit.distributeurs}`
            },
            {
                "name": "Numéro de contact",
                "value": `${produit.numero_de_contact}`
            },
            {
                "name": "Lien vers la fiche de rappel",
                "value": `${produit.lien_vers_la_fiche_rappel}`
            },
            {
                "name": "Lien vers la liste des distributeurs",
                "value": `${produit.lien_vers_la_liste_des_distributeurs}`
            },
            {
                "name": "Lien vers l'affichette PDF",
                "value": `${produit.lien_vers_affichette_pdf}`
            }
        ],
        "author": {
            "name": "RappelConso",
            "url": "https://rappel.conso.gouv.fr/"
        },
        "footer": {
            "text": "Bot RappelConso - Thibault Delgrande 2023"
        },
        "image": {
            "url": `${produit.liens_vers_les_images}`
        },
        "thumbnail": {
            "url": "https://www.economie.gouv.fr/files/styles/image_contenu_article_espace/public/files/directions_services/dgccrf/imgs/Lettre_CetC/logo-rappel-conso.jpg"
        },
        "id" : produit.reference_fiche
    }
    return message;
}

async function tick() {
    const message = await rappelConso();
    if (message.id !== db.last_id) {
        let db = JSON.parse(await fs.readFile('db.json'));
        db.last_id = message.id;
        writeDB(db);
        for (const channelId of db.channels) {
            const channel = await client.channels.fetch(channelId);
            channel.send({ embeds: [message] });
        }

    }
}

//commande
const commands = [
  {
    name: 'rappel',
    description: 'Envoie le dernier rappel conso',
  },
  {
    name: 'alerte',
    description: 'Active le rappel conso dans ce channel',
  },
  {
    name: 'desactive',
    description: 'Désactive le rappel conso dans ce channel',
  }
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(config.client_id), { body: commands });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
  
    if (interaction.commandName === 'rappel') {
      await interaction.reply({ embeds: [await rappelConso()] });
    }
    if (interaction.commandName === 'alerte') {
        let db = JSON.parse(await fs.readFile('db.json'));
        db.channels.push(interaction.channelId);
        writeDB(db);
        await interaction.reply({ content: 'Alertes rappel conso activé dans ce channel !', ephemeral: true });
    }
    if (interaction.commandName === 'desactive') {
        let db = JSON.parse(await fs.readFile('db.json'));
        db.channels = db.channels.filter(channel => channel !== interaction.channelId);
        writeDB(db);
        await interaction.reply({ content: 'Alertes rappel conso désactivé dans ce channel !', ephemeral: true });
    }
  });

//bot


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tick();
    setInterval(tick,60000);
});

client.login(config.token);


