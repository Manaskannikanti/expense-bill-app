import { Button } from "@/components/ui/button";
import { Menu, Receipt, X } from "lucide-react";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id: string) => {
    const scroll = () => {
      const el = document.getElementById(id);
      if (!el) return false;

      const yOffset = 90; // navbar height
      const y =
        el.getBoundingClientRect().top + window.scrollY - yOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
      return true;
    };

    if (location.pathname !== "/") {
      navigate("/");

      // wait until DOM mounts (IMPORTANT)
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (scroll() || attempts > 20) clearInterval(interval);
      }, 50);
    } else {
      scroll();
    }

    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        {/* Logo */}
        <button
          onClick={() => scrollToSection("hero")}
          className="flex items-center gap-2"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold">ExpenseFlow</span>
        </button>

        {/* Desktop nav */}
        <div className="hidden md:flex gap-8">
          <button onClick={() => scrollToSection("features")}>Features</button>
          <button onClick={() => scrollToSection("how-it-works")}>
            How it works
          </button>
          <button onClick={() => scrollToSection("pricing")}>Pricing</button>
          <button onClick={() => scrollToSection("about")}>About</button>
        </div>

        {/* Auth */}
        <div className="hidden md:flex gap-3">
          <Button variant="ghost" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
          <Button
            className="gradient-primary"
            onClick={() => navigate("/auth?mode=signup")}
          >
            Get Started
          </Button>
        </div>

        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </Button>
      </nav>

      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t px-4 py-6 space-y-4">
          <button onClick={() => scrollToSection("features")}>Features</button>
          <button onClick={() => scrollToSection("how-it-works")}>
            How it works
          </button>
          <button onClick={() => scrollToSection("pricing")}>Pricing</button>
          <button onClick={() => scrollToSection("about")}>About</button>
        </div>
      )}
    </header>
  );
}
