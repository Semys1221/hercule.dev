"use client";

import { Edges, Html, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group } from "three";

import { TEAM_IMAGE_PRESET } from "@/lib/admin/funnels/team-image-preset";
import type { Audience } from "@/lib/admin/navigation";
import { cn } from "@/lib/utils";

import { CompanyOriginTimeline } from "./company-origin-timeline";

type SalesPitchOriginSceneProps = {
  audience: Audience;
  className?: string;
};

function LegacyStack2018() {
  return (
    <group position={[-1.8, 0, 0]}>
      {[0, 0.55, 1.1].map((y) => (
        <mesh key={y} position={[0, y - 0.55, 0]}>
          <boxGeometry args={[1.1, 0.45, 0.7]} />
          <meshStandardMaterial color="#52525b" wireframe transparent opacity={0.55} />
          <Edges color="#a1a1aa" threshold={15} />
        </mesh>
      ))}
      <Html center position={[0, -1.35, 0]} distanceFactor={6}>
        <div className="pointer-events-none whitespace-nowrap text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            2018
          </p>
          <p className="text-xs text-foreground">Outil interne backend</p>
        </div>
      </Html>
    </group>
  );
}

function FoundationSystem2026({ reducedMotion }: { reducedMotion: boolean }) {
  const groupRef = useRef<Group>(null);

  useFrame((state) => {
    if (reducedMotion || !groupRef.current) {
      return;
    }
    groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.35) * 0.12;
  });

  return (
    <group ref={groupRef} position={[1.8, 0, 0]}>
      <RoundedBox args={[1.35, 0.95, 0.18]} radius={0.06} smoothness={4} position={[0, 0.35, 0]}>
        <meshStandardMaterial color="#fafafa" emissive="#71717a" emissiveIntensity={0.18} />
      </RoundedBox>
      <RoundedBox args={[1.35, 0.55, 0.18]} radius={0.05} smoothness={4} position={[0, -0.35, 0]}>
        <meshStandardMaterial color="#e4e4e7" emissive="#52525b" emissiveIntensity={0.12} />
      </RoundedBox>
      <mesh position={[0.55, 0.35, 0.12]}>
        <boxGeometry args={[0.18, 0.18, 0.04]} />
        <meshStandardMaterial color="#fafafa" emissive="#ffffff" emissiveIntensity={0.35} />
      </mesh>
      <Html center position={[0, -1.35, 0]} distanceFactor={6}>
        <div className="pointer-events-none whitespace-nowrap text-center">
          <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            2026
          </p>
          <p className="text-xs text-foreground">Hercule Foundation</p>
        </div>
      </Html>
    </group>
  );
}

function OriginSceneContent({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[4, 6, 5]} intensity={1.1} />
      <directionalLight position={[-4, 2, -3]} intensity={0.35} />
      <LegacyStack2018 />
      <FoundationSystem2026 reducedMotion={reducedMotion} />
    </>
  );
}

export function SalesPitchOriginScene({ audience, className }: SalesPitchOriginSceneProps) {
  const [webglSupported, setWebglSupported] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(media.matches);
    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);

    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl");
      setWebglSupported(Boolean(gl));
    } catch {
      setWebglSupported(false);
    }

    return () => media.removeEventListener("change", updateReducedMotion);
  }, []);

  if (!webglSupported) {
    return <CompanyOriginTimeline audience={audience} />;
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn(TEAM_IMAGE_PRESET.frameClass, "bg-card/40")}>
        <Canvas
          camera={{ position: [0, 0.4, 5.2], fov: 42 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: true }}
        >
          <OriginSceneContent reducedMotion={reducedMotion} />
        </Canvas>
      </div>
      <CompanyOriginTimeline audience={audience} />
    </div>
  );
}
