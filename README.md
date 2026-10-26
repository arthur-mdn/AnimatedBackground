# AnimatedBackground

AnimatedBackground permet de créer des vidéos personnalisées à diffuser en boucle sur un écran ou un vidéoprojecteur pendant un événement. Choisissez une ambiance, adaptez les textes et téléchargez votre animation en MP4.

La version **V0.1** propose deux ambiances pour les anniversaires : **Aquarelle** (encre et éclats aux couleurs personnalisables) et **Nocturne** (ciel étoilé, notes flottantes et projecteurs animés). Le modèle **Jardin** propose deux prénoms, une date, une phrase facultative, du feuillage animé et une colombe.

## Personnalisation

- Anniversaires : prénom, âge et deux lignes de message indépendantes.
- Mariages : prénom de la mariée en premier par défaut, ordre inversable, date et phrase facultative.
- Aquarelle : huit palettes et une couleur personnalisée, appliquées au décor, aux textes, aux chiffres, à l’icône et aux pépites. Icônes au choix : cœur, champagne, bières, gâteau, étoiles ou aucune.
- Nocturne : ciel étoilé, projecteurs oscillants, notes flottantes et âge en transparence. Six palettes : bleu nuit, rouge couchant, orange crépuscule, violet astral, vert boréal et rose aurore, plus une couleur personnalisée.
- Jardin : six palettes claires prédéfinies (Ivoire, Sauge, Rose, Bleu, Lavande et Champagne), appliquées au fond, au feuillage et aux textes.
- Durée de 45 secondes par défaut, réglable jusqu’à 3 minutes.
- Aperçu animé avec lecture en boucle et retour au début.
- Génération avec suivi de progression, annulation et téléchargement. Les décors déjà calculés sont réutilisés quand les textes changent ; un export identique est disponible immédiatement.

Les vidéos sont exportées en **MP4 Full HD (1920 × 1080), à 30 images par seconde, sans audio**. L’entrée et la sortie sont conçues pour une diffusion continue.

La génération s’effectue sur votre machine, sans service externe. Vos derniers réglages sont conservés dans le navigateur.

## Lancement avec Docker

Prérequis : Docker Desktop démarré et environ 4 Go de mémoire disponibles. Une connexion Internet est nécessaire pour la première construction de l’image.

À la racine du projet :

```bash
docker compose up --build -d
```

Ouvrez [localhost:3000](http://localhost:3000/), personnalisez votre vidéo, puis cliquez sur **Générer la vidéo**. Une fois le rendu terminé, téléchargez le fichier depuis l’interface.

Pour arrêter l’application :

```bash
docker compose down
```

Les exports restent dans le volume Docker. Téléchargez vos vidéos avant de redémarrer l’application : les liens de téléchargement ne sont pas conservés entre les sessions.

## Préparer les ambiances à l’avance

Le premier rendu d’une ambiance prépare son fond animé sans perte. Les textes sont calculés uniquement pendant leur entrée : leur maintien et leur sortie en miroir sont assemblés avec le décor par FFmpeg, sans recalculer toute la vidéo dans le navigateur. L’âge animé de Nocturne dispose aussi de son propre cache. Les personnalisations suivantes réutilisent ce fond tant que le modèle, la palette, la durée et les options du décor restent identiques. Les fonds et exports réutilisables restent dans le volume Docker après redémarrage. Une mise à jour du moteur invalide automatiquement les anciens rendus.

Pour préparer les trois modèles dans leur palette par défaut, en 45 secondes (des vidéos de démonstration sont générées) :

```bash
docker compose exec atelier npm run cache:warm
```

Pour préparer toutes les palettes d’un modèle et une durée donnée :

```bash
docker compose exec atelier npm run cache:warm -- --model=aquarelle --all-palettes --duration=45
```

Le cache est limité à 8 Go d’espace disque par défaut ; les éléments les moins récemment utilisés sont retirés lorsque cette limite est atteinte. Les fichiers de téléchargement déjà créés restent conservés. Pour réserver davantage de place aux palettes préparées :

```bash
RENDER_CACHE_MAX_MB=16384 docker compose up -d
```

## Développement

Le projet utilise React, TypeScript et Remotion. Pour travailler sans Docker, installez Node.js 22+, FFmpeg (avec ffprobe) et Chrome/Chromium, puis renseignez `CHROME_PATH` si nécessaire.

```bash
npm ci
npm run dev
```

L’interface est accessible sur [localhost:5173](http://localhost:5173/). Les commandes `npm test`, `npm run typecheck` et `npm run build` permettent de vérifier le projet.

## Licences

Le moteur vidéo utilise [Remotion](https://www.remotion.dev/docs/license). Les licences des polices sont fournies dans `public/fonts/`.

Réalisé avec ❤️ par [Arthur Mondon](https://mondon.pro/).
