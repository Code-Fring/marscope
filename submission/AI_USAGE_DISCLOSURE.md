# AI Usage Disclosure — MARSCOPE

## AI Tools Used

| Tool | Purpose | Extent |
|------|---------|--------|
| **OpenCode (opencode.ai)** | Primary development environment; agent orchestration, file operations, code generation | All code generation, file creation, research, documentation |
| **agent-browser (MCP)** | Web research: Space Apps challenge page, GitHub repos, NASA/USGS data portals, IAU Gazetteer | All external research; 50+ page fetches |
| **nuxt (MCP)** | Nuxt/Vue documentation lookup (not directly used; stack is Preact) | Reference only |
| **General LLM Reasoning** | Architecture decisions, code patterns, projection mathematics, license analysis | All design decisions, projection math (AEQD port), license verification |

## AI-Generated Content

### Code (100% AI-generated, human-reviewed)
- `src/` — Complete frontend (~25 TypeScript files): constants, projections (AEQD, CRS), layers, state, API client, main app, styles
- `backend/` — FastAPI server, Dockerfile, COG preparation script
- `public/data/mars_features.json` — 40+ Mars features compiled from IAU Gazetteer feature pages
- Configuration: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `README.md`, `LICENSE`

### Documentation (100% AI-generated, human-reviewed)
- `docs/CHALLENGE_ANALYSIS.md` — Extracted from Space Apps challenge page
- `docs/SCIENTIFIC_REQUIREMENTS.md` — Derived from challenge objectives
- `docs/RESEARCH_SOURCES.md` — Catalog of 15 data sources + 15 libraries
- `docs/GITHUB_RESEARCH.md` — 15+ GitHub repos evaluated
- `docs/OPEN_SOURCE_COMPONENTS.md` — Selected components with adaptation plans
- `THIRD_PARTY_LICENSES.md` — Full license texts for all dependencies
- `docs/NASA_DATA_CATALOG.md` — Verified data specs, access test results
- `docs/ARCHITECTURE.md` — Complete system design
- `docs/IMPLEMENTATION_STATUS.md` — Feature/dataset/dependency tracking
- `docs/AI_USAGE_LOG.md` — Session-by-session log
- `submission/*` — All 8 submission form documents

### Research (AI-conducted, human-verified)
- Space Apps challenge page text extraction (via agent-browser)
- GitHub repository search & license verification (via agent-browser)
- NASA/USGS data portal access testing (via agent-browser)
- IAU Gazetteer feature page scraping (via agent-browser)
- License verification from source repos (via agent-browser)

## Human Review & Verification

### Code Review
- [ ] All TypeScript compiles without errors (`tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] No hardcoded secrets, API keys, or credentials
- [ ] No `console.log` in production code paths
- [ ] All external fetch calls have error handling + graceful degradation
- [ ] Coordinate system constants single-sourced in `src/constants/mars.ts`
- [ ] Projection math (AEQD, haversine) matches planetary-dem-to-stl reference

### Data Verification
- [ ] MOLA DEM specs verified from USGS product page (via agent-browser)
- [ ] IAU Gazetteer feature coordinates verified from Feature pages (via agent-browser)
- [ ] License texts copied from source repository LICENSE files (via agent-browser)
- [ ] No fabricated elevation values, coordinates, or metadata
- [ ] All "INTEGRATED" vs "INVESTIGATED ONLY" statuses match IMPLEMENTATION_STATUS.md

### Documentation Accuracy
- [ ] No unimplemented features claimed as working
- [ ] All "WORKING"/"PARTIAL"/"NOT IMPLEMENTED" statuses match code
- [ ] All "[VERIFY]" items identified in submission materials
- [ ] No performance claims without measured data
- [ ] All data sources labeled with actual status (INTEGRATED vs INVESTIGATED ONLY)

## AI Limitations Acknowledged

1. **No Live Testing**: AI cannot run `npm install`, `npm run dev`, `docker build`, or `python scripts/prepare_mola_cog.py`. All build/run steps require human execution.

2. **No Visual Verification**: AI cannot confirm map renders correctly, colors match design, or UI interactions feel correct.

3. **No Network Testing**: AI cannot verify backend endpoints return correct JSON, COG conversion succeeds, or tile server serves valid PNGs.

4. **Projection Math**: AEQD ported from Python reference; round-trip accuracy not empirically validated.

5. **Backend COG Pipeline**: `prepare_mola_cog.py` downloads 2.1 GB and runs `gdal_translate` — requires human with GDAL installed and bandwidth.

6. **Measurement Tools**: Map click handlers for distance/profile/route not implemented; backend endpoints exist but frontend interaction incomplete.

## Human Responsibilities

The following **must** be done by humans before submission:

1. **Run the application**: `npm install && npm run dev` (frontend), `docker build -t marscope-backend backend/ && docker run -p 8000:8000 -v $(pwd)/backend/data:/data marscope-backend` (backend)

2. **Prepare MOLA COG**: Run `python backend/scripts/prepare_mola_cog.py` (requires GDAL, 2.1 GB download, ~10 min)

3. **Validate functionality**: 
   - Map loads, pans, zooms, layers switch
   - Click shows coordinates + elevation (if backend running)
   - Feature search works
   - No console errors

4. **Run tests**: `npm run test` (Vitest), `npm run lint` (ESLint + tsc)

5. **Verify coordinates**: Compare app elevation at 5 known locations vs published MOLA values

5. **Final documentation sync**: Ensure IMPLEMENTATION_STATUS.md matches actual working features

## Attribution

This project was developed with AI assistance using OpenCode (opencode.ai) as the primary development environment. All code, documentation, and research were generated by AI agents under human direction and review. Final human review and validation is required before submission.

**AI does not claim authorship** — this disclosure fulfills the Space Apps AI usage disclosure requirement by documenting exactly what AI did, what humans must verify, and what limitations exist.