/**
 * Tailwind CSS configuration for the Jet Stream Clean quote app.  The
 * `content` array specifies the files Tailwind should scan for class
 * names.  When you build the project using `npm run build`, Tailwind
 * purges unused styles based on these paths.  Feel free to tweak this
 * configuration if you add additional directories or file types to
 * your project.
 */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
