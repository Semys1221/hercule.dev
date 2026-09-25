"use client"

import { HerculeMark } from "@/components/hercule-mark"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function HouseCrmPreview() {
  return (
    <Card className="overflow-hidden shadow-md">
      <CardHeader className="flex flex-row items-center gap-2 border-b border-border bg-muted/50 py-3">
        <HerculeMark className="size-4 text-foreground" />
        <CardTitle className="text-sm font-medium">Courtage — aperçu</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-0 p-0 md:grid-cols-3">
        <div className="border-b border-border p-4 md:border-b-0 md:border-r">
          <p className="text-xs text-muted-foreground">Projets attribués</p>
          <p className="mt-2 text-2xl font-medium">12</p>
        </div>
        <div className="border-b border-border p-4 md:border-b-0 md:border-r">
          <p className="text-xs text-muted-foreground">En qualification</p>
          <p className="mt-2 text-2xl font-medium">3</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-muted-foreground">Zone</p>
          <p className="mt-2 text-sm font-medium">Verrouillée</p>
        </div>
        <Separator className="col-span-full" />
        <div className="col-span-full p-4 text-sm text-muted-foreground">
          Marc L. · Reprise tenue · Honoraires validés · Attribution en cours
        </div>
      </CardContent>
    </Card>
  )
}
