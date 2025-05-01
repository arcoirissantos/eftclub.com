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
  const tagLinks = document.querySelectorAll('.tag-link')
  if (!searchInput || !resultsList || !messageEl) return

  let posts = [] // raw list from search.json
  let fuse
  let selectedTag = '' // '' means “no tag selected”

  function normalize(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
  }

  function renderResults(wrappedResults) {
    resultsList.innerHTML = wrappedResults
      .map((r) => {
        const post = r.item
        return `
          <li class="snippet">
            <h3 class="snippet_title">${post.title}</h3>
            <a href="${post.url}">Acessar</a>
          </li>`
      })
      .join('')
  }

  function showMessage(txt) {
    messageEl.textContent = txt
  }
  function clearMessage() {
    messageEl.textContent = ''
  }

  // Hide/show the tag links based on which tags appear in filteredResults
  function updateTagList(filteredResults) {
    const tagSet = new Set()
    filteredResults.forEach((r) => {
      const t = r.item.tags
      if (Array.isArray(t)) t.forEach((tag) => tagSet.add(tag))
    })

    tagLinks.forEach((link) => {
      const tag = link.dataset.tag
      const isActive = tag === selectedTag
      const shouldShow = isActive || tagSet.has(tag)
      link.style.display = shouldShow ? '' : 'none'
    })
  }

  function filterByTag(wrappedResults) {
    if (!selectedTag) return wrappedResults
    return wrappedResults.filter(
      (r) => Array.isArray(r.item.tags) && r.item.tags.includes(selectedTag)
    )
  }

  function doSearch() {
    clearMessage()
    const rawQuery = searchInput.value.trim()
    const q = normalize(rawQuery)

    let wrapped

    if (!q) {
      // no text filter → all posts
      wrapped = posts.map((post) => ({ item: post }))
    } else if (q.length < 3) {
      // too-short query: clear results & tags
      updateTagList([])
      resultsList.innerHTML = ''
      return showMessage('Por favor, digite no mínimo 3 caracteres.')
    } else {
      const res = fuse.search(q)
      if (!res.length) {
        // no matches: clear results & tags
        updateTagList([])
        resultsList.innerHTML = ''
        return showMessage('Nenhum resultado encontrado.')
      }
      wrapped = res
    }

    // apply tag filter
    wrapped = filterByTag(wrapped)
    if (!wrapped.length) {
      // no posts in selected category: clear tags too
      updateTagList([])
      resultsList.innerHTML = ''
      return showMessage('Nenhum post nesta categoria.')
    }

    // update which tags are visible
    updateTagList(wrapped)

    // render the filtered posts
    renderResults(wrapped)
  }

  // Tag click handling: toggle active class & state
  tagLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault()
      const tag = link.dataset.tag

      if (selectedTag === tag) {
        selectedTag = '' // clear filter
      } else {
        selectedTag = tag
      }

      tagLinks.forEach((a) =>
        a.classList.toggle('active', a.dataset.tag === selectedTag)
      )

      clearMessage()
      doSearch()
    })
  })

  // Fetch + initialize Fuse
  fetch('/search.json')
    .then((r) => r.json())
    .then((json) => {
      posts = json
      fuse = new Fuse(posts, {
        keys: ['title', 'description'],
        threshold: 0.3,
        ignoreLocation: true,
        includeScore: false
      })

      // Initial render (all posts + all tags visible)
      renderResults(posts.map((post) => ({ item: post })))

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
