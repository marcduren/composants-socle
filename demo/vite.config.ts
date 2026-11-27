import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/** Racine de la bibliothèque (dossier parent). */
const socle = fileURLToPath(new URL('..', import.meta.url))

export default defineConfig({
  plugins: [vue(), tailwindcss()],
  resolve: {
    // `import … from 'socle-ui'` pointe sur les sources du dossier parent, comme un paquet installé.
    alias: { 'socle-ui': socle },
    // Les composants sont hors de demo/ : sans dedupe, `import 'vue'` y chercherait
    // un autre node_modules, et deux copies de Vue cohabiteraient.
    dedupe: ['vue'],
  },
  server: {
    // Autorise le serveur de dev à lire les fichiers du dossier parent.
    fs: { allow: [socle] },
  },
})
