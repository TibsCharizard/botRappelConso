![GitHub last commit](https://img.shields.io/github/last-commit/thibaultdelgrande/botRappelConso) ![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/thibaultdelgrande/botRappelConso) ![GitHub](https://img.shields.io/github/license/thibaultdelgrande/botRappelConso) ![GitHub top language](https://img.shields.io/github/languages/top/thibaultdelgrande/botRappelConso) ![Libraries.io dependency status for GitHub repo](https://img.shields.io/librariesio/github/thibaultdelgrande/botRappelConso)

# Rappel Conso

Code source de bot Discord permettant d'afficher et de recevoir les derniers rappels conso

https://rappel.conso.gouv.fr/

## Installation

Installer la version LTS de NodeJS : https://nodejs.org/fr/download/

Installer les dépendances :

`npm install`

Créer un bot discord et obtenir son token : https://discord.com/developers/applications
Pour fonctionner correctement, le bot doit pouvoir :

* Créer des commandes
* Envoyer des messages

Créer le fichier config.json et ajouter ceci à l'intérieur :
```
{
	"token": "TOKEN-DU-BOT-DISCORD"
}
```
Démarrer le bot avec la commande :

`npm start`

## Utilisation

> Affiche le dernier rappel conso

`/rappel`


  
  
