# Prism-Reporting org and repo setup

Use this when creating or updating the GitHub org and repos. Do not change the org name (**Prism-Reporting**).

**Note:** The repos **reporting** and **reporting-workfront-example** have been created under Prism-Reporting. Project folders were renamed: **reporting-2** → **reporting**, **reporting-wf-integration** → **reporting-workfront-example** (the previous **reporting** folder was renamed to **reporting-legacy**). The default remote for the main repo is **prism** (Prism-Reporting/reporting).

## 1. Create repos (GitHub web) — optional if already created

Under **Prism-Reporting** → **Repositories** → **New**:

### Repo: `reporting` (main OSS)

- **Name:** `reporting`
- **Visibility:** Public
- **Description (copy-paste):**  
  `React report renderer and spec: render UIs from a declarative spec and DLS. Use standalone with hardcoded data or plug in your own data/AI.`
- **Topics:** `reporting`, `react`, `report-renderer`, `declarative-ui`, `storybook`
- Do **not** add a README, .gitignore, or license if you are pushing the existing reporting-2 repo.

### Repo: `reporting-workfront-example`

- **Name:** `reporting-workfront-example`
- **Visibility:** Public
- **Description (copy-paste):**  
  `Example: Adobe Workfront integration for Prism Reporting. Uses the report renderer with Workfront API as the data source. Not required for the core renderer.`
- **Topics:** `workfront`, `adobe`, `example`, `reporting`
- Do **not** add a README, .gitignore, or license if you are pushing the existing reporting-wf-integration repo.

## 2. Org profile (optional)

**Prism-Reporting** → **Settings** or profile:

- **Description:** `Open source reporting and declarative report UIs.`
- **URL:** e.g. `https://github.com/Prism-Reporting/reporting` or your landing page.
- **Name:** Leave as **Prism-Reporting**.

## 3. Push (run locally; requires GitHub auth)

**Main repo (reporting)** — default remote is **prism**:

```bash
cd /home/sargis/Projects/reporting
git push -u prism main
```

**Workfront example (reporting-workfront-example):**

```bash
cd /home/sargis/Projects/reporting-workfront-example
git push -u origin main
```

Reopen your workspace from the new paths if needed: `reporting` and `reporting-workfront-example`.
