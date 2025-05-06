const fs = require('fs')
const { DateTime } = require('luxon')
const nunjucks = require('nunjucks')
const slugify = require('slugify')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginSitemap = require('@quasibit/eleventy-plugin-sitemap')

module.exports = function (eleventyConfig) {
  // RSS feeds
  eleventyConfig.addPlugin(pluginRss)

  // Sitemap (only in production builds)
  eleventyConfig.addPlugin(pluginSitemap, {
    sitemap: {
      hostname: 'https://eftclub.com'
    }
  })

  // Watch & static passthroughs
  eleventyConfig.addWatchTarget('src/scss')
  eleventyConfig.addPassthroughCopy({ 'src/images': 'images' })
  eleventyConfig.addPassthroughCopy({ 'src/_redirects': '_redirects' })

  // Filters
  eleventyConfig.addFilter('readableDate', (dateObj) =>
    DateTime.fromJSDate(dateObj).toFormat('dd/MM/yyyy')
  )
  eleventyConfig.addFilter('dateISO', (value) => {
    let jsDate = value instanceof Date ? value : new Date(value)
    return DateTime.fromJSDate(jsDate).toISO()
  })
  eleventyConfig.addFilter('excludeCurrentPost', (posts, currentUrl) => {
    const normalize = (url) => url.replace(/\/$/, '')
    return posts.filter((post) => normalize(post.url) !== normalize(currentUrl))
  })
  eleventyConfig.addFilter('updatedAfterSixMonths', (pub, upd) => {
    if (!pub || !upd) return false
    const SIX_MONTHS = 1000 * 60 * 60 * 24 * 30 * 6
    return upd - pub > SIX_MONTHS
  })
  eleventyConfig.addFilter('slice', (arr, start, end) =>
    Array.isArray(arr) ? arr.slice(start, end) : []
  )
  eleventyConfig.addFilter('slug', (s) =>
    slugify(s, { lower: true, remove: /[*+~.()'"!:@]/g })
  )
  eleventyConfig.addFilter('jsonify', (v) =>
    nunjucks.runtime.markSafe(JSON.stringify(v))
  )

  // Collections
  eleventyConfig.addCollection('posts', (col) =>
    col.getFilteredByTag('post').map((post) => {
      let stats = fs.statSync(post.inputPath)
      post.data.lastUpdated = stats.mtime
      return post
    })
  )
  eleventyConfig.addCollection('tagList', (col) => {
    let tags = new Set()
    col.getFilteredByTag('post').forEach((item) => {
      let t = item.data.tags || []
      if (!Array.isArray(t)) t = [t]
      t.forEach((tag) => tag && tag !== 'post' && tags.add(tag))
    })
    return [...tags].sort((a, b) => a.localeCompare(b))
  })
  eleventyConfig.addFilter('filterByTag', (posts, tag) =>
    !tag
      ? posts
      : posts.filter((p) =>
          (Array.isArray(p.data.tags)
            ? p.data.tags
            : [p.data.tags || []]
          ).includes(tag)
        )
  )
  eleventyConfig.addCollection('tagPages', (col) => {
    let tags = new Set()
    col.getFilteredByTag('post').forEach((item) => {
      let t = item.data.tags || []
      if (!Array.isArray(t)) t = [t]
      t.forEach((tag) => tag && tag !== 'post' && tags.add(tag))
    })
    return [...tags].map((tagName) => ({
      tag: tagName,
      posts: col.getFilteredByTag(tagName)
    }))
  })

  // Computed globals
  eleventyConfig.addGlobalData('eleventyComputed', {
    title: (data) =>
      data.tagPage && data.tagPage.tag
        ? `Tópico: ${data.tagPage.tag}`
        : data.title
  })

  // 4) sitemapUrls (homepage + blog index + posts + tags)
  eleventyConfig.addCollection('sitemapUrls', (col) => {
    // core
    let core = [{ url: '/' }, { url: '/blog/' }]
    // posts
    let posts = col.getFilteredByTag('post').map((p) => ({ url: p.url }))
    // tags
    let tagUrls = [
      ...new Set(
        col
          .getFilteredByTag('post')
          .flatMap((i) =>
            Array.isArray(i.data.tags) ? i.data.tags : [i.data.tags || []]
          )
          .filter((t) => t && t !== 'post')
      )
    ]
      .sort((a, b) => a.localeCompare(b))
      .map((tag) => ({
        url: `/blog/tags/${slugify(tag, { lower: true, remove: /[*+~.()'"!:@]/g })}/`
      }))

    return core.concat(posts, tagUrls)
  })

  // Suggestions helper
  eleventyConfig.addFilter(
    'suggestions',
    (allPosts, pageTags = [], currentUrl = '', maxCount = 3) => {
      const relevant = (Array.isArray(pageTags) ? pageTags : [pageTags])
        .map((t) => (t || '').toString().trim().toLowerCase())
        .filter((t) => t && t !== 'post')

      const others = allPosts.filter((p) => p.url !== currentUrl)
      const related = [],
        unrelated = []

      others.forEach((p) => {
        let tags = Array.isArray(p.data.tags)
          ? p.data.tags
          : [p.data.tags || []]
        const filtered = tags
          .map((t) => (t || '').toString().trim().toLowerCase())
          .filter((t) => t && t !== 'post')
        ;(relevant.some((tag) => filtered.includes(tag))
          ? related
          : unrelated
        ).push(p)
      })

      return related.concat(unrelated).slice(0, maxCount)
    }
  )

  // Directory config
  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: 'public'
    }
  }
}
