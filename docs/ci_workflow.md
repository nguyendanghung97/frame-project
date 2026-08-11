# CI Workflow Documentation

This document explains the Continuous Integration (CI) setup for the `frame-project` monorepo. The CI pipelines are configured using GitHub Actions and can be found in the `.github/workflows/` directory.

## Architecture Overview

The repository follows a pseudo-monorepo structure with shared local packages:
- `frame-common/`: Shared components, utilities, and layouts.
- `project/`: Main application project.
- `project-b/`: A secondary application project.

To optimize CI execution time and resources, each application project has its own dedicated GitHub Actions workflow file:
- `.github/workflows/project-ci.yml`
- `.github/workflows/project-b-ci.yml`

## Path Filtering (Trigger Isolation)

Instead of running all tests and builds whenever *any* file in the repository changes, we use GitHub Actions **path filtering** (`paths:`). This ensures that a project's CI is only triggered when relevant files change.

### `project-ci.yml` Triggers:
```yaml
on:
  push:
    branches: [ main ]
    paths:
      - "project/**"
      - "frame-common/**"
      - ".github/workflows/project-ci.yml"
```
* **Effect:** If you make a change in `project/`, only `project-ci.yml` will run. `project-b`'s CI will be ignored.

### `project-b-ci.yml` Triggers:
```yaml
on:
  push:
    branches: [ main ]
    paths:
      - "project-b/**"
      - "frame-common/**"
      - ".github/workflows/project-b-ci.yml"
```
* **Effect:** If you make a change in `project-b/`, only `project-b-ci.yml` will run. 
* **Shared Dependency Effect:** If you make a change in `frame-common/`, **both** CI workflows will run concurrently to ensure the shared change hasn't broken either project.

## CI Job Steps & Dependency Resolution

Both CI workflows follow a similar sequence of steps within a `node-version: 20` environment.

Because `project` and `project-b` both depend on `frame-common` via a local relative file path (`"frame-common": "file:../frame-common"`), we must install the dependencies of `frame-common` explicitly *before* building the main project. If we don't, tools like TypeScript (`tsc -b`) will fail to find type definitions (e.g., `lucide-react`, `react`) required by `frame-common`.

Here is the standard execution flow:

1. **Checkout Code:** Uses `actions/checkout@v4`.
2. **Setup Node:** Uses `actions/setup-node@v4` with caching enabled for `npm` based on the project's `package-lock.json`.
3. **Install `frame-common` Dependencies:** 
   ```yaml
   - name: Install frame-common dependencies
     run: npm install
     working-directory: ./frame-common
   ```
   *(Crucial step: Ensures that the local shared package has all its necessary modules installed before the main project tries to compile it).*
4. **Install Project Dependencies:**
   ```yaml
   - name: Install dependencies
     run: npm ci
     # working-directory: ./project (or ./project-b)
   ```
5. **Linting:** Runs `npm run lint` to catch ESLint errors (e.g., `react-refresh` export issues).
6. **Type Checking:** Runs `npx tsc -b` to verify TypeScript types without emitting files.
7. **Build:** Runs `npm run build` (Vite build) to ensure the project bundles successfully for production.

## Troubleshooting

- **TypeScript Build Error (`Cannot find module...`):** If the CI fails during the `npx tsc -b` step with errors inside `frame-common`, ensure that step #3 (`Install frame-common dependencies`) is present and executing correctly in the workflow file.
- **CI Not Triggering:** Check if the files you pushed fall under the `paths:` filter defined in the `.yml` file. If they don't, GitHub Actions will skip the workflow.
