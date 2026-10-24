import { useSyncExternalStore } from 'react'

/** Bağımlılıksız, hash tabanlı küçük yönlendirici: "#/sandbox" → "/sandbox" */
function currentRoute() {
  return window.location.hash.replace(/^#/, '') || '/'
}

function subscribe(cb: () => void) {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

export function useRoute() {
  return useSyncExternalStore(subscribe, currentRoute)
}

export function navigate(path: string) {
  window.location.hash = path
}
