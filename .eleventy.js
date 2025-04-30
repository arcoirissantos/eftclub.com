const fs = require('fs')
const { DateTime } = require('luxon')

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget('src/scss')
  // ✅ Only let Eleventy handle static files that Parcel does NOT build
  eleventyConfig.addPassthroughCopy({ 'src/images': 'images' })

  // ✅ Remove passthrough of CSS and JS — Parcel handles those now
  // eleventyConfig.addPassthroughCopy('src/css'); ← remove
  // eleventyConfig.addPassthroughCopy('src/js');  ← remove

  // Filters
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('dd/MM/yyyy')
  })

  eleventyConfig.addFilter('dateISO', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toISO()
  })

  eleventyConfig.addFilter('excludeCurrentPost', function (posts, currentUrl) {
    function normalize(url) {
      return url.replace(/\/$/, '')
    }

    return posts.filter((post) => {
      return normalize(post.url) !== normalize(currentUrl)
    })
  })

  eleventyConfig.addFilter(
    'updatedAfterSixMonths',
    (publishedDate, updatedDate) => {
      if (!publishedDate || !updatedDate) return false

      const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6
      const diff = updatedDate - publishedDate

      return diff > SIX_MONTHS_MS
    }
  )

  eleventyConfig.addFilter('slice', function (array, start, end) {
    if (!Array.isArray(array)) return []
    return array.slice(start, end)
  })

  // Collection for blog posts
  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi.getFilteredByTag('post').map((post) => {
      let stats = fs.statSync(post.inputPath)
      post.data.lastUpdated = stats.mtime
      return post
    })
  })

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      output: 'public',
      data: '_data'
    }
  }
}
