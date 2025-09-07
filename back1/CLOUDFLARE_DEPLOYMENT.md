# 🚀 Guide de Déploiement sur Cloudflare Workers

## 📋 Prérequis

1. ✅ Base de données Neon configurée
2. ✅ Variables d'environnement configurées
3. ✅ Compte Cloudflare créé

## 🔧 Configuration Cloudflare Workers

### 1. Installation de Wrangler

```bash
npm install -g wrangler
```

### 2. Authentification Cloudflare

```bash
wrangler login
```

### 3. Configuration des Variables d'Environnement

Dans le dashboard Cloudflare Workers :

1. Allez dans **Workers & Pages** > **Votre Worker** > **Settings** > **Variables**
2. Ajoutez ces variables :

```
DATABASE_URL = postgresql://neondb_owner:npg_P9BwyI7VbHzK@ep-dawn-fog-ab7yv5z9-pooler.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET = votre_jwt_secret_tres_long_et_complexe
EMAIL_HOST = smtp.gmail.com
EMAIL_PORT = 587
EMAIL_USER = votre_email@gmail.com
EMAIL_PASS = votre_mot_de_passe_application_gmail
BASE_URL = https://votre-worker.votre-subdomain.workers.dev
```

### 4. Déploiement

```bash
# Déployer le worker
wrangler deploy

# Ou pour un environnement spécifique
wrangler deploy --env production
```

## 🔄 Migration des Données

### 1. Vérifier le schéma Neon

```bash
npm run check-schema
```

### 2. Migrer les données

```bash
npm run migrate
```

### 3. Vérifier la migration

```bash
npm run test-neon
```

## 📁 Structure du Projet

```
back1/
├── cloudflare-worker.js    # Worker principal
├── wrangler.toml          # Configuration Wrangler
├── neon-db.js             # Connexion Neon
├── migrate-to-neon.js     # Script de migration
├── test-neon.js           # Test de connexion
├── check-neon-schema.js   # Vérification schéma
└── .env                   # Variables locales
```

## 🧪 Tests

### Test local

```bash
# Tester la connexion Neon
npm run test-neon

# Vérifier le schéma
npm run check-schema

# Migrer les données
npm run migrate
```

### Test en production

```bash
# Déployer
wrangler deploy

# Vérifier les logs
wrangler tail

# Tester l'API
curl https://votre-worker.votre-subdomain.workers.dev/api/devis
```

## 🔧 Commandes Utiles

```bash
# Développement local
wrangler dev

# Déploiement
wrangler deploy

# Voir les logs
wrangler tail

# Gérer les secrets
wrangler secret put DATABASE_URL
wrangler secret put JWT_SECRET

# Voir les variables
wrangler secret list
```

## 🚨 Dépannage

### Erreur de connexion à la base

1. Vérifiez votre `DATABASE_URL` dans les variables Cloudflare
2. Testez la connexion avec `npm run test-neon`
3. Vérifiez que votre base Neon est active

### Erreur CORS

Les headers CORS sont déjà configurés dans le worker.

### Erreur de migration

1. Vérifiez que votre SQL Server est accessible
2. Vérifiez que toutes les tables existent dans Neon
3. Lancez `npm run check-schema` pour diagnostiquer

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs avec `wrangler tail`
2. Testez localement avec `wrangler dev`
3. Vérifiez les variables d'environnement dans le dashboard Cloudflare