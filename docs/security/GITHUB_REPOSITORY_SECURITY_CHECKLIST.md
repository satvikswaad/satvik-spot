# GitHub Repository Security & Settings Checklist

**System**: Satwik Sweets and Pickels (`satvik-spot`)  
**Date**: July 22, 2026  
**Target Repository**: `satvikswaad/satvik-spot` (Private)  

---

## 1. Executive Configuration Checklist

| Security Setting | Target State | Operational Requirement | Status | Owner Action Required |
| :--- | :--- | :--- | :--- | :--- |
| **Repository Visibility** | Private | Confirmed private repository. | **VERIFIED** | Maintain private setting. |
| **Secret Scanning** | Enabled | Automatically block commits containing credentials. | **PENDING OWNER**| Settings -> Code security and analysis -> Secret scanning -> Enable. |
| **Push Protection** | Enabled | Block pushes containing detected secrets before commit. | **PENDING OWNER**| Settings -> Code security and analysis -> Push protection -> Enable. |
| **Dependabot Alerts** | Enabled | Receive alerts for vulnerable npm dependencies. | **PENDING OWNER**| Settings -> Code security and analysis -> Dependabot alerts -> Enable. |
| **Dependabot Security Updates**| Enabled | Automated PRs for security patches. | **PENDING OWNER**| Settings -> Code security and analysis -> Dependabot security updates -> Enable. |
| **Branch Protection: `main`** | Enforced | Require PR reviews, passing CI, no force push. | **PENDING OWNER**| Settings -> Branches -> Add rule for `main`. |
| **Branch Protection: `staging`**| Enforced | Require passing CI (`security-and-quality-checks`).| **PENDING OWNER**| Settings -> Branches -> Add rule for `staging`. |
| **Required Status Checks** | Enforced | Block merge unless `security-and-quality-checks` passes. | **PENDING OWNER**| Enable "Require status checks to pass before merging". |
| **No Force Pushes** | Enforced | Prevent history rewriting on `main` and `staging`. | **PENDING OWNER**| Select "Block force pushes" in branch rules. |
| **No Branch Deletion** | Enforced | Protect core branches against deletion. | **PENDING OWNER**| Select "Prevent branch deletion" in branch rules. |
| **Workflow Permissions** | Restricted | Workflows run with Read-only `GITHUB_TOKEN`. | **PENDING OWNER**| Settings -> Actions -> General -> Workflow permissions -> Read repository contents. |
| **Environment Protection** | Enforced | Require reviewer approval for production deployments. | **PENDING OWNER**| Settings -> Environments -> Create `production` environment with reviewers. |
| **Manual Render Deployments** | Enforced | Auto-deploy disabled during security hardening. | **VERIFIED** | Render Dashboard -> Auto-Deploy: Disabled. |

---

## 2. Recommended `CODEOWNERS` Configuration

Create `.github/CODEOWNERS` with:
```text
# Default owners for entire repository
*       @satvikswaad

# Security rules & infrastructure
firestore.rules                       @satvikswaad
render.yaml                           @satvikswaad
.github/workflows/                    @satvikswaad
backend/src/config/environment.ts     @satvikswaad
```

---

## 3. Step-by-Step Owner Action Order

1. Go to **Settings -> Code security and analysis**:
   - Turn ON **Secret scanning**
   - Turn ON **Push protection**
   - Turn ON **Dependabot alerts** and **Dependabot security updates**
2. Go to **Settings -> Branches**:
   - Add Branch protection rule for `main`:
     - Require pull request before merging (1 approval)
     - Require status checks to pass (`security-and-quality-checks`)
     - Do not allow bypassing the above settings
     - Restrict pushes that create or delete matching branches
   - Add Branch protection rule for `staging`:
     - Require status checks to pass (`security-and-quality-checks`)
3. Go to **Settings -> Actions -> General**:
   - Set Workflow permissions to **Read repository contents and packages permissions**
