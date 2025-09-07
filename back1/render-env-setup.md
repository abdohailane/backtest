# Configuration des Variables d'Environnement dans Render

## Variables Requises

Dans votre dashboard Render, allez dans votre service web > Environment Variables et ajoutez :

### 🔑 Supabase
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase
```

### 🔐 Sécurité
```
JWT_SECRET=une_cle_secrete_tres_longue_et_complexe_pour_la_production_2024
```

### 📧 Email (Gmail)
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application
```

### 🌐 Application
```
BASE_URL=https://your-app-name.onrender.com
NODE_ENV=production
PORT=10000
```

## Comment obtenir ces valeurs

### 1. Supabase
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un projet ou sélectionnez votre projet existant
3. Dans Settings > API, copiez :
   - **Project URL** → `SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`

### 2. JWT Secret
Générez une clé secrète forte :
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Email Gmail
1. Activez l'authentification à 2 facteurs sur Gmail
2. Allez dans "Sécurité" > "Mots de passe d'application"
3. Générez un mot de passe pour "Mail"
4. Utilisez ce mot de passe dans `EMAIL_PASS`

### 4. BASE_URL
Une fois votre app déployée sur Render, l'URL sera :
`https://your-app-name.onrender.com`

## Vérification

Après avoir configuré toutes les variables :

1. Redéployez votre application dans Render
2. Vérifiez les logs pour s'assurer qu'il n'y a pas d'erreurs
3. Testez votre API avec l'URL de Render

## Exemple de configuration complète

```
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxOTUwMTQzODkwfQ.example
JWT_SECRET=8f7d9e6c5b4a3928f7d9e6c5b4a3928f7d9e6c5b4a3928f7d9e6c5b4a3928f7d9e6c5b4a3928f7d9e6c5b4a3928f7d9e6c5b4a3928
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=monapp@gmail.com
EMAIL_PASS=abcd efgh ijkl mnop
BASE_URL=https://backtest-api.onrender.com
NODE_ENV=production
PORT=10000
``` 