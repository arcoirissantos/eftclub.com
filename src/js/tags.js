document.addEventListener('DOMContentLoaded', () => {
  const showMoreBtn = document.getElementById('show-more-tags')
  if (!showMoreBtn) return

  const tagItems = Array.from(document.querySelectorAll('#tag-list .tag-item'))
  let visibleCount = 10
  const increment = 10

  showMoreBtn.addEventListener('click', () => {
    const nextVisible = tagItems.slice(visibleCount, visibleCount + increment)
    nextVisible.forEach((item) => (item.style.display = ''))

    visibleCount += increment
    if (visibleCount >= tagItems.length) {
      showMoreBtn.style.display = 'none'
    }
  })
})

// Transition

// /js/swup-init.js
import Swup from 'swup'

const swup = new Swup({
  // only elements matching your selector will animate
  animationSelector: '.transition-fade, .transition-slide-up'
})
