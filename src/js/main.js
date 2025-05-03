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
