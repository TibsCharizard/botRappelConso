import { Client, embedLength, GatewayIntentBits, REST, Routes} from 'discord.js';
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
import config from './config.json' assert { type: "json" };
import got from 'got';
import fs from 'fs/promises';

if (await fs.access('db.json', fs.constants.F_OK).catch(() => '')) {
    await fs.writeFile('db.json', JSON.stringify({
        id: [],
        channels: []
    }));
}

let db = JSON.parse(await fs.readFile('db.json'));

async function writeDB(newDB = {
    id: [],
    channels: []
}) {
    await fs.writeFile('db.json', JSON.stringify({
        id: newDB.id,
        channels: newDB.channels
    }));
}

async function rappelConso() {
    let flux = await got.get('https://rappel.conso.gouv.fr/rss');
    let result = [];
    let i = 1;
    while (result.length === 0) {
        // Récuperer le premier item
        let item = flux.body.split('<item>')[i].split('</item>')[0];
        // Récuperer le lien vers la fiche de rappel
        let link = item.split('<link>')[1].split('</link>')[0];
        let resultat = await got.get(`https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/rappelconso0/records?where=lien_vers_la_fiche_rappel%3D%22${link}%22`);
        result = JSON.parse(resultat.body).results;
        i++;

    }
    let produit = result[0];
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
    db = JSON.parse(await fs.readFile('db.json'));
    if (!db.id.includes(message.id)) {
        console.log("Nouveau rappel conso")
        db.id.push(message.id);
        writeDB(db);
        for (const channelId of db.channels) {
            const channel = await client.channels.fetch(channelId);
            channel.send({ embeds: [message] }).catch((err) => {
                console.log(err);
                if (err.code > 50000) {
                    db.channels = db.channels.filter(channel => channel !== channelId);
                    writeDB(db);
                    console.log(`Impossible d'envoyer le message dans le salon ${channelId}, il a été supprimé de la liste des salons à alerter`);
                }
            });
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
      console.log(`Rappel utilisé dans le salon ${interaction.channelId} par ${interaction.user.username}#${interaction.user.discriminator} (id : ${interaction.user.id})`)
      await interaction.reply({ embeds: [await rappelConso()] });
    }
    if (interaction.commandName === 'alerte') {
        console.log(`Alertes activées dans le salon ${interaction.channelId} par ${interaction.user.username}#${interaction.user.discriminator} (id : ${interaction.user.id})`);
        db = JSON.parse(await fs.readFile('db.json'));
        db.channels.push(interaction.channelId);
        writeDB(db);
        await interaction.reply({ content: 'Alertes rappel conso activé dans ce channel !', ephemeral: false });
    }
    if (interaction.commandName === 'desactive') {
        console.log(`Alertes desactivées dans le salon ${interaction.channelId} par ${interaction.user.username}#${interaction.user.discriminator} (id : ${interaction.user.id})`);
        db = JSON.parse(await fs.readFile('db.json'));
        db.channels = db.channels.filter(channel => channel !== interaction.channelId);
        writeDB(db);
        await interaction.reply({ content: 'Alertes rappel conso désactivé dans ce channel !', ephemeral: false });
    }
  });

//bot


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tick();
    setInterval(tick,60000);
});

client.login(config.token);


