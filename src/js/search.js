import Fuse from 'fuse.js'

document.addEventListener('DOMContentLoaded', () => {
  // —————————————————————————————————————————
  // 1) Form‐submit guard (always show in sidebar)
  // —————————————————————————————————————————
  const form = document.getElementById('index-search-form')
  const allMessageEls = Array.from(document.querySelectorAll('#search-message'))
  // If there are two, [0] is the page’s, [1] is the sidebar’s; otherwise just [0].
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
      } else if (rawInput.length < 3) {
        e.preventDefault()
        sidebarMessageEl.textContent =
          'Por favor, insira pelo menos três caracteres.'
      }
    })
  }

  // —————————————————————————————————————————
  // 2) Client‐side search (on /search/ page)
  // —————————————————————————————————————————
  const resultsList = document.getElementById('search-results')
  if (!resultsList) return // not on /search/

  const infoEl = document.getElementById('search-info')
  const snippetTpl = document.getElementById('snippet-template')
  // reuse sidebarMessageEl & pageMessageEl references

  // grab & normalize query
  const params = new URLSearchParams(window.location.search)
  const rawQ = params.get('q') || ''
  const q = rawQ.trim().toLowerCase()

  // show “Resultados da pesquisa para …”
  if (infoEl) {
    infoEl.textContent = rawQ
      ? `Resultados da pesquisa para "${rawQ.trim()}"`
      : ''
  }

  function clearResults() {
    resultsList.querySelectorAll('li.snippet').forEach((el) => el.remove())
  }

  function showSidebarMessage(txt) {
    if (sidebarMessageEl) {
      sidebarMessageEl.textContent = txt
    }
  }
  function showPageMessage(txt) {
    clearResults()
    if (pageMessageEl) {
      pageMessageEl.textContent = txt
    }
  }

  // **Validation before fetching**: messages in the sidebar
  if (!q) {
    return showSidebarMessage('Nenhum termo de busca fornecido.')
  }
  if (q.length < 3) {
    return showSidebarMessage('Por favor, insira pelo menos três caracteres.')
  }

  // valid → fetch + Fuse
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

      // render hits (clear sidebar message, keep page message empty)
      sidebarMessageEl.textContent = ''
      pageMessageEl.textContent = ''
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
    })
    .catch((err) => {
      console.error('Erro ao carregar search.json:', err)
      showPageMessage('Erro ao carregar resultados.')
    })
})
