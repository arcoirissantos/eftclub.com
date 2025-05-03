import Fuse from 'fuse.js'

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar‐form guard omitted here for brevity…

  // 2) Client‐side search on /search/
  const resultsList = document.getElementById('search-results')
  if (!resultsList) return

  const messageEl = document.getElementById('search-message')
  const infoEl = document.getElementById('search-info')
  const snippetTpl = document.getElementById('snippet-template')

  // read raw query (to display it verbatim)
  const params = new URLSearchParams(window.location.search)
  const rawQ = params.get('q') || ''
  const q = rawQ.trim().toLowerCase()

  //  ❏ Show the header line right away:
  if (infoEl) {
    if (rawQ) {
      infoEl.textContent = `Resultados da pesquisa para "${rawQ.trim()}"`
    } else {
      infoEl.textContent = ''
    }
  }

  // validation BEFORE fetch…
  function clearResults() {
    resultsList.querySelectorAll('li.snippet').forEach((el) => el.remove())
  }
  function showMessage(txt) {
    clearResults()
    messageEl.textContent = txt
  }

  if (!q) {
    return showMessage('Nenhum termo de busca fornecido.')
  }
  if (q.length < 3) {
    return showMessage('Por favor, insira pelo menos três caracteres.')
  }

  // …then fetch & Fuse
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
        return showMessage('Nenhum resultado encontrado.')
      }

      // render hits
      messageEl.textContent = ''
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
      showMessage('Erro ao carregar resultados.')
    })
})
