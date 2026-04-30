import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const SectionCard = ({ title, icon, action, children }: { title: string; icon?: ReactNode; action?: ReactNode; children: ReactNode }) => (
  <Card className="shadow-soft">
    <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
      <CardTitle className="font-display text-xl flex items-center gap-2">{icon}{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
