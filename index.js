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

const db = JSON.parse(await fs.readFile('db.json'));

async function writeDB(newDB = {
    last_id: 0,
    channels: []
}) {
    await fs.writeFile('db.json', JSON.stringify({
        last_id: 0,
        channels: []
    }));
}

async function rappelConso() {
    const result = await got.get('https://data.economie.gouv.fr/api/v2/catalog/datasets/rappelconso0/records?order_by=date_de_publication%20desc,reference_fiche%20desc&limit=10&offset=0&timezone=UTC')
    let produit = JSON.parse(result.body).records[0].record.fields;
    let message = {
        "title": "Rôti Normand - Vallégrain",
        "description": "Rôti de porc élaboré d'environ 1kg. Rôti farci avec de la farce nature, des tranches de camembert et de pommes, couvert avec des tranches de camembert et de pommes, enroulé dans une crépine.",
        "url": "https://rappel.conso.gouv.fr/fiche-rappel/9289/Interne",
        "color": 15241224,
        "fields": [
            {
                "name": "Motif du rappel",
                "value": "Présence de Salmonelle détectée"
            },
            {
                "name": "Risques encourus par le consommateur",
                "value": "Salmonella spp (agent responsable de la salmonellose)"
            },
            {
                "name": "Conduites à tenir par le consommateur",
                "value": "Ne plus consommer Rapporter le produit au point de vente"
            },
            {
                "name": "Modalités de compensations",
                "value": "Remboursements"
            },
            {
                "name": "Date de fin de procédure de rappel",
                "value": "samedi 25 février 2023"
            },
            {
                "name": "Préconisations sanitaire",
                "value": "Les toxi-infections alimentaires causées par les salmonelles se traduisent par des troubles gastro-intestinaux (diarrhée, vomissements) d'apparition brutale souvent accompagnés de fièvre et de maux de tête qui surviennent généralement 6h à 72h après la consommation des produits contaminés.  Ces symptômes peuvent être plus prononcés chez les jeunes enfants, les femmes enceintes, les sujets immunodéprimés et les personnes âgées. Les personnes qui auraient consommé ces produits et qui présenteraient ces symptômes sont invitées à consulter leur médecin traitant en lui signalant cette consommation. En l'absence de symptômes dans les 7 jours après la consommation des produits concernés, il est inutile de s'inquiéter et de consulter un médecin. Si le produit doit subir une cuisson avant consommation : la cuisson à cœur des produits (œufs durs, pâtisseries, viandes de volailles…) à +65°C permet de détruire ces bactéries et de prévenir les conséquences d'une telle contamination."
            },
            {
                "name": "Nature juridique du rappel",
                "value": "Volontaire (sans arrêté préfectoral)"
            },
            {
                "name": "Ditributeurs",
                "value": "Alvidis"
            },
            {
                "name": "Numéro de contact",
                "value": "0237299494"
            },
            {
                "name": "Lien vers la fiche de rappel",
                "value": "https://rappel.conso.gouv.fr/fiche-rappel/9289/Interne"
            },
            {
                "name": "Lien vers la liste des distributeurs",
                "value": "https://rappel.conso.gouv.fr/document/62732bf3-176f-4635-b721-4f2ff10ed0da/Interne/ListeDesDistributeurs"
            },
            {
                "name": "Lien vers l'affichette PDF",
                "value": "https://rappel.conso.gouv.fr/affichettePDF/9289/Interne"
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
            "url": "https://rappel.conso.gouv.fr/image/22847cf9-fc11-4757-b079-2664fa03306d.jpg"
        },
        "thumbnail": {
            "url": "https://www.economie.gouv.fr/files/styles/image_contenu_article_espace/public/files/directions_services/dgccrf/imgs/Lettre_CetC/logo-rappel-conso.jpg"
        },
        "id" : produit.reference_fiche
    }
    return message;
}

async function tick() {
    const channel = await client.channels.fetch('1063566212874911858');
    const message = await rappelConso();
    if (message.id !== last_id) {
        last_id = message.id;
        channel.send({ embeds: [message] });
    }
}

//commande
const commands = [
  {
    name: 'rappel',
    description: 'Envoie le dernier rappel conso',
  },
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands("1054704035892051988"), { body: commands });

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
  });

//bot


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    tick();
    setInterval(tick,527276);
});

//client.login(config.token);


