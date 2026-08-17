# GitHub Pages Deployment Workflows

This document explains the Continuous Deployment (CD) strategy for deploying the `frame-project` monorepo to GitHub Pages. Because GitHub Pages overwrites the entire site on each deployment, special care is required when deploying multiple independent applications (`project` and `project-b`) from a single repository.

We currently maintain two different deployment architectures for demonstration and fallback purposes. Both workflows output to the `gh-pages` branch or GitHub Pages artifact.

## 1. Sequential Deployment (`deploy.yml`)

The **Sequential Deployment** is the standard, straightforward approach.

**How it works:**
1. It sequentially builds all dependencies (`frame-common`).
2. It sequentially builds `project` and `project-b` from scratch.
3. It assembles the compiled `dist/` folders into a single `deploy-site/` directory:
   - `deploy-site/project/`
   - `deploy-site/project-b/`
4. It implements the `spa-github-pages` trick (a root `404.html` and an injected decode script) to ensure React Router client-side routes do not return 404 errors upon page refresh.
5. It uploads the entire `deploy-site/` as a Pages artifact and deploys it.

**Pros:** Simple to understand, guarantees a fresh build of all projects.
**Cons:** Slow. It rebuilds every project even if no files in that project were changed, wasting CI minutes.

## 2. Optimized Deployment with Cache (`deploy-cached.yml`)

The **Optimized Deployment** is the advanced approach designed to save CI time and resources by only building projects that have actually changed.

**How it works:**
1. **Hashing Source Files:** For each project, it generates a unique hash based on its source code and its dependencies (e.g., `hashFiles('project/**', 'frame-common/**')`).
2. **Cache Lookup:** It queries GitHub Actions Cache using this hash.
   - **Cache Hit:** If the code hasn't changed, it instantly downloads the pre-built `dist/` folder from the cache. The costly `npm ci` and `npm run build` steps are skipped.
   - **Cache Miss:** If the code has changed, it installs dependencies, builds the project, and then saves the new `dist/` to the cache at the end of the workflow.
3. **Assemble:** It takes the `dist/` folders (whether freshly built or instantly restored from cache) and assembles them into the `deploy-site/` directory just like the sequential workflow.
4. **Deploy:** Uploads and deploys the artifact.

**Pros:** Extremely fast for partial monorepo updates. Preserves the static files of unchanged projects without rebuilding them.
**Cons:** Slightly more complex YAML configuration; relies on GitHub Actions Cache availability.

## Important Note on Routing (SPA Fallback)
Both workflows implement a crucial fallback mechanism for GitHub Pages:
Since GitHub Pages acts as a static file server, refreshing a client-side route like `/frame-project/project/conference` will result in a 404 because there is no physical `conference.html` file.
To fix this, we generate a root `404.html` that encodes the path into a query string and redirects the user back to the application's `index.html`. A special script injected into `index.html` decodes the query string and restores the URL before React Router initializes, ensuring seamless navigation.
