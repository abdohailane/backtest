# Guide de Déploiement - Structure Complexe de Devis

Ce guide vous accompagne pour déployer votre application de gestion de devis avec sa structure complexe sur Supabase et Render.

## 🏗️ Structure de la Base de Données

Votre application utilise une structure hiérarchique complexe :

```
devis
├── section_instance (instances de sections)
│   └── sous_section_instance (instances de sous-sections)
│       └── item_instance (instances d'items)
│           └── sous_item_instance (instances de sous-items)
```

**Tables principales :**
- `client` - Informations des clients
- `user` - Utilisateurs de l'application
- `section_type` - Types de sections (ex: "Matériaux", "Main d'œuvre")
- `sous_section_type` - Sous-types de sections
- `item_type` - Types d'items
- `sous_item_type` - Sous-types d'items
- `devis` - Devis principaux
- `section_instance` - Instances de sections dans un devis
- `sous_section_instance` - Instances de sous-sections
- `item_instance` - Instances d'items
- `sous_item_instance` - Instances de sous-items avec prix
- `remarque` - Remarques sur les éléments
- `password_reset_codes` - Codes de réinitialisation

## 🚀 Étapes de Déploiement

### 1. Configuration Supabase

#### 1.1 Créer le projet
1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet
3. Notez votre `SUPABASE_URL` et `SUPABASE_ANON_KEY`

#### 1.2 Exécuter le script de migration
1. Dans Supabase Dashboard > SQL Editor
2. Copiez et exécutez le contenu de `supabase-migration.sql`
3. Ce script crée :
   - Toutes les tables avec leurs relations
   - Les index pour les performances
   - Les triggers pour `date_modification`
   - Les procédures stockées pour les remarques
   - Les politiques RLS (Row Level Security)

#### 1.3 Vérifier la structure
```sql
-- Vérifier que toutes les tables sont créées
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vérifier les relations
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### 2. Configuration Render

#### 2.1 Créer le service
1. Allez sur [render.com](https://render.com)
2. Créez un nouveau "Web Service"
3. Connectez votre repository GitHub
4. Render détectera automatiquement le fichier `render.yaml`

#### 2.2 Variables d'environnement
Dans Render Dashboard > Environment Variables, ajoutez :

```bash
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-from-supabase

# Sécurité
JWT_SECRET=une_cle_secrete_tres_longue_et_complexe_pour_la_production_2024

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_application

# Application
BASE_URL=https://your-app-name.onrender.com
NODE_ENV=production
PORT=10000
```

### 3. Migration des Données

#### 3.1 Préparer la migration
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement locales
cp env.example .env
# Remplir avec vos valeurs Supabase et SQL Server
```

#### 3.2 Exécuter la migration
```bash
# Migrer les données de SQL Server vers Supabase
npm run migrate
```

Le script migrera dans cet ordre :
1. `client` - Clients
2. `user` - Utilisateurs
3. `section_type` - Types de sections
4. `sous_section_type` - Sous-types de sections
5. `item_type` - Types d'items
6. `devis` - Devis
7. `section_instance` - Instances de sections
8. `sous_section_instance` - Instances de sous-sections
9. `item_instance` - Instances d'items
10. `sous_item_type` - Sous-types d'items
11. `sous_item_instance` - Instances de sous-items
12. `remarque` - Remarques
13. `password_reset_codes` - Codes de réinitialisation

#### 3.3 Vérifier la migration
```sql
-- Vérifier les comptes
SELECT 'client' AS table_name, COUNT(*) AS count FROM client
UNION ALL
SELECT 'user', COUNT(*) FROM "user"
UNION ALL
SELECT 'devis', COUNT(*) FROM devis
UNION ALL
SELECT 'section_instance', COUNT(*) FROM section_instance
UNION ALL
SELECT 'sous_section_instance', COUNT(*) FROM sous_section_instance
UNION ALL
SELECT 'item_instance', COUNT(*) FROM item_instance
UNION ALL
SELECT 'sous_item_instance', COUNT(*) FROM sous_item_instance
UNION ALL
SELECT 'remarque', COUNT(*) FROM remarque;
```

### 4. Adaptation du Code

#### 4.1 Mettre à jour les routes
Vos routes devront être adaptées pour utiliser Supabase au lieu de SQL Server :

```javascript
// Exemple d'adaptation pour les devis
const { supabase } = require('../supabase-config');

// Récupérer un devis avec ses relations
async function getDevisWithRelations(devisId) {
  const { data: devis, error: devisError } = await supabase
    .from('devis')
    .select(`
      *,
      client:client_id(*),
      user:user_id(*),
      section_instances:section_instance(
        *,
        section_type:section_type_id(*),
        sous_section_instances:sous_section_instance(
          *,
          sous_section_type:soussection_type_id(*),
          item_instances:item_instance(
            *,
            item_type:item_type_id(*),
            sous_item_instances:sous_item_instance(
              *,
              sous_item_type:sousitem_type_id(*)
            )
          )
        )
      )
    `)
    .eq('id', devisId)
    .single();

  return { devis, error: devisError };
}
```

#### 4.2 Gestion des remarques
Utilisez les procédures stockées créées :

```javascript
// Ajouter une remarque
const { data, error } = await supabase
  .rpc('sp_add_remarque', {
    p_devis_id: devisId,
    p_element_type: 'section_instance',
    p_element_id: sectionId,
    p_contenu: 'Remarque sur cette section',
    p_user_id: userId
  });

// Récupérer les remarques d'un devis
const { data: remarques, error } = await supabase
  .rpc('sp_get_remarques_by_devis', {
    p_devis_id: devisId
  });
```

### 5. Tests et Validation

#### 5.1 Tests de base
```bash
# Tester la connexion Supabase
node -e "
const { supabase } = require('./supabase-config');
supabase.from('client').select('count').then(r => console.log('Connexion OK:', r.data));
"

# Tester les procédures stockées
node -e "
const { supabase } = require('./supabase-config');
supabase.rpc('sp_get_remarques_by_devis', { p_devis_id: 1 }).then(r => console.log('Procédure OK:', r.data));
"
```

#### 5.2 Tests de performance
```sql
-- Vérifier les index
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Analyser les performances
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM devis d
JOIN section_instance si ON d.id = si.devis_id
WHERE d.user_id = 1;
```

### 6. Sécurité et Permissions

#### 6.1 Row Level Security (RLS)
Les politiques RLS sont configurées pour :
- Les utilisateurs ne voient que leurs propres devis
- Les instances sont protégées par la hiérarchie des devis
- Les remarques sont liées aux devis des utilisateurs

#### 6.2 Authentification
- Utilisez Supabase Auth pour l'authentification
- Les tokens JWT contiennent l'ID utilisateur
- Les politiques RLS utilisent `auth.uid()` pour filtrer

### 7. Monitoring et Maintenance

#### 7.1 Logs Supabase
- Surveillez les logs dans Supabase Dashboard
- Vérifiez les erreurs RLS
- Monitorisez les performances des requêtes

#### 7.2 Logs Render
- Surveillez les logs d'application
- Vérifiez les erreurs de connexion Supabase
- Monitorisez les temps de réponse

### 8. Sauvegarde et Récupération

#### 8.1 Sauvegarde Supabase
```bash
# Sauvegarde automatique (incluse dans Supabase Pro)
# Ou sauvegarde manuelle
pg_dump $SUPABASE_DB_URL > backup.sql
```

#### 8.2 Récupération
```bash
# Restaurer depuis une sauvegarde
psql $SUPABASE_DB_URL < backup.sql
```

## 🚨 Troubleshooting

### Erreurs courantes

#### Erreur de connexion Supabase
```bash
# Vérifier les variables d'environnement
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY
```

#### Erreur RLS
```sql
-- Vérifier les politiques
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

#### Erreur de migration
```bash
# Vérifier la connexion SQL Server
node -e "
const sql = require('mssql');
const config = { /* votre config */ };
sql.connect(config).then(() => console.log('SQL Server OK')).catch(console.error);
"
```

## 📞 Support

Pour toute question :
- [Documentation Supabase](https://supabase.com/docs)
- [Documentation Render](https://render.com/docs)
- Vérifiez les logs dans les dashboards respectifs 