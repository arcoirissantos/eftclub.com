const fs = require('fs')
const path = require('path')

module.exports = function () {
  const dir = path.join(__dirname, '../images/Depoimentos')

  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((f) => /\.(webp|jpg|jpeg|png|gif)$/i.test(f))
    .sort()
    .map((filename, index) => ({
      src: `/images/Depoimentos/${filename}`,
      alt: `Depoimento ${index + 1}`,
      loading: index === 0 ? 'eager' : 'lazy',
    }))
}
