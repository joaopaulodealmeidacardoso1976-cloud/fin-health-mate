import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { calculateAge } from "@/lib/age";

interface Props {
  patientName: string;
  birthDate: string | null;
  allergies: string | null;
  risk: "low" | "medium" | "high" | null;
  nextAppointment: string | null;
  recordType: "medical" | "dental";
}

export const RecordHeader = ({ patientName, birthDate, allergies, risk, nextAppointment, recordType }: Props) => {
  const age = calculateAge(birthDate);
  const initials = patientName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="bg-card border border-border rounded-lg p-4 shadow-soft">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="h-14 w-14 rounded-full bg-gold-soft text-gold-deep flex items-center justify-center font-display text-xl shrink-0">
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-2xl truncate">{patientName}</h2>
          <p className="text-sm text-muted-foreground">
            {age !== null ? `${age} anos` : "Idade não informada"}
          </p>
        </div>
      </div>
    </div>
  );
};

      </div>
    </div>
  );
};
