# Intégrer Socle dans un projet Vite + Vue + Tailwind

Ce guide décrit comment utiliser les composants Socle dans une application Vite + Vue 3 + Tailwind CSS v4. Pour la description des composants eux-mêmes, voir le [README](README.md) et le dossier [`docs/`](docs/) (un fichier par composant).

Socle est distribué **en sources** (`.vue`, `.ts`), sans étape de build : c'est le Vite de l'application qui compile les composants. L'intégration consiste donc à installer le paquet, puis à régler Vite, Tailwind et, si besoin, TypeScript.

## Sommaire

1. [Prérequis](#1-prérequis)
2. [Installer le paquet](#2-installer-le-paquet)
3. [Configurer Vite](#3-configurer-vite)
4. [Configurer Tailwind](#4-configurer-tailwind)
5. [Configurer TypeScript](#5-configurer-typescript)
6. [Utiliser les composants](#6-utiliser-les-composants)
7. [Récapitulatif](#7-récapitulatif)
8. [Problèmes fréquents](#8-problèmes-fréquents)

## 1. Prérequis

| Outil | Version |
| --- | --- |
| Vue | ≥ 3.5 |
| Tailwind CSS | v4, avec le plugin `@tailwindcss/vite` |
| Vite | avec `@vitejs/plugin-vue` |

`vue` et `tailwindcss` sont des **dépendances paires** (`peerDependencies`) : Socle ne les installe pas, c'est l'application qui les fournit.

Pour partir d'un projet vide :

```sh
npm create vite@latest mon-app -- --template vue-ts
cd mon-app
npm install
npm install -D tailwindcss @tailwindcss/vite
```

Côté navigateurs, les composants reposent sur `<dialog>`, l'attribut `popover`, le CSS Anchor Positioning et `@starting-style`, sans solution de repli. Vérifiez que les navigateurs que vous devez prendre en charge les supportent, en particulier l'Anchor Positioning.

## 2. Installer le paquet

Quatre façons de l'installer, selon l'usage.

### Depuis le registre npm (recommandé pour une application)

```sh
npm install socle-ui
```

### Depuis le dépôt Git (pour une version non encore publiée)

```sh
npm install "github:marcduren/socle-ui#v0.1.6"
# forme longue équivalente :
# npm install "git+https://github.com/marcduren/socle-ui.git#v0.1.6"
```

- Indiquez un tag ou un commit après `#` pour figer la version. Sans cela, `npm install` peut récupérer une autre version d'une machine à l'autre.
- Le dépôt est public sur GitHub ([marcduren/socle-ui](https://github.com/marcduren/socle-ui)) : aucune authentification n'est nécessaire pour l'installer.

### Depuis un dossier local (pour développer Socle et l'application en même temps)

```sh
npm install ../socle-ui
```

npm crée un **lien symbolique** `node_modules/socle-ui` vers le dossier : toute modification d'un composant est visible immédiatement dans l'application. Ce mode demande le réglage `dedupe` décrit à l'[étape 3](#3-configurer-vite).

### Depuis une archive

Dans le dossier de Socle :

```sh
npm pack            # produit socle-ui-0.1.6.tgz
```

Puis dans l'application :

```sh
npm install ../chemin/vers/socle-ui-0.1.6.tgz
```

L'archive ne contient que les fichiers listés dans le champ `files` du `package.json` : composants, `index.ts`, `classes.ts`, `table.ts` et `socle.css`.

## 3. Configurer Vite

`vite.config.ts` :

```ts
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // Une seule copie de Vue, même si socle-ui est installé par lien symbolique.
    dedupe: ['vue'],
  },
})
```

**Pourquoi `dedupe` ?** Avec un lien symbolique, Vite suit le lien jusqu'au vrai dossier de Socle. Les `import 'vue'` des composants y chercheraient alors un autre `node_modules`. On obtiendrait deux copies de Vue, ou une erreur de résolution. `dedupe: ['vue']` force l'utilisation de la copie de l'application. Avec une installation depuis Git ou une archive, ce réglage est inutile mais sans effet négatif : autant le laisser.

## 4. Configurer Tailwind

C'est l'étape la plus souvent oubliée. Tailwind v4 **ignore `node_modules`** lors de la détection automatique des sources. Sans directive `@source`, les classes utilisées par les composants ne sont pas générées et les composants s'affichent sans style.

Dans la feuille CSS principale de l'application (par exemple `src/style.css`) :

```css
@import "tailwindcss";
@source "../node_modules/socle-ui";
```

- Le chemin est **relatif à la feuille CSS**. Depuis `src/style.css`, `../node_modules/socle-ui` est correct. Adaptez-le si la feuille est ailleurs.
- Vérifiez que cette feuille est bien importée au démarrage, par exemple dans `src/main.ts` :

  ```ts
  import { createApp } from 'vue'
  import App from './App.vue'
  import './style.css'

  createApp(App).mount('#app')
  ```

- **Inutile d'importer `socle.css`** : les composants qui en ont besoin l'importent eux-mêmes, et Vite ne l'inclut qu'une fois.

## 5. Configurer TypeScript

Cette étape ne concerne que les projets qui vérifient les types avec `vue-tsc`.

Dans `tsconfig.json` (ou `tsconfig.app.json` selon le modèle Vite) :

```json
{
  "compilerOptions": {
    "moduleResolution": "Bundler"
  }
}
```

- `"moduleResolution": "Bundler"` est nécessaire pour que TypeScript lise le champ `exports` du paquet (`socle-ui`, `socle-ui/SocleSelect.vue`, `socle-ui/classes`). C'est déjà le réglage par défaut des modèles Vite.
- Les fichiers `.vue` doivent être déclarés, ce que fait déjà `vue-tsc`. Si l'éditeur signale `Cannot find module 'socle-ui/SocleSelect.vue'`, vérifiez que l'extension Vue (Vue - Official) est active.
- Socle contient des sources `.ts` et non des fichiers de déclaration `.d.ts`. `vue-tsc` vérifie donc aussi le code de Socle, avec les options du projet : `skipLibCheck` ne s'applique pas à ces fichiers. Le code passe la vérification de la démo, qui est en `strict` avec `noUncheckedIndexedAccess`, ce qui couvre la plupart des configurations.

## 6. Utiliser les composants

### Import depuis le point d'entrée

```vue
<script setup lang="ts">
import { ref } from 'vue'
import { SocleInput, SocleSelect, SocleDatePicker, SocleDialog } from 'socle-ui'
import type { SelectOption } from 'socle-ui'

const email = ref('')
const country = ref<string | null>(null)
const date = ref<string | null>(null)
const open = ref(false)

const countries: SelectOption<string>[] = [
  { value: 'fr', label: 'France' },
  { value: 'be', label: 'Belgique' },
]
</script>

<template>
  <form class="flex max-w-md flex-col gap-4" @submit.prevent="open = true">
    <SocleInput v-model.trim="email" label="E-mail" type="email" required />
    <SocleSelect v-model="country" label="Pays" :options="countries" />
    <SocleDatePicker v-model="date" label="Date de livraison" />
    <button class="rounded-md bg-teal-600 px-3 py-1.5 text-sm text-white">Valider</button>
  </form>

  <SocleDialog v-model="open" title="Confirmation">
    <p>Formulaire envoyé.</p>
  </SocleDialog>
</template>
```

### Import d'un seul composant

```ts
import SocleSelect from 'socle-ui/SocleSelect.vue'
```

### Classes partagées

Pour habiller un contrôle maison comme les champs Socle :

```ts
import { fieldBoxClass } from 'socle-ui/classes'
```

Le détail des props, slots et événements de chaque composant est dans son fichier du dossier [`docs/`](docs/) (par exemple [`docs/SocleSelect.md`](docs/SocleSelect.md)).

## 7. Récapitulatif

| Étape | Fichier | À faire |
| --- | --- | --- |
| Installation | `package.json` | `npm install socle-ui`, ou depuis Git, un dossier ou une archive |
| Vite | `vite.config.ts` | plugins `vue()` et `tailwindcss()`, `resolve.dedupe: ['vue']` |
| Tailwind | `src/style.css` | `@source "../node_modules/socle-ui";` après `@import "tailwindcss";` |
| TypeScript | `tsconfig.json` | `"moduleResolution": "Bundler"` |
| Code | composants | `import { … } from 'socle-ui'` |

## 8. Problèmes fréquents

| Symptôme | Cause probable | Solution |
| --- | --- | --- |
| Composants affichés sans style (bordures, couleurs, espacements absents) | Tailwind n'analyse pas le paquet | Ajouter `@source` avec le bon chemin relatif ([étape 4](#4-configurer-tailwind)) |
| Liste, calendrier ou dialogue sans animation ni positionnement | `socle.css` non chargé, ou navigateur trop ancien | Importer les composants depuis `socle-ui` (pas de copie des fichiers), vérifier la prise en charge de l'Anchor Positioning |
| `Failed to resolve import "vue"` ou avertissement sur plusieurs instances de Vue | Installation par lien symbolique | Ajouter `resolve.dedupe: ['vue']` ([étape 3](#3-configurer-vite)) |
| `[plugin:vite:vue]` ou `Unknown file extension ".vue"` | Plugin Vue absent | Ajouter `@vitejs/plugin-vue` dans `vite.config.ts` |
| `Cannot find module 'socle-ui/…'` dans l'éditeur ou `vue-tsc` | Résolution de modules inadaptée | `"moduleResolution": "Bundler"` ([étape 5](#5-configurer-typescript)) |
| Erreurs `vue-tsc` dans les fichiers de Socle | Options TypeScript plus strictes que celles de la démo | Signaler l'erreur sur le dépôt de Socle. En attendant, corriger localement ou assouplir l'option concernée |
| `npm install` échoue sur l'URL Git | Git absent de la machine, ou tag / commit inexistant après `#` | Installer Git, vérifier la référence sur [GitHub](https://github.com/marcduren/socle-ui) |
