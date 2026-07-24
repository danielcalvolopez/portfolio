# Dani Calvo — Software Engineer

A personal portfolio that thinks it's a printed type specimen. Serif body (Charis SIL), grotesque headings (Archivo), running heads, a footer line — basically a book that happens to ship as a website.

Built with [Next.js](https://nextjs.org) 16 + React 19, case studies written in MDX, and just enough Zod to keep the frontmatter honest.

## Run it

```bash
npm install
npm run dev      # http://localhost:3000
```

## Other buttons you can press

```bash
npm test         # vitest, one shot
npm run og       # bake the OG images (satori + resvg, no headless browser harmed)
npm run build    # og images → next build → stamp the output
```

## Where things live

| Path                 | What's in it                                            |
| -------------------- | ------------------------------------------------------- |
| `content/work/*.mdx` | The case studies (the actual portfolio part)            |
| `src/app/`           | Pages, tokens, and even an `llms.txt` for the robots    |
| `scripts/`           | OG image baking and build stamping                      |
| `specs/`             | The type-specimen design spec this whole look came from |

That's it. It's a portfolio, not a monorepo. 📖
