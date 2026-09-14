"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  SESSION_MAPPING_FLOW_OBJECTIFS_LABEL,
  SESSION_MAPPING_FLOW_SYSTEM_LABEL,
} from "@/lib/admin/funnels/ui-copy";
import type { Audience } from "@/lib/admin/navigation";

import { SalesMappingFlow } from "./sales-mapping-flow";

type SalesMappingPanelProps = {
  audience: Audience;
};

export function SalesMappingPanel({ audience }: SalesMappingPanelProps) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <Alert>
        <AlertTitle>Documentation</AlertTitle>
        <AlertDescription>
          Aucune saisie — visualisation de l&apos;arbre conditionnel. Cliquez sur une carte pour
          voir le détail (prompt, options, conditions).
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="discovery" className="w-full">
        <TabsList>
          <TabsTrigger value="discovery">{SESSION_MAPPING_FLOW_OBJECTIFS_LABEL}</TabsTrigger>
          <TabsTrigger value="pitch">{SESSION_MAPPING_FLOW_SYSTEM_LABEL}</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="discovery" className="mt-4">
          <SalesMappingFlow flowId="discovery" audience={audience} />
        </TabsContent>

        <TabsContent value="pitch" className="mt-4">
          <SalesMappingFlow flowId="pitch" audience={audience} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <SalesMappingFlow flowId="dashboard" audience={audience} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
