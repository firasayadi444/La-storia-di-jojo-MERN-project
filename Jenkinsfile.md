# Jenkins CI Pipeline for OrderApp

This document describes a Jenkins pipeline configuration for running Continuous Integration (CI) tests on the OrderApp project. The pipeline will install dependencies and run tests for both the backend and frontend applications.

## Pipeline Overview

- **Backend:** Installs dependencies and runs tests using npm scripts.
- **Frontend:** Installs dependencies and runs tests using npm scripts.
- **Fail Fast:** The build fails if any test fails.

## Example Jenkinsfile

```groovy
pipeline {
    agent any
    stages {
        stage('Backend Install & Test') {
            steps {
                dir('backend') {
                    sh 'npm ci'
                    sh 'npm run test:ci'
                }
            }
        }
        stage('Frontend Install & Test') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run test:ci'
                }
            }
        }
    }
}
```

## Stage Explanations

### 1. Backend Install & Test
- **Directory:** `backend/`
- **Commands:**
  - `npm ci` — Installs dependencies cleanly based on package-lock.json.
  - `npm run test:ci` — Runs backend tests in CI mode (see your package.json for details).

### 2. Frontend Install & Test
- **Directory:** `frontend/`
- **Commands:**
  - `npm ci` — Installs dependencies cleanly based on package-lock.json.
  - `npm run test:ci` — Runs frontend tests in CI mode (see your package.json for details).

## Notes
- Make sure your Jenkins agent has Node.js and npm installed.
- The pipeline will fail if any test fails in either the backend or frontend.
- You can extend this pipeline with linting, build, or deployment stages as needed.

---

For more advanced pipelines (Docker, deployment, etc.), see your `CI_CD_DOCUMENTATION.md` or ask for a custom Jenkinsfile example. 