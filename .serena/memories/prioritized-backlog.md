# n8n MCP Server - Prioritized Backlog

## Sprint Overview
**Start Date:** 2025-10-05
**Target Completion:** 2025-11-02 (4 weeks)
**Current Sprint:** Setup & Phase 1

---

## 🔴 CRITICAL PATH (Must Complete First)

### Phase 1: Pagination & Infrastructure (Week 1)
**Priority:** P0 - Blocking for scale
**Status:** NOT STARTED
**Assigned:** Next

#### Backlog Items:
- [ ] **P1.1** - Update package.json: n8n-workflow to v1.82.3+ (30 min)
- [ ] **P1.2** - Add pagination types to src/types/api.ts (1 hour)
  - Add `PaginatedResponse<T>` interface
  - Add `cursor?: string` to list methods
  - Add `nextCursor?: string` to responses
- [ ] **P1.3** - Implement cursor pagination in listWorkflows() (1 hour)
  - Accept `cursor` and `limit` parameters
  - Return `nextCursor` in response
  - Test with 250+ workflows
- [ ] **P1.4** - Implement cursor pagination in listExecutions() (45 min)
- [ ] **P1.5** - Implement cursor pagination in getTags() (45 min)
- [ ] **P1.6** - Update MCP tool schemas for pagination (30 min)
- [ ] **P1.7** - Test pagination end-to-end (30 min)

**Total Effort:** 3.5-4 hours
**Dependencies:** None
**Blocks:** Phase 2 (better to have stable infrastructure first)

---

### Phase 2: Credentials Management (Week 2)
**Priority:** P0 - Critical missing feature
**Status:** NOT STARTED
**Assigned:** After Phase 1

#### Backlog Items:
- [ ] **P2.1** - Create src/services/credentialOperations.ts (2 hours)
  - `listCredentials(instance, cursor?, limit?)`
  - `getCredential(instance, id)`
  - `createCredential(instance, data)`
  - `updateCredential(instance, id, data)`
  - `deleteCredential(instance, id)`
  - `getCredentialSchema(instance, type)`
- [ ] **P2.2** - Add credential types to src/types/api.ts (1 hour)
  - `Credential` interface
  - `CredentialSchema` interface
  - Request/response types
- [ ] **P2.3** - Wire up 6 MCP tools in src/index.ts (1.5 hours)
  - Add tool schemas
  - Add handlers in handleToolCall()
- [ ] **P2.4** - Add credential methods to N8NApiWrapper (1 hour)
- [ ] **P2.5** - Write integration tests for credentials (1 hour)
- [ ] **P2.6** - Test credential creation/update workflow (30 min)

**Total Effort:** 5-6 hours
**Dependencies:** Phase 1 (pagination for list_credentials)
**Blocks:** Many workflows require credentials

---

### Phase 3: Source Control (Week 3)
**Priority:** P0 - CI/CD enablement
**Status:** NOT STARTED
**Assigned:** After Phase 2

#### Backlog Items:
- [ ] **P3.0** - Test Git integration availability (30 min)
  - `curl GET /api/v1/source-control/preferences`
  - Document which instances have Git enabled
- [ ] **P3.1** - Create src/services/sourceControlOperations.ts (1.5 hours)
  - `pullFromGit(instance, force?)`
  - `pushToGit(instance, message?)`
  - `getSourceControlStatus(instance)`
- [ ] **P3.2** - Add source control types to src/types/api.ts (30 min)
- [ ] **P3.3** - Wire up 3 MCP tools in src/index.ts (1 hour)
- [ ] **P3.4** - Add error handling for Git conflicts (1 hour)
- [ ] **P3.5** - Write integration tests (45 min)
- [ ] **P3.6** - Test pull/push workflow (30 min)

**Total Effort:** 3.5-4 hours
**Dependencies:** Phase 2 (credentials may be needed for Git auth)
**Blocks:** DevOps automation workflows

---

## 🟠 MEDIUM PRIORITY (If Time Permits)

### Phase 4: User & Project Management (Week 4)
**Priority:** P1 - Team edition only
**Status:** NOT STARTED
**Assigned:** TBD

#### Prerequisites:
- [ ] **P4.0** - Verify team/enterprise edition (30 min)
  - Test `GET /api/v1/users` endpoint availability
  - Test `GET /api/v1/projects` endpoint availability
  - Document edition requirements

#### Backlog Items (Conditional):
- [ ] **P4.1** - Create src/services/userOperations.ts (2.5 hours)
  - 5 CRUD endpoints for users
- [ ] **P4.2** - Create src/services/projectOperations.ts (2.5 hours)
  - 5 CRUD endpoints for projects
- [ ] **P4.3** - Add user/project types (1 hour)
- [ ] **P4.4** - Wire up 10 MCP tools (2 hours)
- [ ] **P4.5** - Integration tests (1.5 hours)

**Total Effort:** 6-8 hours (if applicable)
**Dependencies:** Phases 1-3 complete
**Blocks:** Nothing critical

---

## 🟢 ONGOING (All Phases)

### Phase 5: Testing & Documentation
**Priority:** P0 - Quality assurance
**Status:** CONTINUOUS

#### Backlog Items:
- [ ] **P5.1** - Update CLAUDE.md after each phase (15 min/phase)
- [ ] **P5.2** - Update README with examples (30 min/phase)
- [ ] **P5.3** - Add integration tests (included in phase estimates)
- [ ] **P5.4** - Regression test existing features (30 min/phase)
- [ ] **P5.5** - Update test-mcp-tools.js (20 min/phase)

**Total Effort:** ~2 hours per phase (included in phase estimates)
**Dependencies:** Runs parallel to all phases

---

## 📊 Backlog Summary

### By Priority:
- **P0 (Critical):** 18 items - Phases 1, 2, 3, 5
- **P1 (Medium):** 6 items - Phase 4 (conditional)

### By Week:
- **Week 1:** Phase 1 (7 items, 4 hours)
- **Week 2:** Phase 2 (6 items, 6 hours)
- **Week 3:** Phase 3 (7 items, 4 hours)
- **Week 4:** Phase 4 (6 items, 8 hours) OR buffer/polish

### Total Effort:
- **Minimum (P0 only):** 20-22 hours
- **Maximum (all phases):** 28-30 hours

---

## 🎯 Definition of Done (Each Phase)

### Code Complete:
- [ ] All backlog items implemented
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Multi-instance support verified

### Testing Complete:
- [ ] Integration tests pass
- [ ] Manual testing on live n8n instance
- [ ] Regression tests pass
- [ ] Error handling tested

### Documentation Complete:
- [ ] CLAUDE.md updated
- [ ] README examples added
- [ ] Code comments complete
- [ ] API types documented

---

## 🚀 Next Actions
1. Begin Phase 1, Item P1.1 (Update package.json)
2. Mark setup tasks complete in TodoWrite
3. Update progress memory after each completed item