import { Shield } from "lucide-react";

export default function Footer() {
  const ano = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" aria-hidden="true" />
            <span>
              Condomínio Residencial Santíssima Trindade — Portal da
              Transparência
            </span>
          </div>
          <div className="text-center sm:text-right">
            <span>© {ano}. Informações publicadas pelo Conselho Fiscal.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
