const fs = require('fs')
const { DateTime } = require('luxon')
const nunjucks = require('nunjucks')
const slugify = require('slugify')
const pluginRss = require('@11ty/eleventy-plugin-rss')
const pluginSitemap = require('@quasibit/eleventy-plugin-sitemap')

module.exports = function (eleventyConfig) {
  // RSS feeds
  eleventyConfig.addPlugin(pluginRss)

  // Only generate a sitemap in production builds
  if (process.env.ELEVENTY_ENV === 'production') {
    eleventyConfig.addPlugin(pluginSitemap, {
      sitemap: {
        hostname: 'https://eftclub.com'
      }
    })
  }

  // Watch and passthrough
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
  eleventyConfig.addFilter(
    'updatedAfterSixMonths',
    (publishedDate, updatedDate) => {
      if (!publishedDate || !updatedDate) return false
      const SIX_MONTHS_MS = 1000 * 60 * 60 * 24 * 30 * 6
      return updatedDate - publishedDate > SIX_MONTHS_MS
    }
  )
  eleventyConfig.addFilter('slice', (array, start, end) =>
    Array.isArray(array) ? array.slice(start, end) : []
  )
  eleventyConfig.addFilter('slug', (value) =>
    slugify(value, { lower: true, remove: /[*+~.()'"!:@]/g })
  )
  eleventyConfig.addFilter('jsonify', (value) =>
    nunjucks.runtime.markSafe(JSON.stringify(value))
  )

  // Collections
  eleventyConfig.addCollection('posts', (collectionApi) =>
    collectionApi.getFilteredByTag('post').map((post) => {
      let stats = fs.statSync(post.inputPath)
      post.data.lastUpdated = stats.mtime
      return post
    })
  )
  eleventyConfig.addCollection('tagList', (collectionApi) => {
    let tagSet = new Set()
    collectionApi.getFilteredByTag('post').forEach((item) => {
      let tags = Array.isArray(item.data.tags)
        ? item.data.tags
        : [item.data.tags || []]
      tags.forEach((tag) => {
        if (tag && tag !== 'post') tagSet.add(tag)
      })
    })
    return [...tagSet].sort((a, b) => a.localeCompare(b))
  })
  eleventyConfig.addFilter('filterByTag', (posts, tag) =>
    tag
      ? posts.filter((item) => {
          let tags = Array.isArray(item.data.tags)
            ? item.data.tags
            : [item.data.tags || []]
          return tags.includes(tag)
        })
      : posts
  )
  eleventyConfig.addCollection('tagPages', (collectionApi) => {
    let tags = new Set()
    collectionApi.getFilteredByTag('post').forEach((item) => {
      let t = Array.isArray(item.data.tags)
        ? item.data.tags
        : [item.data.tags || []]
      t.forEach((tag) => {
        if (tag && tag !== 'post') tags.add(tag)
      })
    })
    return [...tags].map((tagName) => ({
      tag: tagName,
      posts: collectionApi.getFilteredByTag(tagName)
    }))
  })

  // Computed global data
  eleventyConfig.addGlobalData('eleventyComputed', {
    title: (data) =>
      data.tagPage && data.tagPage.tag
        ? `Tópico: ${data.tagPage.tag}`
        : data.title
  })

  // Suggestions helper
  eleventyConfig.addFilter(
    'suggestions',
    (allPosts, pageTags = [], currentUrl = '', maxCount = 3) => {
      const relevantPageTags = (Array.isArray(pageTags) ? pageTags : [pageTags])
        .map((t) => (t || '').toString().trim().toLowerCase())
        .filter((t) => t && t !== 'post')

      const others = allPosts.filter((p) => p.url !== currentUrl)
      const related = [],
        unrelated = []

      others.forEach((p) => {
        let tags = Array.isArray(p.data.tags)
          ? p.data.tags
          : [p.data.tags || []]
        let filteredTags = tags
          .map((t) => (t || '').toString().trim().toLowerCase())
          .filter((t) => t && t !== 'post')
        ;(relevantPageTags.some((tag) => filteredTags.includes(tag))
          ? related
          : unrelated
        ).push(p)
      })

      return related.concat(unrelated).slice(0, maxCount)
    }
  )

  // Directory settings
  return {
    dir: {
      input: 'src',
      includes: '_includes',
      data: '_data',
      output: 'public'
    }
  }
}
