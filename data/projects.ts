// PLACEHOLDER DATA — replace with real projects when media and approvals arrive.
// Keep `placeholder: true` until a project is real; the UI labels these clearly.

export interface Project {
  num: string;
  title: string;
  sector: string;
  year: string;
  services: string;
  placeholder: boolean;
}

export const projects: Project[] = [
  {
    num: "01",
    title: "Project — TBD",
    sector: "—",
    year: "—",
    services: "AI Film",
    placeholder: true,
  },
  {
    num: "02",
    title: "Project — TBD",
    sector: "—",
    year: "—",
    services: "Creative Campaign",
    placeholder: true,
  },
  {
    num: "03",
    title: "Project — TBD",
    sector: "—",
    year: "—",
    services: "Digital Experience",
    placeholder: true,
  },
];
