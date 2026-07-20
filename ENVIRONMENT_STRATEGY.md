# ENVIRONMENT STRATEGY (PHASE 10A — COMPLETE)

**Project**: Satwik Sweets and Pickels  
**Scope**: Multi-Environment Isolation (Local Emulator / Render Staging / Production)  
**Date**: July 20, 2026  

---

## 1. Environment Isolation Model

| Environment | Firebase Project ID | Backend Target | Purpose / Scope | Access Rules |
| :--- | :--- | :--- | :--- | :--- |
| **Local / Emulator** | `satwiksweetsandpickels` | Local Express (`localhost:8080`) | Local development & unit/e2e testing | Offline emulator suite & local Express server only. |
| **Staging** | `satvik-spot-staging` | Render Web Service (`satvik-spot-backend-staging`) | Pre-release verification & owner QA | Dedicated staging project. Synthetic test data only (`testData: true`). |
| **Production** | Future production | Future Render production service | Live production customer application | Strictly restricted. Requires explicit owner approval. |

---
*End of Environment Strategy Document.*
