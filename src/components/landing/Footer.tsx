import { Receipt } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-card px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Receipt className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold">ExpenseFlow</span>
          </div>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-8">
            <Link to="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </Link>
            <Link to="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link to="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              About
            </Link>
            <Link to="#" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Contact
            </Link>
          </nav>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ExpenseFlow. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
