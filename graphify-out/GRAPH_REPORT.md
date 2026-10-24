# Graph Report - APLIKASIKU  (2026-10-25)

## Corpus Check
- 51 files · ~103,752 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 5 file(s) not represented in the graph (top: .example 1, (none) 1, .lock 1)

## Summary
- 277 nodes · 900 edges · 12 communities (11 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- UI Components & PDF Generation
- Backend Server & Firebase Config
- Core App Layout & Navigation
- Teacher Views & Holographic UI
- Server Dependencies & Services
- Generator Perangkat Ajar & RME
- TypeScript Compiler Configuration
- Build & Dev Tooling
- Vercel Cloud Deployment Config
- QR Scanner Type Declarations
- App Documentation & Deployment
- Vite Environment Type Declarations

## God Nodes (most connected - your core abstractions)
1. `react` - 34 edges
2. `Siswa` - 34 edges
3. `Pengaturan` - 33 edges
4. `lucide-react` - 30 edges
5. `App()` - 30 edges
6. `Mapel` - 29 edges
7. `notifySimpanSuccess()` - 23 edges
8. `notifySimpanError()` - 23 edges
9. `InputPenilaianView()` - 22 edges
10. `DataNilai` - 21 edges

## Surprising Connections (you probably didn't know these)
- `GeneratorLkpdAIViewProps` --references--> `Pengaturan`  [EXTRACTED]
  src/components/GeneratorLkpdAIView.tsx → src/types.ts
- `GeneratorPerangkatAjarAIViewProps` --references--> `Pengaturan`  [EXTRACTED]
  src/components/GeneratorPerangkatAjarAIView.tsx → src/types.ts
- `HeaderProps` --references--> `Pengaturan`  [EXTRACTED]
  src/components/Header.tsx → src/types.ts
- `ModulAjarAIViewProps` --references--> `Pengaturan`  [EXTRACTED]
  src/components/ModulAjarAIView.tsx → src/types.ts
- `PerangkatAjarKBCViewProps` --references--> `Pengaturan`  [EXTRACTED]
  src/components/PerangkatAjarKBCView.tsx → src/types.ts

## Import Cycles
- None detected.

## Communities (12 total, 1 thin omitted)

### Community 0 - "UI Components & PDF Generation"
Cohesion: 0.10
Nodes (50): jspdf, jspdf-autotable, lucide-react, react, Card3DTilt(), Card3DTiltProps, HeroHologramOrb(), HeroHologramOrbProps (+42 more)

### Community 1 - "Backend Server & Firebase Config"
Cohesion: 0.05
Nodes (41): app, name, private, scripts, build, clean, dev, lint (+33 more)

### Community 2 - "Core App Layout & Navigation"
Cohesion: 0.08
Nodes (29): firebase, react-dom, AI_TOOLS_ITEMS, AKADEMIK_ITEMS, App(), DEFAULT_CONFIG, LAPORAN_ITEMS, DownloadPerangkatAjarView() (+21 more)

### Community 3 - "Teacher Views & Holographic UI"
Cohesion: 0.26
Nodes (31): HoloScanningMesh(), HoloScanningMeshProps, AgendaMengajarView(), BackupPenilaianModal(), BimbinganWaliView(), InputAbsensiView(), InputPenilaianView(), JadwalMengajarView() (+23 more)

### Community 4 - "Server Dependencies & Services"
Cohesion: 0.09
Nodes (22): dependencies, dotenv, express, firebase, @google/genai, jsbarcode, jspdf, jspdf-autotable (+14 more)

### Community 5 - "Generator Perangkat Ajar & RME"
Cohesion: 0.16
Nodes (14): DEFAULT_AGENDA_SEKOLAH, DEFAULT_RME_GANJIL, DEFAULT_RME_GENAP, GeneratorPerangkatAjarAIView(), GeneratorPerangkatAjarAIViewProps, ModulAjarAIView(), ModulAjarAIViewProps, PerangkatAjarKBCView() (+6 more)

### Community 6 - "TypeScript Compiler Configuration"
Cohesion: 0.12
Nodes (15): compilerOptions, allowImportingTsExtensions, allowJs, experimentalDecorators, isolatedModules, jsx, lib, module (+7 more)

### Community 7 - "Build & Dev Tooling"
Cohesion: 0.20
Nodes (10): devDependencies, autoprefixer, esbuild, tailwindcss, tsx, @types/express, @types/node, @types/qrcode (+2 more)

### Community 8 - "Vercel Cloud Deployment Config"
Cohesion: 0.40
Nodes (4): buildCommand, outputDirectory, rewrites, version

### Community 9 - "QR Scanner Type Declarations"
Cohesion: 0.50
Nodes (3): jsqr, Options, QRCode

### Community 10 - "App Documentation & Deployment"
Cohesion: 0.67
Nodes (3): EduFutura AI Web Entry Point, App Setup & Run Guide, Render Deployment Service Spec

## Knowledge Gaps
- **13 isolated node(s):** `@types/three`, `motion`, `pptxgenjs`, `@types/express`, `@types/node` (+8 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 105 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `UI Components & PDF Generation` to `Backend Server & Firebase Config`, `Core App Layout & Navigation`, `Teacher Views & Holographic UI`, `Generator Perangkat Ajar & RME`?**
  _High betweenness centrality (0.151) - this node is a cross-community bridge._
- **What connects `@types/three`, `motion`, `pptxgenjs` to the rest of the system?**
  _13 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `UI Components & PDF Generation` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Why does `dependencies` connect `Server Dependencies & Services` to `Backend Server & Firebase Config`?**
  _High betweenness centrality (0.129) - this node is a cross-community bridge._
- **Should `Backend Server & Firebase Config` be split into smaller, more focused modules?**
  _Cohesion score 0.05272108843537415 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `UI Components & PDF Generation` to `Backend Server & Firebase Config`, `Core App Layout & Navigation`, `Teacher Views & Holographic UI`, `Generator Perangkat Ajar & RME`?**
  _High betweenness centrality (0.119) - this node is a cross-community bridge._
- **Should `Core App Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.08416389811738649 - nodes in this community are weakly interconnected._