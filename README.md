# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Sitemap dinamico na Vercel

O sitemap principal fica em `public/sitemap.xml` e aponta para `https://dralueinebarradas.com.br/api/sitemap-posts.xml`.

A rota `api/sitemap-posts.xml.js`:
- consulta os posts no Firestore;
- filtra apenas posts publicados (`status !== "draft"`);
- gera XML com home + URLs de posts.

### Variaveis de ambiente (Vercel)

Configure no projeto da Vercel:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY` (cole a chave privada completa; `\n` sera convertido automaticamente)
- `SITE_URL` (opcional, default: `https://dralueinebarradas.com.br`)

### Atualizacao periodica

`vercel.json` inclui um cron para chamar o sitemap dinamico a cada 6 horas:

`0 */6 * * *  ->  /api/sitemap-posts.xml`
