"use client";

import type * as React from "react";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function CampaignTabs({
  settings,
  prizes,
  stats,
}: {
  settings: React.ReactNode;
  prizes: React.ReactNode;
  stats: React.ReactNode;
}) {
  return (
    <Tabs defaultValue="settings">
      <TabsList>
        <TabsTrigger value="settings">Settings</TabsTrigger>
        <TabsTrigger value="prizes">Prizes</TabsTrigger>
        <TabsTrigger value="stats">Stats</TabsTrigger>
      </TabsList>
      <TabsContent value="settings" className="pt-2">
        {settings}
      </TabsContent>
      <TabsContent value="prizes" className="pt-2">
        {prizes}
      </TabsContent>
      <TabsContent value="stats" className="pt-2">
        {stats}
      </TabsContent>
    </Tabs>
  );
}
