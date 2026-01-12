import ProceduralGroundBackground from "@/components/ui/procedural-ground-background";

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white relative">
      <ProceduralGroundBackground />
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
