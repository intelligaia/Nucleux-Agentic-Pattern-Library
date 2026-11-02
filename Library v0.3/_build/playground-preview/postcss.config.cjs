/* TW_CONFIG picks another Tailwind config for one entry (see package.json build:how) */
module.exports = { plugins: { tailwindcss: { config: process.env.TW_CONFIG || "./tailwind.config.cjs" }, autoprefixer: {} } };
