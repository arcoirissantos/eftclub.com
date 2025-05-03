const fs = require('fs')
const { DateTime } = require('luxon')
const nunjucks = require('nunjucks')
const slugify = require('slugify')

module.exports = function (eleventyConfig) {
  eleventyConfig.addWatchTarget('src/scss')
  // Only let Eleventy handle static files that Parcel does NOT build
  eleventyConfig.addPassthroughCopy({ 'src/images': 'images' })

  // Remove passthrough of CSS and JS — Parcel handles those now
  // eleventyConfig.addPassthroughCopy('src/css'); ← remove
  // eleventyConfig.addPassthroughCopy('src/js');  ← remove

  // Filters
  eleventyConfig.addFilter('readableDate', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat('dd/MM/yyyy')
  })

  eleventyConfig.addFilter('dateISO', (dateObj) => {
    return DateTime.fromJSDate(dateObj).toISO()
  })

  eleventyConfig.addFilter('dateISO', (value) => {
    let jsDate
    if (value instanceof Date) {
      jsDate = value
    } else {
      jsDate = new Date(value)
    }
    return DateTime.fromJSDate(jsDate).toISO()
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

  // slugify any string to a URL‐safe lowercase slug
  eleventyConfig.addFilter('slug', (value) => {
    return slugify(value, { lower: true, remove: /[*+~.()'"!:@]/g })
  })

  // Collection for blog posts
  eleventyConfig.addCollection('posts', (collectionApi) => {
    return collectionApi.getFilteredByTag('post').map((post) => {
      let stats = fs.statSync(post.inputPath)
      post.data.lastUpdated = stats.mtime
      return post
    })
  })

  // 1) Add a 'jsonify' filter that returns a safe JSON string
  eleventyConfig.addFilter('jsonify', function (value) {
    // JSON.stringify everything (arrays, objects, strings, numbers…)
    const json = JSON.stringify(value)
    // Mark it safe so Nunjucks doesn’t escape the quotes
    return nunjucks.runtime.markSafe(json)
  })

  //handling tags in index posts
  eleventyConfig.addCollection('tagList', (collectionApi) => {
    let tagSet = new Set()
    collectionApi.getFilteredByTag('post').forEach((item) => {
      let tags = item.data.tags || []
      if (!Array.isArray(tags)) tags = [tags]
      tags.forEach((tag) => {
        if (tag && tag !== 'post') {
          tagSet.add(tag)
        }
      })
    })
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  })

  // Filter an array of posts by a tag name
  eleventyConfig.addFilter('filterByTag', (posts, tag) => {
    if (!tag) return posts
    return posts.filter((item) => {
      let tags = item.data.tags || []
      if (!Array.isArray(tags)) tags = [tags]
      return tags.includes(tag)
    })
  })

  // Build a tagPages collection where each item is { tag, posts }
  eleventyConfig.addCollection('tagPages', (collectionApi) => {
    // 1) Gather all unique tags (excluding "post")
    let tags = new Set()
    collectionApi.getFilteredByTag('post').forEach((item) => {
      let t = item.data.tags || []
      if (!Array.isArray(t)) t = [t]
      t.forEach((tag) => {
        if (tag && tag !== 'post') tags.add(tag)
      })
    })

    // 2) Turn that into an array of objects { tag, posts }
    return [...tags].map((tagName) => {
      return {
        tag: tagName,
        posts: collectionApi.getFilteredByTag(tagName)
      }
    })
  })

  eleventyConfig.addGlobalData('eleventyComputed', {
    title: (data) => {
      if (data.tagPage && data.tagPage.tag) {
        return `Tópico: ${data.tagPage.tag}`
      }
      // fall back to any front-matter title
      return data.title
    }
  })

  eleventyConfig.addFilter(
    'suggestions',
    (allPosts, pageTags = [], currentUrl = '', maxCount = 3) => {
      // 1) Normalize & drop “post” from current page’s tags
      const relevantPageTags = (Array.isArray(pageTags) ? pageTags : [pageTags])
        .map((t) => (t || '').toString().trim().toLowerCase())
        .filter((t) => t && t !== 'post')

      console.log('→ suggestions(): currentUrl =', currentUrl)
      console.log('→ suggestions(): relevantPageTags =', relevantPageTags)

      // 2) Exclude the current post
      const others = allPosts.filter((p) => p.url !== currentUrl)

      const related = []
      const unrelated = []

      others.forEach((p) => {
        // pull & normalize this post’s tags
        let tags = p.data.tags || []
        if (!Array.isArray(tags)) tags = [tags]
        const filteredTags = tags
          .map((t) => (t || '').toString().trim().toLowerCase())
          .filter((t) => t && t !== 'post')

        console.log(`   checking ${p.url} tags =`, filteredTags)

        const isRelated = relevantPageTags.some((tag) =>
          filteredTags.includes(tag)
        )

        if (isRelated) related.push(p)
        else unrelated.push(p)
      })

      console.log(
        '→ suggestions(): related urls =',
        related.map((p) => p.url)
      )

      // 4) Merge & cap
      return related.concat(unrelated).slice(0, maxCount)
    }
  )

  return {
    dir: {
      input: 'src',
      includes: '_includes',
      output: 'public',
      data: '_data'
    }
  }
}
