import Fuse from 'fuse.js'

document.addEventListener('DOMContentLoaded', () => {
  // —————————————————————————————————————————
  // 1) Form‐submit guard (always show in sidebar)
  // —————————————————————————————————————————
  const form = document.getElementById('index-search-form')
  const allMessageEls = Array.from(document.querySelectorAll('#search-message'))
  // On /search/ there are two: [0] is page, [1] sidebar. Else just [0].
  const pageMessageEl = allMessageEls.length > 1 ? allMessageEls[0] : null
  const sidebarMessageEl =
    allMessageEls.length > 1 ? allMessageEls[1] : allMessageEls[0]

  if (form && sidebarMessageEl) {
    form.addEventListener('submit', (e) => {
      const rawInput = (
        form.querySelector('input[name="q"]').value || ''
      ).trim()
      if (!rawInput) {
        e.preventDefault()
        sidebarMessageEl.textContent = 'Nenhum termo de busca fornecido.'
        return
      }
      if (rawInput.length < 3) {
        e.preventDefault()
        sidebarMessageEl.textContent =
          'Por favor, insira pelo menos três caracteres.'
        return
      }
      // else allow the navigation to /search/?q=...
    })
  }

  // —————————————————————————————————————————
  // 2) Client‐side search (on /search/ page)
  // —————————————————————————————————————————
  const resultsList = document.getElementById('search-results')
  if (!resultsList) return // not on /search/

  const infoEl = document.getElementById('search-info')
  const snippetTpl = document.getElementById('snippet-template')

  // grab & normalize query from URL
  const params = new URLSearchParams(window.location.search)
  const rawQ = params.get('q') || ''
  const q = rawQ.trim().toLowerCase()

  function clearResults() {
    resultsList.querySelectorAll('li.snippet').forEach((el) => el.remove())
  }
  function showPageMessage(txt) {
    clearResults()
    if (pageMessageEl) pageMessageEl.textContent = txt
  }

  // — Validation *before* doing anything on the search page —
  if (!q) {
    showPageMessage('Nenhum termo de busca fornecido.')
    return
  }
  if (q.length < 3) {
    showPageMessage('Por favor, insira pelo menos três caracteres.')
    return
  }

  // now that q is valid (≥3 chars), show the “Resultados para…” line
  if (infoEl) {
    infoEl.textContent = `Resultados da pesquisa para "${rawQ.trim()}"`
  }

  // fetch + Fuse
  fetch('/search.json')
    .then((res) => res.json())
    .then((data) => {
      const fuse = new Fuse(data, {
        keys: ['title', 'description'],
        threshold: 0.3,
        ignoreLocation: true
      })
      const normalize = (str) =>
        str
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')

      const results = fuse.search(normalize(q)).map((r) => r.item)
      if (!results.length) {
        return showPageMessage('Nenhum resultado encontrado.')
      }

      // clear any sidebar message & previous page message
      sidebarMessageEl.textContent = ''
      if (pageMessageEl) pageMessageEl.textContent = ''

      // render hits
      clearResults()
      results.forEach((post) => {
        const clone = snippetTpl.content.cloneNode(true)
        clone.querySelector('a').href = post.url
        const imgEl = clone.querySelector('img')
        imgEl.src = post.image
        imgEl.alt = post.image_alt || post.title
        clone.querySelector('.snippet_title').textContent = post.title
        clone.querySelector('.snippet_author-date').textContent =
          `${post.author} | ${post.date}`
        clone.querySelector('.snippet_description').textContent =
          post.description
        resultsList.appendChild(clone)
      })

      // animate them in if you kept the .visible logic
      const items = Array.from(resultsList.querySelectorAll('li.snippet'))
      requestAnimationFrame(() => {
        items.forEach((el, i) => {
          setTimeout(() => el.classList.add('visible'), i * 50)
        })
      })
    })
    .catch((err) => {
      console.error('Erro ao carregar search.json:', err)
      showPageMessage('Erro ao carregar resultados.')
    })
})
