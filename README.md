# [AnimatedBackground](https://animatedbackground.privateevents.fr/)

**Des vidéos personnalisées pour habiller vos événements sur grand écran.**

Créez gratuitement un fond animé pour un mariage ou un anniversaire : choisissez une ambiance, personnalisez les textes et les couleurs, puis téléchargez votre vidéo. Diffusez-la en boucle sur un écran ou un vidéoprojecteur pour accompagner votre événement.

[Créer une vidéo](https://animatedbackground.privateevents.fr/) · [Code source](https://github.com/arthur-mdn/AnimatedBackground)

## Trois ambiances, votre événement

| Modèle | Ambiance | Personnalisation |
| --- | --- | --- |
| **Aquarelle** | Encre en mouvement, pépites scintillantes et chiffres dorés en relief. | Prénom, âge, deux lignes de message, huit palettes ou couleur personnalisée, icône décorative et pépites activables. |
| **Nocturne** | Ciel étoilé, notes de musique flottantes et projecteurs oscillants. | Prénom, âge en grand et en transparence, deux lignes de message, six palettes ou couleur personnalisée. |
| **Jardin** | Feuillage animé, colombe et prénoms qui se dessinent. | Deux prénoms, ordre d’affichage inversable, date, phrase facultative et six palettes claires. |

L’aperçu animé permet de vérifier votre composition avant l’export. La durée est de **45 secondes par défaut**, ajustable de **30 secondes à 3 minutes**. L’entrée et la sortie sont conçues pour une lecture en boucle.

## Un fichier prêt à projeter

1. Choisissez le type d’événement et son ambiance.
2. Adaptez les textes, les couleurs et les options du modèle.
3. Lancez la génération, suivez sa progression et téléchargez le MP4.
4. Ouvrez la vidéo dans votre lecteur habituel et activez la lecture en boucle.

**MP4 · H.264 · Full HD 1920 × 1080 · 30 images/s · Sans audio**

Le rendu s’effectue sur la machine qui héberge l’application : votre ordinateur en local ou votre serveur en production. Aucun service de rendu externe n’est nécessaire. Les décors déjà calculés sont réutilisés pour accélérer les nouvelles personnalisations ; un export identique peut également être récupéré depuis le cache.

## Gratuit et libre d’utilisation

Créé initialement pour [Private Events](https://privateevents.fr/), le générateur est accessible gratuitement, sans compte. Son utilisation et la diffusion des vidéos créées sont libres et autorisées pour vos événements, y compris ceux que vous organisez pour d’autres personnes.

Les réglages du formulaire sont mémorisés dans le navigateur. Au lancement d’une génération, ils sont transmis au serveur pour produire la vidéo. Les exports et les caches personnalisés sont conservés au plus 24 heures par défaut (hors rendu ou téléchargement en cours), et peuvent être supprimés plus tôt pour respecter le budget de stockage. Un cookie technique de session réserve l’accès aux rendus à leur visiteur. La rubrique **Confidentialité & RGPD**, accessible depuis le footer, détaille ce fonctionnement et le contact pour les demandes liées aux données.

## Démarrer avec Docker

Prérequis : Docker avec Compose et environ 4 Go de mémoire disponibles. La première construction de l’image nécessite une connexion Internet.

```bash
docker compose up --build -d
```

Ouvrez [localhost:3000](http://localhost:3000/) pour créer votre vidéo.

```bash
# Consulter les journaux
docker compose logs -f atelier

# Arrêter l’application en conservant les fichiers
docker compose down
```

Les fichiers restent dans le volume Docker, dans les limites de rétention et de stockage configurées. Téléchargez vos vidéos avant de redémarrer l’application : les liens de téléchargement des tâches ne survivent pas au redémarrage, même si les fichiers sont conservés.

## Déployer sur un serveur

Le fichier `docker-compose.prod.yml` fournit une configuration de production autonome pour [animatedbackground.privateevents.fr](https://animatedbackground.privateevents.fr/), avec un volume persistant pour les exports et le cache.

Il nécessite un **Traefik existant**, une entrée HTTPS `websecure` et un résolveur de certificats `myresolver`. Aucun port applicatif n’est publié sur l’hôte. Adaptez le domaine et ces labels à votre infrastructure avant de réutiliser la configuration pour une autre installation.

Faites pointer le DNS A, et AAAA si utilisé, vers votre serveur. Créez un fichier `.env` à partir de `.env.example`, puis générez une clé de session avec `openssl rand -hex 32` et renseignez `SESSION_SECRET`. La configuration de production exige cette clé ; ne la publiez pas dans Git.

Lancez ensuite depuis le dépôt :

```bash
docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml up --build -d
docker compose -f docker-compose.prod.yml logs -f atelier
```

Utilisez uniquement ce fichier pour la production ; `compose.yaml` conserve le lancement local sur le port 3000.

Traefik doit pouvoir joindre le réseau `animatedbackground-prod_default`. S’il utilise un réseau isolé, connectez-le au réseau du projet ou adaptez le fichier pour utiliser votre réseau partagé. Les labels assurent le routage, mais ne créent pas cette connectivité.

`PUBLIC_URL` définit le domaine et l’origine HTTPS acceptés par l’API. Le frontend utilise une URL d’API relative au même domaine ; les requêtes locales restent possibles pour le contrôle de santé et le préchauffage du cache.

### Ressources et configuration

Le rendu vidéo demande plus de ressources qu’un site statique. La configuration de production réserve les limites suivantes, à adapter à votre serveur :

| Paramètre | Valeur par défaut | Rôle |
| --- | --- | --- |
| `APP_MEMORY_LIMIT` | `4g` | Limite de mémoire du conteneur en production. |
| `APP_CPUS` | `2.0` | Limite de CPU du conteneur en production. |
| `RENDER_CACHE_MAX_MB` | `8192` | Budget disque du cache, en plus des exports conservés. |

Chromium dispose également de 1 Go de mémoire partagée. Les paramètres peuvent être définis dans l’environnement ou dans un fichier `.env` sur le serveur :

```bash
APP_MEMORY_LIMIT=6g APP_CPUS=4 RENDER_CACHE_MAX_MB=16384 docker compose -f docker-compose.prod.yml up --build -d
```

Les fichiers `.env` sont exclus de Git et de l’image Docker. Pour arrêter la production en conservant les vidéos et le cache :

```bash
docker compose -f docker-compose.prod.yml down
```

## Accélérer les générations avec le cache

Le moteur prépare les fonds animés sans perte et calcule les textes pendant leur apparition. FFmpeg assemble ensuite le décor, le maintien des textes et leur sortie en miroir. Nocturne dispose aussi d’un cache pour son âge animé.

Un fond peut être réutilisé tant que le modèle, la palette, la durée et les options du décor restent identiques. Le cache persiste après redémarrage ; une mise à jour du moteur invalide les rendus concernés. Le temps de génération dépend du modèle, des ressources disponibles et des éléments déjà calculés.

Pour préparer les trois modèles dans leur palette par défaut, sur 45 secondes :

```bash
docker compose exec atelier npm run cache:warm
```

Pour préparer toutes les palettes d’un modèle et une durée donnée :

```bash
docker compose exec atelier npm run cache:warm -- --model=aquarelle --all-palettes --duration=45
```

Ces commandes génèrent également des vidéos de démonstration. En production, ajoutez `-f docker-compose.prod.yml` après `docker compose`.

Le cache retire les éléments les moins récemment utilisés lorsque son budget disque est dépassé. Les exports destinés au téléchargement restent soumis à leur délai de rétention et au budget global de stockage.

## Protections pour une instance publique

Les rendus sont associés à une session anonyme signée, sans compte utilisateur. Les endpoints de suivi, d’annulation et de téléchargement vérifient cette session. Le contrôle de santé n’expose aucun identifiant de rendu aux autres visiteurs. Les erreurs internes du moteur ne sont pas renvoyées au navigateur.

| Paramètre | Valeur par défaut | Protection |
| --- | --- | --- |
| `SESSION_SECRET` | Obligatoire en Compose production | Signature du cookie de session ; au moins 32 octets aléatoires. |
| `SESSION_GENERATIONS_PER_HOUR` | `5` | Générations par session et par fenêtre d’une heure. |
| `IP_GENERATIONS_PER_HOUR` | `10` | Générations par adresse réseau et par fenêtre d’une heure. |
| `GLOBAL_GENERATIONS_PER_HOUR` | `30` | Générations acceptées pour toute l’instance par fenêtre d’une heure. |
| `RENDER_TIMEOUT_SECONDS` | `2700` | Arrêt d’un rendu après 45 minutes, y compris ses sous-processus. |
| `EXPORT_RETENTION_HOURS` | `24` | Rétention des exports et caches personnalisés. |
| `OUTPUT_MAX_MB` | `20480` | Budget global des exports, caches et fichiers temporaires de rendu. |
| `MIN_FREE_DISK_MB` | `2048` | Réserve minimale d’espace disque avant de lancer ou poursuivre un rendu. |
| `TRUST_PROXY_CIDRS` | Vide | Adresses ou réseaux des proxys explicitement autorisés à fournir l’adresse client. |

L’API est aussi limitée à 120 requêtes par minute et par adresse réseau. Les limites de génération sont cumulatives ; créer un nouveau cookie ne contourne pas la limite réseau. Elles sont conservées en mémoire et repartent à zéro au redémarrage. Une seule génération peut fonctionner à la fois.

**Derrière Traefik**, renseignez `TRUST_PROXY_CIDRS` avec son adresse IP Docker fixe ou un réseau dédié ne contenant que vos proxys de confiance. Sans ce réglage, les visiteurs passant par le même proxy partagent la limite réseau : c’est restrictif mais évite de faire confiance à un en-tête falsifié. Ne configurez pas une confiance globale dans les en-têtes `X-Forwarded-For`. Le port applicatif doit rester inaccessible depuis Internet et Traefik doit conserver son filtrage des en-têtes transférés.

Le stockage est vérifié avant chaque rendu et toutes les 5 secondes. Les fichiers expirés sont nettoyés au démarrage et périodiquement lorsque le moteur est libre ; les téléchargements en cours sont protégés. Un manque d’espace ou un dépassement du budget interrompt le rendu. Ce contrôle applicatif peut laisser un dépassement temporaire entre deux vérifications : utilisez également un quota de système de fichiers ou un volume dédié et surveillez le disque sur un VPS partagé. La réserve disque s’applique aussi au préchauffage.

Le cookie est `HttpOnly`, `SameSite=Strict`, et `Secure` lorsque `PUBLIC_URL` est en HTTPS. Les durées mentionnées dans la rubrique de confidentialité correspondent aux valeurs de production par défaut ; adaptez cette rubrique si vous modifiez la rétention ou la durée de session. La limitation applicative ne remplace pas une protection contre les attaques distribuées au niveau du proxy.

Les commandes `cache:warm` utilisent une session technique soumise aux mêmes limites et attendent si un quota est atteint. Une session doit être initialisée via `GET /api/health` pour tout client API personnalisé, puis son cookie doit être conservé pour les requêtes suivantes.

## Développement

L’interface utilise **React et TypeScript**, le rendu vidéo **Remotion**, et l’assemblage **FFmpeg**. Le serveur repose sur **Node.js et Express**.

Pour travailler sans Docker, installez Node.js 22+, FFmpeg avec ffprobe et Chrome/Chromium. Renseignez `CHROME_PATH` si nécessaire.

```bash
npm ci
npm run dev
```

L’interface de développement est accessible sur [localhost:5173](http://localhost:5173/).

```bash
npm test
npm run typecheck
npm run build
```

## Licences et crédits

L’autorisation d’utiliser le générateur et ses vidéos ne remplace pas les licences des composants du projet. Le moteur vidéo utilise [Remotion](https://www.remotion.dev/docs/license) ; les licences des polices sont fournies dans `public/fonts/`.

Réalisé avec ❤️ par [Arthur Mondon](https://mondon.pro/).

## Aperçu dans Safari

Safari et les navigateurs iOS utilisent un aperçu allégé : les filtres animés de diffusion, de bruit et de flou sont remplacés par des formes et des textures préparées. Le feuillage conserve ses mouvements ; la vidéo de l’oiseau utilise une version plus légère avec sa teinte pastel déjà appliquée. Les scintillements et la typographie restent personnalisables.

Ces adaptations concernent uniquement l’aperçu en direct et les vignettes. Les exports MP4 utilisent toujours la composition complète, même si la génération est lancée depuis Safari.

## Export sur l’appareil

Les modèles **Aquarelle, Nocturne et Jardin** génèrent leur MP4 directement dans le navigateur, avec les palettes, couleurs personnalisées, textes et durées du formulaire. Aucun fond préparé n’est requis. Le navigateur doit permettre l’encodage H.264 via WebCodecs ; la compatibilité est vérifiée avant de démarrer.

Le choix du serveur apparaît uniquement si le navigateur est incompatible ou si une tentative d’export local a échoué pour la configuration en cours. Il faut sélectionner explicitement cette solution de repli : aucun formulaire n’est envoyé à l’API de génération automatiquement. Une annulation ne constitue pas un échec et ne révèle pas le choix serveur. Un indicateur temporaire dans le stockage de session permet de proposer le serveur si le navigateur a interrompu ou rechargé la page pendant un export.

Gardez l’onglet ouvert pendant le calcul, puis téléchargez le MP4 avant de fermer la page. Le fichier est encodé en H.264, en Full HD, à 30 images/s, sans audio, avec un débit cible de 12 Mbit/s. La vitesse et le débit réellement obtenu dépendent de l’appareil et de son encodeur. Un contournement ciblé utilise le mode H.264 `realtime` sur WebKit pour éviter [le blocage connu de Safari](https://github.com/remotion-dev/remotion/issues/11964).

Les textes devenus immobiles sont rasterisés une seule fois en pleine résolution pendant le temps de lecture. Les effets du décor continuent de bouger. Les textures de l’encre sont embarquées dans le SVG pendant le calcul et utilisent des dérivés WebP de 512 pixels. Un nettoyage ciblé libère les images SVG de décor remplacées à chaque image sur WebKit, dont le cache peut autrement saturer la mémoire. Pour limiter la mémoire sur Safari et iOS, les décors sont rasterisés en 960 × 540 puis agrandis ; les textes restent calculés en 1920 × 1080. La microdéformation granuleuse des feuilles est allégée pendant l’export local ; leurs mouvements et leur léger flou sont conservés. L’oiseau dispose de 196 images WebP transparentes, avec son étalonnage intégré, pour conserver sa boucle sans les filtres vidéo CSS. Les médias d’origine et l’export serveur restent disponibles. Ces dérivés sont versionnés dans le dépôt ; pour les régénérer avec FFmpeg :

```bash
npm run assets:client
```

Le navigateur télécharge les médias du site ; le formulaire et le MP4 restent sur l’appareil pendant l’export local. Remotion envoie un événement technique à son service de licence lors du rendu, sans le formulaire ni la vidéo ; ce comportement est décrit dans la page Confidentialité. Le serveur ne reçoit le formulaire que si la solution de repli est sélectionnée et que la génération est lancée.

### Préparer un fond Aquarelle pour accélérer davantage

Un décor générique déjà préparé est utilisé lorsqu’il correspond exactement aux réglages. Cela évite de recalculer l’encre sur l’appareil ; son absence déclenche le calcul local du décor. Pour la palette rose avec pépites pendant 45 secondes :

```bash
docker compose exec atelier npm run backgrounds:prepare
# Production : ajouter -f docker-compose.prod.yml après « docker compose ».
docker compose exec atelier npm run backgrounds:prepare -- --color='#6F9278' --duration=45 --gold=false
```

Le premier calcul du décor peut rester long. Le fond est ensuite partagé entre tous les utilisateurs, indépendamment des prénoms, messages, âge et icône. Il est stocké sous `output/client-backgrounds`, dans le volume persistant, et échappe à la rétention des vidéos personnelles et au cache LRU. Sa taille compte dans le budget global de stockage. Le décor H.264 CRF 16 constitue un encodage intermédiaire ; ce chemin n’est pas mathématiquement sans perte.

Préparez les fonds pendant une période sans génération et surveillez l’espace disponible. Le script verrouille les préparations concurrentes ; après une interruption brutale, vérifiez qu’il ne tourne plus avant de retirer son répertoire temporaire `.client-background-build`. Les fonds doivent être préparés à nouveau après une modification du moteur. Ils peuvent être préparés sur une machine plus puissante, puis copiés dans le dossier `client-backgrounds` du volume du VPS exécutant les mêmes sources.
