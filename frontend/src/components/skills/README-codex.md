# Skill Atlas data package — Instructions for Codex

## Files

- `portfolio-skills.json` is the **domain → skills** map. Its `domains` array holds exactly 6 categories with 8–10 ordered `skillIds` each. Its `skills` array contains **59** skill records with personalised one-sentence descriptions, qualitative `proficiency` values and `projectIds`.
- `portfolio-projects.json` is the **project → skills** map. Its `projects` array contains **12** records with matching `skillIds`, plus GitHub, live-site and certificate links where supplied.
- `skills-catalogue.md` is the full human-readable catalogue, useful for reviewing copy before implementation.

## Data contract

**Stable IDs** connect the two files. Never match by display name, index, slug generated from the name, or guessed GitHub URL.

```ts
type Proficiency = 'core' | 'applied' | 'working' | 'exploratory';
type Domain = {
  id: string;
  name: string;
  description: string;
  skillIds: string[];
};
type Skill = {
  id: string;
  name: string;
  domainId: string;
  proficiency: Proficiency;
  description: string;
  projectIds: string[];
};
type Project = {
  id: string;
  name: string;
  summary: string;
  projectType: 'personal' | 'client' | 'team' | 'academic';
  githubUrl: string | null;
  liveUrl: string | null;
  credentialUrl: string | null;
  skillIds: string[];
  domainIds: string[];
};
```

The `proficiencyScale` values in `portfolio-skills.json` are editorial guidance, not percentages. `core` means substantial repeated use, `applied` means hands-on usage, and `working` means limited/practical familiarity or ongoing exploration. `exploratory` is reserved for introductory-only knowledge, and none of the current 59 skills needs it.

## Implementation guidance

Build a **two-mode** React Skill Atlas: **By domain** and **By project**, using one shared skill and project registry. Use the six domains as first-level tiles. Clicking a domain opens its 8–10 skills. Clicking a skill opens a side panel with `name`, `description`, `proficiency` and all supporting projects. Each project card should show a `View GitHub` link **only** if `githubUrl` is non-null, a `Visit site` link only if `liveUrl` is non-null, and a `View certificate` link only if `credentialUrl` is non-null. For the earthquake ETL project, show no outbound link until one is supplied. For Kumo Mochi, show the live website but not a fake repository.

Switching to the **By project** mode shows all 12 projects. Selecting a project highlights exactly the entries in that project's `skillIds`; organise them by their `domainId` and optionally show its live/demo/certificate links. Provide bidirectional navigation: from a skill to a project, and from a project to each skill. Preserve the selected item when toggling modes if practical.

Use subtle neon/dark treatments that fit the existing portfolio without turning the data into an unreadable 3D cloud. Make domain and skill tiles keyboard-accessible, give focus states, and support reduced motion. On desktop, use a right-hand detail panel; on mobile, use a sheet or inline panel. The initial view should expose the six domains without requiring interaction. Search should match `name`, `description` and project names if implemented.

### Example lookup logic

```ts
import skillsData from './portfolio-skills.json';
import projectsData from './portfolio-projects.json';

const skillsById = new Map(skillsData.skills.map(s => [s.id, s]));
const projectsById = new Map(projectsData.projects.map(p => [p.id, p]));

function getSkillsForDomain(domainId: string) {
  const domain = skillsData.domains.find(d => d.id === domainId);
  return (domain?.skillIds ?? []).map(id => skillsById.get(id)).filter(Boolean);
}

function getSkillsForProject(projectId: string) {
  const project = projectsById.get(projectId);
  return (project?.skillIds ?? []).map(id => skillsById.get(id)).filter(Boolean);
}

function getProjectsForSkill(skillId: string) {
  const skill = skillsById.get(skillId);
  return (skill?.projectIds ?? []).map(id => projectsById.get(id)).filter(Boolean);
}
```

## Editorial rules

1. Use the first-person description verbatim as the default text; rewrite only after reviewing the owner's actual contribution.
2. Do not present proficiency as a percentage or numeric score. Do not call skills `expert` or assert production experience without evidence.
3. The MLOps certificate is an **additional learning credential**, not a certification automatically proving every project skill.
4. Project links came from the owner; `null` means **not provided**, not broken or secret. Do not guess or construct URLs.
5. The `githubUrl` for Hi5 is a **team repository**; don't imply sole ownership of the team's entire codebase.
6. Some related technologies were intentionally combined, e.g. `RAG & LangChain`, `Docker & Docker Compose`, `Databricks & Delta Lake`, to keep each domain focused.
7. If updating a skill association, update BOTH `Skill.projectIds` and `Project.skillIds` (and the corresponding `Project.domainIds`) or write a script to regenerate the reverse index.
8. Validate IDs, array lengths, missing references and symmetry before deploying. Changes to descriptions or categories should not silently change IDs.

## Validation checklist

- Every domain has 8–10 skills; 6 domains in total.
- All skill IDs are unique; each skill belongs to one primary domain.
- Every `skill.projectIds` reference exists in the projects registry.
- Every `project.skillIds` reference exists in the skills registry.
- Reverse associations agree in both directions.
- No outbound GitHub link is shown for `null` values.
- Project mode and domain mode use the same underlying skill records.

## Ready-to-use Codex task

> Read `portfolio-skills.json`, `portfolio-projects.json` and `README-codex.md` in full, and use them as the sole source of truth for my Portfolio Skill Atlas. Implement a polished, responsive React skill section consistent with my existing dark/neon visual system. Use six domain tiles, a domain-to-skills view, a project-to-skills view, keyboard-accessible skill detail panels, project evidence links, subtle animated transitions and search. Keep the supplied project relationships and proficiency phrasing faithful to the JSON. Do not create fake GitHub URLs, numeric proficiency scores or ungrounded technology claims. Include a validation routine or tests that check integrity of all skill/project IDs and reverse mappings.
