function playVideo(overlay) {
  const videoContainer = overlay.parentElement
  const iframe = videoContainer.querySelector('iframe')

  if (!iframe) return

  let src = iframe.getAttribute('src')

  if (!src.includes('autoplay=1')) {
    if (src.includes('?')) {
      src += '&autoplay=1' // no mute
    } else {
      src += '?autoplay=1' // no mute
    }
    iframe.setAttribute('src', src)
  }

  overlay.style.opacity = '0'
  overlay.style.pointerEvents = 'none'
}
