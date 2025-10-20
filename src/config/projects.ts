// Projects Configuration
// Easily customize your projects by updating this file

export interface ProjectItem {
  image: string;
  link: string;
  title: string;
  description: string;
}

export const projects: ProjectItem[] = [
  {
    image: "https://picsum.photos/800/800?random=1", // Replace with your project thumbnail URL
    link: "https://21st.dev/", // Replace with your project URL
    title: "Proyecto 1",
    description: "Descripción del primer proyecto destacado",
  },
  {
    image: "https://picsum.photos/800/800?random=2", // Replace with your project thumbnail URL
    link: "https://21st.dev/", // Replace with your project URL
    title: "Proyecto 2",
    description: "Descripción del segundo proyecto innovador",
  },
  {
    image: "https://picsum.photos/800/800?random=3", // Replace with your project thumbnail URL
    link: "https://21st.dev/", // Replace with your project URL
    title: "Proyecto 3",
    description: "Descripción del tercer proyecto revolucionario",
  },
  {
    image: "https://picsum.photos/800/800?random=4", // Replace with your project thumbnail URL
    link: "https://21st.dev/", // Replace with your project URL
    title: "Proyecto 4",
    description: "Descripción del cuarto proyecto de excelencia",
  },
];

// Instructions for customization:
// 1. Replace the image URLs with your actual project thumbnails
// 2. Update the links to point to your actual project URLs
// 3. Change the titles and descriptions to match your projects
// 4. Add or remove projects as needed
// 5. Recommended image size: 800x800px for best quality
