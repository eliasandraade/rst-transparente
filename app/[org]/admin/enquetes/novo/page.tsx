import { BarChart2 } from "lucide-react";
import EnqueteForm from "@/components/admin/EnqueteForm";

export default function NovaEnquetePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nova Enquete</h1>
          <p className="text-sm text-muted-foreground">Crie uma nova enquete para os condôminos</p>
        </div>
      </div>

      <div className="card">
        <EnqueteForm />
      </div>
    </div>
  );
}
