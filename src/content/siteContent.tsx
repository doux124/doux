// ============================================================================
// siteContent.tsx — SINGLE SOURCE OF TRUTH for the whole homepage.
//
// Everything the page shows lives here: the hero, every project card, the
// "Beyond Research" highlights, the section ORDER, and the side-menu links.
// To change wording, swap a photo, add a card, or reorder sections, edit THIS
// file only — the components read from it.
//
//   • Reorder sections ......... move entries in the `sections` array (order = render order).
//   • Add / remove a card ...... edit a section's `cards` array.
//   • Change a photo ........... set `image` to a path under /public, e.g. `${BASE}images/Showcase/x.png`.
//   • Rename / recolour a nav .. edit that section's `nav` block (also drives the menu).
//   • New section .............. add a `{ kind: 'projects' | 'highlights', ... }` object; it renders
//                                and gets a menu entry automatically.
// ============================================================================

const BASE = import.meta.env.BASE_URL;

// This site's own address, read at runtime so it stays correct wherever it is
// deployed (localhost, GitHub Pages, a custom domain) without being hardcoded.
const SELF_URL = typeof window === 'undefined' ? '' : `${window.location.origin}${BASE}`;
const SELF_DISPLAY =
  typeof window === 'undefined' ? '' : `${window.location.host}${BASE}`.replace(/\/$/, '');

export type BackgroundKey = 'standard' | 'dna' | 'semiconductor' | 'none';

export interface ContactLink {
  label: string;      // left-hand tag, e.g. "Email"
  display: string;    // clickable text
  href: string;
  external?: boolean; // opens in a new tab when true
}

export interface HeroContent {
  name: string;
  tagline: string;
  majors: string;
  contacts: ContactLink[];
}

export interface ProjectCard {
  id: number;
  title: string;
  subtitle: string;
  features: string[];
  gradient: string;                 // Tailwind gradient, e.g. "from-pink-500 to-purple-600"
  image?: string;                   // optional photo; omit to show the gradient placeholder
  // CSS colour: show the image whole (never cropped) against this backdrop. Only safe
  // when the image's own edges are that flat colour, else the seam shows.
  imagePlate?: string;
  visual?: 'manhattan';             // optional animated visual shown instead of a photo
  link?: { label: string; href: string };
  todo?: boolean;                   // true while the copy is still a placeholder
}

export interface HighlightEntry {
  title: string;
  meta?: string;                    // date range, venue, grade, etc.
  note?: string;                    // one-line description
  href?: string;                    // optional external link
  doi?: string;                     // bare DOI, e.g. "10.1136/heartjnl-2026-1234"; links to doi.org
}

// A single role held at an organisation. Several of these under one `ExperienceOrg`
// render as a connected stack, the way LinkedIn shows multiple roles at one employer.
export interface ExperienceRole {
  title: string;
  dates?: string;                   // e.g. "Apr 2021 – Jan 2022 · 10 mos"
  location?: string;                // e.g. "MD6"; joins `dates` on one subheader line
  testimonial?: { label: string; href: string };
  href?: string;                    // optional link out (e.g. work produced in the role)
}

export interface ExperienceOrg {
  org: string;
  meta?: string;                    // total span at this organisation, e.g. "5 yrs 1 mo"
  roles: ExperienceRole[];
}

export interface HighlightGroup {
  heading: string;
  wide?: boolean;                   // span the full grid width (entries flow in two columns)
  span?: 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12;            // explicit width out of 12; overrides `wide`. Lets a tall
                                    // group take extra width so a row ends level.
  entries?: HighlightEntry[];
  experience?: ExperienceOrg[];     // rendered as a grouped timeline instead of `entries`
}

export interface NavStyle {
  label: string;                    // shown on the menu "book"
  color: string;
  glow: string;
}

export type Section =
  | {
      kind: 'projects';
      id: string;                   // scroll anchor + menu target
      nav: NavStyle;
      title: string;
      background: BackgroundKey;
      featuresLabel?: string;       // heading above the bullet list (default "Key Features")
      cards: ProjectCard[];
    }
  | {
      kind: 'highlights';
      id: string;
      nav: NavStyle;
      title: string;
      background: BackgroundKey;
      groups: HighlightGroup[];
    };

// ---------------------------------------------------------------------------
// HERO
// ---------------------------------------------------------------------------
export const hero: HeroContent = {
  name: 'Jordan Low Jun Yi',
  tagline: 'Biomedical Engineering Student at NUS',
  majors: 'Second Major in Computing • Specialization in Tissue Engineering • Minor in AI • Minor in Design',
  contacts: [
    {
      label: 'Email',
      display: 'jordanljy@u.nus.edu',
      href: 'mailto:jordanljy@u.nus.edu?subject=Contact%20from%20Website&body=Hi%20Jordan,',
    },
    {
      label: 'LinkedIn',
      display: 'linkedin.com/in/jordan-low-jun-yi',
      href: 'https://linkedin.com/in/jordan-low-jun-yi',
      external: true,
    },
    {
      label: 'Google Scholar',
      display: 'Google Scholar profile',
      href: 'https://scholar.google.com/citations?hl=en&user=O6M8clAAAAAJ',
      external: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// SECTIONS  (array order === on-page order === menu order)
// ---------------------------------------------------------------------------
export const sections: Section[] = [
  // ===================== BIOMEDICAL ENGINEERING =====================
  {
    kind: 'projects',
    id: 'bme-section',
    title: 'Biomedical Engineering Projects',
    background: 'dna',
    nav: { label: 'BIOMEDICAL ENGINEERING', color: '#ec4899', glow: '#f472b6' },
    cards: [
      {
        id: 1,
        title: 'Sirolimus Efficacy in Liver Organoids',
        subtitle: 'Liver-organoid models revealing MASH-clearing effects of an atherosclerosis drug',
        features: [
          'Grew 3D liver organoids as a disease model for metabolic liver disease (MASH)',
          'Found a class of atherosclerosis drugs cleared MASH features in diseased cells',
          'Restored the actin cytoskeleton and mitochondrial count in diseased hepatocytes',
          'Reduced intracellular lipid (fat) volume',
        ],
        image: `${BASE}images/Showcase/Organoid.png`,
        gradient: 'from-pink-500 to-purple-600',
      },
      {
        id: 2,
        title: 'Minimally Invasive Annuloplasty using Shape-Memory Materials',
        subtitle: 'Shape-memory, biodegradable rings for minimally invasive cardiac surgery',
        features: [
          'Shape-memory rings from Nitinol and MMA-PEGDMA that expand at body temperature',
          '94.3% smaller incision for cardiac surgery',
          '48% reduction in mitral valve regurgitation',
          'Biodegradable options tailored for pediatric hearts',
        ],
        image: `${BASE}images/Showcase/polymer_ring.png`,
        gradient: 'from-cyan-500 to-blue-600',
      },
      {
        id: 3,
        title: 'KneedIt: Smart Knee Sleeve for Osteoarthritis',
        subtitle: 'A sensor-packed knee sleeve and app that turn screen time into knee care for older adults',
        features: [
          'Smart compression sleeve tracking knee range of motion, muscle activity (EMG), and tissue health (PPG), with on-sleeve LED feedback',
          'Companion app locks the phone past a screen-time threshold until the sleeve verifies a guided exercise session is genuinely done',
          'Caregiver dashboard lets family track mobility trends and receive alerts, closing the accountability loop',
          'Targets knee osteoarthritis in older adults (~40% of Singaporeans over 70), with a working app prototype live',
        ],
        image: `${BASE}images/Showcase/kneedit.jpg`,
        gradient: 'from-teal-500 to-emerald-600',
        link: { label: 'Live app prototype', href: 'https://kneed-it2.vercel.app/' },
      },
      {
        id: 4,
        title: 'FreeStryde: Lymphedema Therapy Device',
        subtitle: 'A wearable that recreates manual lymphatic drainage to make gold-standard lymphedema care accessible',
        features: [
          'Began at IDEATE 2025 as a portable alternative to bulky intermittent pneumatic compression (IPC) devices',
          'Pivoted to replicating manual lymphatic drainage (MLD), the clinical gold standard, after therapist and patient validation',
          'Aims to reach patients priced out of MLD (up to $200/session, rarely insured) or without access while travelling',
          'Validated in stages: sponge, then ballistic-gel phantom with FITC-dextran, then user testing (SUS/QUEST)',
        ],
        gradient: 'from-sky-500 to-indigo-600',
      },
    ],
  },

  // ========================= COMPUTER SCIENCE =========================
  {
    kind: 'projects',
    id: 'cs-section',
    title: 'Computer Science Projects',
    background: 'semiconductor',
    nav: { label: 'COMPUTER SCIENCE', color: '#8b5cf6', glow: '#a78bfa' },
    cards: [
      {
        id: 1,
        title: 'Virtual Arm with Multimodal Biased Feedback',
        subtitle: 'Brain-computer interface training with a virtual robotic arm',
        features: [
          'Built a BCI training system using a virtual robotic arm to teach motor imagery',
          'Classified EEG motor imagery with SVMs at >97% accuracy using FFT and CSP features',
          'Showed biased feedback improves classification accuracy and cuts training time',
          'Aimed at more accessible prosthetics and rehabilitation for stroke patients and amputees',
        ],
        image: `${BASE}images/Showcase/eeg_cap.jpg`,
        gradient: 'from-cyan-500 to-blue-600',
      },
      {
        id: 2,
        title: 'Staging Liver Disease from Ultrasound',
        subtitle: 'Deep learning that stages fatty-liver disease from ultrasound, no FibroScan needed',
        features: [
          'Trained EfficientNet-B6 models to predict CAP and liver stiffness from B-mode ultrasound images',
          'Fed predictions into the FAST and Agile-3 scores to flag at-risk MASH and advanced fibrosis',
          'Trained on four Japanese centers and externally validated on an independent Chinese cohort',
          'Reached AUCs up to 0.98 (rule-out MASH) and 0.91 (rule-out advanced fibrosis)',
        ],
        image: `${BASE}images/Showcase/liver_ultrasound.png`,
        imagePlate: '#ffffff',
        gradient: 'from-emerald-500 to-teal-600',
      },
      {
        id: 3,
        // Rendered with the animated Manhattan-plot canvas instead of a photo.
        title: 'Genome-Wide Association Study',
        subtitle: 'Mapping the genetics of the TG:HDL ratio across 424,032 UK Biobank participants',
        features: [
          'Ran a GWAS of the triglyceride-to-HDL ratio, a marker of insulin resistance and cardiovascular risk',
          'Mapped 221 genomic risk loci with FUMA and MAGMA, recovering known lipid genes (LPL, CETP, APOA5)',
          'Uncovered enrichment of hepatocellular-carcinoma pathways, tying dyslipidemia to liver-cancer risk',
          'Linked significant variants to incident myocardial infarction with Cox proportional-hazards models',
        ],
        visual: 'manhattan',
        gradient: 'from-emerald-500 to-teal-600',
      },
      {
        id: 4,
        title: 'CARE-Liver: Fibrosis Staging on MRI',
        subtitle: 'A segmentation-to-staging deep-learning cascade for liver fibrosis on multi-vendor MRI',
        features: [
          'Built a two-stage pipeline for the MICCAI CARE-Liver challenge, staging fibrosis from abdominal MRI',
          'Fine-tuned TotalSegmentator-MRI in nnU-Net to segment the liver from just 30 scans (Dice 0.97)',
          'Trained per-sequence 3D ResNet ensembles with missing-modality-robust late fusion',
          'Stayed self-contained at inference across heterogeneous vendors and missing sequences',
        ],
        gradient: 'from-orange-500 to-rose-600',
        link: { label: 'Digital Heart Lab', href: 'https://digitalheartlab.com/people/jordan_low' },
      },
    ],
  },

  // ========================== MORE ABOUT ME ==========================
  {
    kind: 'highlights',
    id: 'about-section',
    title: 'More about me',
    background: 'none',
    nav: { label: 'MORE ABOUT ME', color: '#f59e0b', glow: '#fbbf24' },
    groups: [
      {
        heading: 'Publications',
        entries: [
          {
            title: 'Prognosis of STEMI patients presenting to the ED without chest pain: a nationwide cohort study',
            meta: 'Heart · 2026',
            doi: '10.1136/heartjnl-2025-327601',
          },
          {
            title: 'Diversity in MASLD: a framework for precision medicine',
            meta: 'npj Gut and Liver · 2026',
            doi: '10.1038/s44355-026-00061-3',
          },
          {
            title: 'Fibro-inflammatory liver injury, not steatosis, predicts neuropsychiatric events and mortality (UK Biobank)',
            meta: 'Metabolism · 2026',
            doi: '10.1016/j.metabol.2026.156635',
          },
          {
            title: 'Organoid models reveal sirolimus efficacy in liver-vascular steatosis and foam-cell formation',
            meta: 'Atherosclerosis · 2026',
            doi: '10.1016/j.atherosclerosis.2026.120762',
          },
        ],
      },
      {
        heading: 'UI/UX & Web Design',
        entries: [
          { title: 'This Portfolio', meta: SELF_DISPLAY, href: SELF_URL },
          {
            title: 'Kosmode Health',
            meta: 'kosmodehealth.com',
            href: 'https://kosmodehealth.com/',
          },
          {
            title: 'NUS DE-Scholars',
            meta: 'nusdescholars.com',
            href: 'https://www.nusdescholars.com/',
          },
          {
            title: 'KneedIt',
            meta: 'kneed-it2.vercel.app',
            href: 'https://kneed-it2.vercel.app/',
          },
          {
            title: 'Previous Portfolio',
            meta: 'doux124.github.io/jordan',
            href: 'https://doux124.github.io/jordan/',
          },
        ],
      },
      {
        heading: 'Awards & Honours',
        wide: true,
        entries: [
          { title: 'Innovation & Research Award 2026 (High Achievement)', meta: '2026' },
          { title: 'IDEATE 2025 — Champion', meta: 'NUS · Oct 2025' },
          { title: "Tan Kah Kee Young Inventors' Award (TKKYIA) — Silver", meta: 'Tan Kah Kee Foundation · Jul 2022' },
          { title: 'Global Youth Science & Technology Bowl (GYSTB) — Grand Prize (Gold)', meta: 'HK Federation of Youth Groups · May 2022' },
          { title: 'International Elementz Fair (IEF) — Gold', meta: 'NTU · Apr 2022' },
          { title: 'Singapore Science & Engineering Fair (SSEF) — Gold', meta: 'SSEF · Mar 2022' },
          { title: 'Singapore Science & Engineering Fair (SSEF) — Silver', meta: 'SSEF · Mar 2022' },
          { title: 'A*STAR Young Researcher Award', meta: 'A*STAR Singapore · Jan 2022' },
          { title: 'National Robotics Competition — 2nd Runner Up', meta: 'Science Centre Singapore · Sep 2021' },
          { title: 'International Chemistry Tournament (IChTo) — Champion', meta: 'IChTo · Aug 2021' },
          { title: 'Singapore Chemistry Olympiad (SChO) — Gold', meta: 'Singapore National Institute of Chemistry · Jul 2021' },
          { title: 'A*STAR Science Award (Junior College)', meta: 'A*STAR Singapore · Jan 2021' },
          { title: 'UK Intermediate Biology Olympiad — Gold', meta: 'UK Biology Competitions · Mar 2020' },
          { title: 'Singapore Junior Biology Olympiad (SJBO) — Gold', meta: 'May 2019' },
          { title: 'Singapore Junior Chemistry Olympiad (SJChO) — Gold', meta: 'May 2019' },
          { title: 'UK Biology Challenge — Gold', meta: 'UK Biology Competitions · Mar 2019' },
        ],
      },
      {
        heading: 'Experience',
        span: 9,
        experience: [
          {
            org: 'Agency for Science, Technology and Research (A*STAR)',
            meta: '3 mos',
            roles: [
              { title: 'Innovation and Enterprise Intern', dates: 'May 2026 – Present · 3 mos', location: 'Kinesis, Innovis' },
              { title: 'Institute of Molecular and Cell Biology Intern', dates: 'May 2026 – Present · 3 mos', location: 'Proteos' },
            ],
          },
          {
            org: 'NUS Yong Loo Lin School of Medicine',
            meta: '5 yrs 1 mo',
            roles: [
              { title: 'Research Staff', dates: 'Jun 2024 – Present · 2 yrs 2 mos', location: 'MD1, E7' },
              { title: 'Cardiothoracic and Vascular Surgery Intern', dates: 'May 2022 · 1 mo', location: 'National University Hospital (NUH)' },
              { title: 'Research Intern', dates: 'Jul 2021 – May 2022 · 11 mos', location: 'MD6' },
            ],
          },
          {
            org: 'KosmodeHealth Singapore',
            meta: '9 mos · Curie',
            roles: [
              { title: 'UI/UX Designer', dates: 'Mar 2025 – Oct 2025 · 8 mos', href: 'https://kosmodehealth.com/' },
              {
                title: 'Business Development Intern',
                dates: 'Feb 2025 – Mar 2025 · 2 mos',
                testimonial: {
                  label: 'Testimonial by Florence Leong, Founder & Director',
                  href: `${BASE}testimonials/Kosmode_Testimonial_Jordan_Low.pdf`,
                },
              },
            ],
          },
          {
            org: 'MDS-Plus',
            roles: [
              {
                title: 'Mechanical Designer Intern',
                dates: 'Nov 2024 – Feb 2025 · 4 mos',
                location: '79 Ayer Rajah Crescent',
                testimonial: {
                  label: 'Testimonial by Lim Eng Seng, Founder & Principal Engineer',
                  href: `${BASE}testimonials/MDesign_Testimonial_Jordan_Low.pdf`,
                },
              },
            ],
          },
          {
            org: 'Singapore Army',
            roles: [
              { title: 'Combat Medic', dates: 'Jan 2023 – Nov 2024 · 1 yr 11 mos', location: 'Nee Soon Camp' },
            ],
          },
          {
            org: 'Raven Parthenon Education',
            roles: [
              { title: 'Olympiad Tutor', dates: 'Oct 2022 – Jan 2023 · 4 mos' },
            ],
          },
          {
            org: 'National University of Singapore',
            roles: [
              { title: 'Nanofabrication Intern', dates: 'May 2022 – Sep 2022 · 5 mos', location: 'E6 Nanofab' },
            ],
          },
          {
            org: 'Nanyang Technological University Singapore',
            meta: '2 yrs 11 mos',
            roles: [
              { title: 'Machine Learning Intern', dates: 'Apr 2021 – Jan 2022 · 10 mos', location: 'Centre for Brain Computing Research' },
              { title: 'Engineering Intern', dates: 'Mar 2019 – Mar 2020 · 1 yr 1 mo', location: 'Plasma Engineering and Applied Research Laboratory' },
            ],
          },
          {
            org: 'Minmed Group Pte Ltd',
            roles: [
              { title: 'Clinical Assistant', dates: 'Nov 2021 – Dec 2021 · 2 mos', location: 'JEM' },
            ],
          },
          {
            org: 'Sport Singapore',
            roles: [
              { title: 'Lifeguard', dates: 'Jan 2019 – Jan 2020 · 1 yr 1 mo', location: 'Tampines Swimming Complex' },
            ],
          },
        ],
      },
      {
        heading: 'Leadership & Community',
        span: 3,
        entries: [
          { title: 'Founder of KneedIt' },
          { title: 'Project Director of E-Scholars Senior-Teach-Junior Programme' },
          { title: 'Aquila House Committee & Programmes Committee', meta: 'Residential College 4 (RC4)' },
          { title: 'Vice Head of RC4 Tea' },
          { title: 'Treasurer of RC4 Bakes' },
          { title: 'Orientation Group Leader at BME Camp' },
          { title: "Overall I/C, Project i'mPAC", meta: '2021 – 2022', note: 'Led humanitarian relief for Cambodian students and raised $3,400' },
          { title: 'Team Lead at Lions Befrienders', meta: '2021' },
          { title: 'Volunteer at NUS Toddycats (nature conservation)', meta: '2024 – 2025' },
          { title: 'Volunteer at Active Aging Advocates', meta: '2023' },
          { title: 'Volunteer at Ling Kwang Home & All Saints Home', meta: '2022' },
          { title: 'Volunteer at Fei Yue', meta: '2024 – 2025' },
          { title: 'Student Volunteer at SHINE Children & Youth Services', meta: '2021' },
        ],
      },
    ],
  },
];
