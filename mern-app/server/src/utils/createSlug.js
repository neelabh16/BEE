const createSlug = (text, suffix = '') => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + (suffix ? '-' + suffix : '');
};

module.exports = createSlug;
