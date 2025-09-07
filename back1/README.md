# Backend API - Déploiement Supabase + Render

Ce projet est configuré pour être déployé avec Supabase (base de données) et Render (backend).

## 🚀 Déploiement

### 1. Configuration Supabase

1. **Créer un projet Supabase**
   - Allez sur [supabase.com](https://supabase.com)
   - Créez un nouveau projet
   - Notez votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`

2. **Migrer la base de données**
   - Dans votre dashboard Supabase, allez dans "SQL Editor"
   - Exécutez le contenu du fichier `supabase-migration.sql`
   - Cela créera toutes les tables nécessaires

3. **Configurer l'authentification**
   - Dans Supabase Dashboard > Authentication > Settings
   - Configurez vos providers d'authentification (email, etc.)

### 2. Configuration Render

1. **Créer un compte Render**
   - Allez sur [render.com](https://render.com)
   - Créez un compte et connectez votre repository GitHub

2. **Déployer le service**
   - Créez un nouveau "Web Service"
   - Connectez votre repository GitHub
   - Render détectera automatiquement le fichier `render.yaml`

3. **Configurer les variables d'environnement**
   Dans Render Dashboard > Environment Variables, ajoutez :
   ```
   SUPABASE_URL=votre_url_supabase
   SUPABASE_ANON_KEY=votre_cle_anon_supabase
   JWT_SECRET=une_cle_secrete_tres_longue_et_complexe
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=votre_email@gmail.com
   EMAIL_PASS=votre_mot_de_passe_app
   BASE_URL=https://votre-app-name.onrender.com
   ```

### 3. Configuration locale

1. **Installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer les variables d'environnement**
   - Copiez `env.example` vers `.env`
   - Remplissez les valeurs avec vos configurations

3. **Tester localement**
   ```bash
   npm run dev
   ```

## 📁 Structure du projet

```
back1/
├── routes/           # Routes API
├── middleware/       # Middleware d'authentification
├── utils/           # Utilitaires (email, etc.)
├── supabase-config.js  # Configuration Supabase
├── supabase-migration.sql  # Script de migration
├── render.yaml      # Configuration Render
├── package.json     # Dépendances
└── server.js        # Point d'entrée
```

## 🔧 Variables d'environnement

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SUPABASE_URL` | URL de votre projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJ...` |
| `JWT_SECRET` | Clé secrète pour JWT | `ma_cle_tres_secrete` |
| `EMAIL_HOST` | Serveur SMTP | `smtp.gmail.com` |
| `EMAIL_PORT` | Port SMTP | `587` |
| `EMAIL_USER` | Email d'envoi | `user@gmail.com` |
| `EMAIL_PASS` | Mot de passe app | `app_password` |
| `BASE_URL` | URL de votre API | `https://app.onrender.com` |

## 🛠️ Scripts disponibles

- `npm start` : Démarre le serveur en production
- `npm run dev` : Démarre le serveur en développement avec nodemon

## 🔒 Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Authentification via Supabase Auth
- Variables d'environnement pour les secrets
- CORS configuré

## 📧 Email

Le service d'email utilise Nodemailer avec Gmail. Pour configurer :
1. Activez l'authentification à 2 facteurs sur Gmail
2. Générez un "mot de passe d'application"
3. Utilisez ce mot de passe dans `EMAIL_PASS`

## 🚨 Troubleshooting

### Erreur de connexion Supabase
- Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont corrects
- Assurez-vous que les tables existent dans Supabase

### Erreur d'email
- Vérifiez les paramètres SMTP
- Assurez-vous que le mot de passe d'application est correct

### Erreur de déploiement Render
- Vérifiez que toutes les variables d'environnement sont configurées
- Consultez les logs dans Render Dashboard

## 📞 Support

Pour toute question ou problème, consultez :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Render](https://render.com/docs) 