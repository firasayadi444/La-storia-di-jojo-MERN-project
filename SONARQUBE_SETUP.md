# SonarQube Setup for OrderApp

## Overview
This document explains how to set up and configure SonarQube for the OrderApp project.

## Prerequisites

### 1. Install SonarQube Server
```bash
# Using Docker (recommended)
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest

# Or download from https://www.sonarqube.org/downloads/
```

### 2. Install SonarQube Scanner
```bash
# Download from https://docs.sonarqube.org/latest/analysis/scan/sonarscanner/
# Or install via package manager
```

### 3. Jenkins Configuration

#### Install SonarQube Plugin
1. Go to Jenkins > Manage Jenkins > Plugins
2. Install "SonarQube Scanner" plugin
3. Restart Jenkins

#### Configure SonarQube Server
1. Go to Jenkins > Manage Jenkins > Configure System
2. Find "SonarQube servers" section
3. Add SonarQube server:
   - Name: `SonarQube`
   - Server URL: `http://localhost:9000`
   - Server authentication token: Create in SonarQube

#### Add SonarQube Token Credential
1. Go to Jenkins > Manage Jenkins > Credentials
2. Add new credential:
   - Kind: `Secret text`
   - ID: `sonar-token`
   - Secret: Your SonarQube token

## Configuration Files

### Backend (`backend/sonar-project.properties`)
- Analyzes JavaScript/Node.js code
- Includes controllers, models, routes, middlewares, utils
- Excludes tests, node_modules, coverage reports
- Configures code coverage reporting

### Frontend (`frontend/sonar-project.properties`)
- Analyzes TypeScript/React code
- Includes src directory
- Excludes tests, node_modules, build artifacts
- Configures TypeScript-specific settings

## Jenkins Pipeline Integration

The Jenkinsfile includes a "SonarQube Analysis" stage that:
1. Runs after tests to ensure coverage data is available
2. Analyzes both backend and frontend code
3. Uses the `withSonarQubeEnv` wrapper for proper integration
4. Waits for quality gate results

## Quality Gates

Default quality gates include:
- **Code Coverage**: Minimum 80%
- **Duplicated Lines**: Maximum 3%
- **Maintainability Rating**: A or B
- **Reliability Rating**: A or B
- **Security Rating**: A or B
- **Security Hotspots**: A or B

## Running Analysis Manually

### Backend
```bash
cd backend
sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.login=YOUR_TOKEN
```

### Frontend
```bash
cd frontend
sonar-scanner -Dsonar.host.url=http://localhost:9000 -Dsonar.login=YOUR_TOKEN
```

## Viewing Results

1. Open SonarQube dashboard: http://localhost:9000
2. Navigate to your projects:
   - `orderapp-backend`
   - `orderapp-frontend`
3. View detailed reports, metrics, and recommendations

## Benefits

- **Code Quality**: Identifies bugs, code smells, and technical debt
- **Security**: Detects vulnerabilities and security hotspots
- **Maintainability**: Measures code complexity and maintainability
- **Coverage**: Tracks test coverage and quality
- **Standards**: Enforces coding standards and best practices

## Troubleshooting

### Common Issues
1. **Scanner not found**: Install sonar-scanner globally or use Jenkins plugin
2. **Authentication failed**: Check token and server URL
3. **Coverage not found**: Ensure tests run before analysis
4. **Quality gate failed**: Review and fix code quality issues

### Logs
- Check Jenkins console output for detailed logs
- SonarQube server logs: `docker logs sonarqube`
- Scanner logs: Check Jenkins build console 