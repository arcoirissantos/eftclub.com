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
        (post) => `
        <li class="snippet">
          <a href="${post.url}">
            <img 
              src="${post.image}" 
              alt="${post.image_alt || post.title}"
            >
            <h3 class="snippet_title">${post.title}</h3>
            <p class="pub-date">${post.date}</p>
            <p>Autora: ${post.author}</p>
            <p>${post.description}</p>
          </a>
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

    // 1) Empty → revert to full, newest-first
    if (!raw) {
      renderResults(posts)
      return
    }

    // 2) Too short → show full + prompt
    if (q.length < SEARCH_THRESHOLD) {
      renderResults(posts)
      return showMessage('Por favor, digite no mínimo 3 caracteres.')
    }

    // 3) Valid query → run Fuse
    const fuseRes = fuse.search(q)
    if (!fuseRes.length) {
      renderResults([])
      return showMessage('Nenhum resultado encontrado.')
    }

    // 4) Got matches → extract & render (order as returned by Fuse)
    renderResults(fuseRes.map((r) => r.item))
  }

  // Fetch + initialize
  fetch('/search.json')
    .then((res) => res.json())
    .then((data) => {
      // Map raw JSON into the shape we render
      const loaded = data.map((item) => ({
        title: item.title,
        description: item.description,
        url: item.url,
        date: item.date,
        author: item.author,
        image: item.image,
        image_alt: item.image_alt
      }))

      // Reverse for newest-first default
      posts = loaded.reverse()

      // Build Fuse on the original data array (order doesn't matter for Fuse)
      fuse = new Fuse(data, {
        keys: ['title', 'description'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: false
      })

      // No initial render: server markup stays until first search

      // Wire up input events
      const live = posts.length <= SEARCH_THRESHOLD
      if (live) {
        searchInput.addEventListener('input', doSearch)
      } else {
        searchInput.addEventListener('input', () => {
          if (!searchInput.value.trim()) {
            clearMessage()
            renderResults(posts)
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
