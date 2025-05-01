// packages
import Fuse from 'fuse.js'

//----- handle btn effect on touch devices -----//
document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'))
  btn.addEventListener('touchend', () => btn.classList.remove('pressed'))
  btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'))
})

//----- handle depoimento popup -----//
const popup = document.querySelector('.depoimentos_popup')
const openBtns = document.querySelectorAll('.open-button')
const closeBtn = document.querySelector('.close-button')

if (popup && closeBtn && openBtns.length) {
  function openDialog() {
    popup.showModal()
    document.body.classList.add('no-scroll')
    popup.classList.remove('animate-close')
    void popup.offsetWidth
    popup.classList.add('animate-open')
  }

  function closeDialog() {
    popup.classList.remove('animate-open')
    void popup.offsetWidth
    popup.classList.add('animate-close')

    popup.addEventListener('animationend', function onAnimationEnd(e) {
      if (e.animationName === 'fadeScaleOut') {
        popup.close()
        document.body.classList.remove('no-scroll')
        popup.classList.remove('animate-close')
        popup.removeEventListener('animationend', onAnimationEnd)
      }
    })
  }

  popup.addEventListener('cancel', (e) => {
    e.preventDefault()
    closeDialog()
  })

  openBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      openDialog()
    })
  })

  closeBtn.addEventListener('click', closeDialog)
}

//----- handle video overlay in YouTube Shorts -----//
document.querySelectorAll('.overlay').forEach((overlay) => {
  overlay.addEventListener('click', () => {
    const videoContainer = overlay.closest('.video-shorts')
    const iframe = videoContainer.querySelector('iframe')

    if (!iframe) return

    let src = iframe.getAttribute('src')
    if (!src.includes('autoplay=1')) {
      src += src.includes('?') ? '&autoplay=1' : '?autoplay=1'
      iframe.setAttribute('src', src)
    }

    overlay.style.opacity = '0'
    overlay.style.pointerEvents = 'none'
  })
})

//----- handle Fuse.js search bar and tags -----//

import Fuse from 'fuse.js'

document.addEventListener('DOMContentLoaded', () => {
  const SEARCH_THRESHOLD = 3

  const searchInput = document.getElementById('search-input')
  const resultsList = document.getElementById('search-results')
  const messageEl = document.getElementById('search-message')
  if (!searchInput || !resultsList || !messageEl) return

  let posts = []
  let fuse

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  function renderResults(items) {
    resultsList.innerHTML = items
      .map(
        (item) => `
        <li class="snippet">
          <h3 class="snippet_title">${item.title}</h3>
          <p class="pub-date">${item.date}</p>
          <p>Autora: ${item.author}</p>
          <p>${item.description}</p>
          <a href="${item.url}">Acessar</a>
        </li>
      `
      )
      .join('')
  }

  function showMessage(txt) {
    messageEl.textContent = txt
  }

  function clearMessage() {
    messageEl.textContent = ''
  }

  function doSearch() {
    clearMessage()
    const raw = searchInput.value.trim()
    const q = normalize(raw)

    // 1) Empty query: show all posts, clear any message
    if (!q) {
      renderResults(posts)
      return
    }

    // 2) Query too short (< 3 chars): show all + message
    if (q.length < SEARCH_THRESHOLD) {
      renderResults(posts)
      return showMessage('Por favor, digite no mínimo 3 caracteres.')
    }

    // 3) Proper query (>=3): perform Fuse search
    const fuseRes = fuse.search(q)
    if (!fuseRes.length) {
      renderResults([])
      return showMessage('Nenhum resultado encontrado.')
    }

    // 4) Got matches: extract and render
    const results = fuseRes.map((r) => r.item)
    renderResults(results)
  }

  // Fetch + initialize Fuse
  fetch('/search.json')
    .then((res) => res.json())
    .then((data) => {
      // Keep only the fields you need for render
      posts = data.map((item) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        date: item.date,
        author: item.author
      }))

      fuse = new Fuse(data, {
        keys: ['title', 'description'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: false
      })

      // Initial render: show all posts
      renderResults(posts)

      // Wire up search input
      const live = posts.length <= SEARCH_THRESHOLD
      if (live) {
        searchInput.addEventListener('input', doSearch)
      } else {
        searchInput.addEventListener('input', () => {
          if (!searchInput.value.trim()) {
            clearMessage()
            doSearch()
          }
        })
        searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            doSearch()
          }
        })
      }
    })
    .catch((err) => console.error('Erro ao carregar search.json:', err))
})
