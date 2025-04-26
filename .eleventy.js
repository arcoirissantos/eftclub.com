// .eleventy.js
const fs = require("fs");
const { DateTime } = require("luxon");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/js");

  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return DateTime.fromJSDate(dateObj).toFormat("dd/MM/yyyy");
  });

  eleventyConfig.addFilter("dateISO", (dateObj) => {
    // outputs e.g. “2025-04-25T14:32:00.000Z” for HTML/machine requirement
    return DateTime.fromJSDate(dateObj).toISO();
  });

  // ——— inject lastUpdated into each post ———
  eleventyConfig.addCollection("posts", (collectionApi) => {
    return collectionApi.getFilteredByGlob("src/blog/*.md").map((post) => {
      let stats = fs.statSync(post.inputPath);
      post.data.lastUpdated = stats.mtime;
      return post;
    });
  });

  return {
    dir: {
      input: "src",
      includes: "_includes",
      output: "public",
    },
  };
};
