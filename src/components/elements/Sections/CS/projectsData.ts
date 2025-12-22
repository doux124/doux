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
    title: "Variants and Heterogeneity of MASH",
    subtitle: "-",
    features: [
      "-",
      "-",
      "-",
      "-"
    ],
    image: "/Jordan/images/Showcase/Organoid.png",
    gradient: "from-pink-500 to-purple-600"
  },
  {
    id: 2,
    title: "Virtual Arm with Multimodal Biased feedback",
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
    title: "Ultrasound",
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
    title: "Project Delta",
    subtitle: "A real-time collaboration tool for distributed teams.",
    features: [
      "💬 Real-time messaging with WebSocket integration.",
      "📝 Collaborative document editing.",
      "🎥 Video conferencing capabilities.",
      "🔔 Smart notification system."
    ],
    image: "/images/project-delta.png",
    gradient: "from-orange-500 to-rose-600"
  }
];
