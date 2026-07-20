import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

/**
 * GitHub Pages serves a project site from /<repo-name>/, and that prefix has to be
 * baked in at build time — it feeds asset URLs, the router basename, and every
 * `import.meta.env.BASE_URL` lookup. Hardcoding it breaks the moment the same
 * source is cloned into a differently-named repo, which is exactly what happens
 * here: doux124/doux serves /doux/ and jordanlowjunyi/Jordan serves /Jordan/.
 *
 * So derive it from the clone's own origin remote. Each checkout then builds the
 * correct base with no per-machine configuration. Set VITE_BASE to override (e.g.
 * a custom domain, where the base is just '/').
 */
function resolveBase(): string {
  if (process.env.VITE_BASE) return process.env.VITE_BASE
  try {
    const url = execSync('git config --get remote.origin.url', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    const repo = url.match(/\/([^/]+?)(?:\.git)?$/)?.[1]
    if (repo) return `/${repo}/`
  } catch {
    // no git, no remote, or a detached tarball build — fall through
  }
  return '/'
}

const base = resolveBase()
console.log(`[vite] base = ${base}`)

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
  ],
})
