//----- handle btn effect on touch devices -----//'

document.querySelectorAll('.btn').forEach((btn) => {
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'))
  btn.addEventListener('touchend', () => btn.classList.remove('pressed'))
  btn.addEventListener('touchcancel', () => btn.classList.remove('pressed'))
})

//----- handle depoimento popup -----//

const popup = document.querySelector('.depoimentos_popup')
const openBtns = document.querySelectorAll('.open-button')
const closeBtn = document.querySelector('.close-button')

// Open: show dialog, lock scroll, trigger open animation
function openDialog() {
  popup.showModal()
  document.body.classList.add('no-scroll')

  // ensure no leftover close class
  popup.classList.remove('animate-close')
  // force reflow so the open animation always runs
  void popup.offsetWidth
  popup.classList.add('animate-open')
}

// Close: trigger close animation, then after it ends actually close
function closeDialog() {
  // remove any open-animation class
  popup.classList.remove('animate-open')
  // force reflow so close animation runs
  void popup.offsetWidth
  popup.classList.add('animate-close')

  // when the close animation is done, actually close the dialog
  function onAnimationEnd(e) {
    if (e.animationName === 'fadeScaleOut') {
      popup.close()
      document.body.classList.remove('no-scroll')
      popup.classList.remove('animate-close')
      popup.removeEventListener('animationend', onAnimationEnd)
    }
  }
  popup.addEventListener('animationend', onAnimationEnd)
}

// also handle ESC / backdrop click (the built‑in “cancel” event)
popup.addEventListener('cancel', (e) => {
  e.preventDefault()
  closeDialog()
})

// bind every open‑button trigger
openBtns.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault() // if it's an <a>, prevent default jump
    openDialog()
  })
})

// single close trigger
closeBtn.addEventListener('click', closeDialog)
