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

//----- handle Fuse.js search bar -----//

document.addEventListener('DOMContentLoaded', () => {
  // ← Aqui você define o limite; troque pra 20, 5 ou o que precisar
  const SEARCH_THRESHOLD = 3

  const searchInput = document.getElementById('search-input')
  const resultsList = document.getElementById('search-results')
  const messageEl = document.getElementById('search-message')
  if (!searchInput || !resultsList || !messageEl) return

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  fetch('/search.json')
    .then((res) => res.json())
    .then((data) => {
      const fuse = new Fuse(data, {
        keys: ['title', 'description'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: false
      })

      // usa a constante em vez de “10” direto
      const liveSearch = data.length <= SEARCH_THRESHOLD

      const renderResults = (results) => {
        resultsList.innerHTML = results
          .map((r) => {
            const item = r.item
            return `
              <li class="snippet">
                <h3 class="snippet_title">${item.title}</h3>
                <a href="${item.url}">Acessar</a>
              </li>`
          })
          .join('')
      }

      const clearResults = () => {
        resultsList.innerHTML = ''
      }
      const showMessage = (txt) => {
        messageEl.textContent = txt
      }
      const clearMessage = () => {
        messageEl.textContent = ''
      }

      const doSearch = () => {
        clearMessage()
        const rawQuery = searchInput.value.trim()
        const query = normalize(rawQuery)

        if (!query) {
          renderResults(data.map((item) => ({ item })))
          return
        }
        if (query.length < 3) {
          clearResults()
          showMessage('Por favor, digite no mínimo 3 caracteres.')
          return
        }
        const results = fuse.search(query)
        if (results.length === 0) {
          clearResults()
          showMessage('Nenhum resultado encontrado.')
          return
        }
        renderResults(results)
      }

      // ← sempre mostra tudo por padrão
      renderResults(data.map((item) => ({ item })))

      if (liveSearch) {
        // busca live apenas se tiver até SEARCH_THRESHOLD posts
        searchInput.addEventListener('input', doSearch)
      } else {
        // se for on-demand (> SEARCH_THRESHOLD):
        searchInput.addEventListener('input', () => {
          if (!searchInput.value.trim()) {
            clearMessage()
            renderResults(data.map((item) => ({ item })))
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
