export interface Project {
  id: number;
  title: string;
  subtitle: string;
  features: string[];
  image: string;
  gradient: string; // Tailwind gradient classes like "from-pink-500 to-purple-600"
}

// Add, remove, or edit your projects here
export const projects: Project[] = [
  {
    id: 1,
    title: "Sirolimous Efficiency in Organoids",
    subtitle: "--temp",
    features: [
      "--",
      "--",
      "--",
      "--"
    ],
    image: "/Jordan/images/Showcase/Organoid.png",
    gradient: "from-pink-500 to-purple-600"
  },
  {
    id: 2,
    title: "Minimally Invasive Annuloplasty using Shape Memory Materials",
    subtitle: "-",
    features: [
      "-",
      "-",
      "-",
      "-"
    ],
    image: "/images/project-beta.png",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    id: 3,
    title: "gwas",
    subtitle: "-",
    features: [
      "-",
      "-",
      "-",
      "-"
    ],
    image: "/images/project-gamma.png",
    gradient: "from-emerald-500 to-teal-600"
  },
  {
    id: 4,
    title: "Defect-Based Engineering for Biosensing Applications",
    subtitle: "-",
    features: [
      "-",
      "-",
      "-",
      "-"
    ],
    image: "/images/project-delta.png",
    gradient: "from-orange-500 to-rose-600"
  }
];
