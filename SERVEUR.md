# Comment lancer l'application

Cette application utilise des modules ES6 qui nécessitent un serveur HTTP pour fonctionner.

## Option 1 : Python (recommandé)

Si vous avez Python installé :

```bash
# Python 3
python -m http.server 8000

# Ou Python 2
python -m SimpleHTTPServer 8000
```

Puis ouvrez votre navigateur à : `http://localhost:8000`

## Option 2 : Node.js (avec npx)

```bash
npx serve
```

## Option 3 : VS Code Live Server

Si vous utilisez VS Code, installez l'extension "Live Server" et cliquez sur "Go Live" dans la barre d'état.

## Option 4 : Autres serveurs

- **PHP** : `php -S localhost:8000`
- **Ruby** : `ruby -run -e httpd . -p 8000`

## Important

⚠️ **Ne pas ouvrir directement `index.html` dans le navigateur** - les modules ES6 ne fonctionneront pas avec le protocole `file://`

