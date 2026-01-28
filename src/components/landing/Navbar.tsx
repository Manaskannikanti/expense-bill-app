import { Button } from "@/components/ui/button";
import { Menu, Receipt, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const scrollToId = (id: string) => {
    const doScroll = () => {
      const el = document.getElementById(id);
      if (!el) return;

      // account for fixed navbar height
      const navOffset = 90;
      const y = el.getBoundingClientRect().top + window.scrollY - navOffset;

      window.scrollTo({ top: y, behavior: "smooth" });
    };

    // If not on homepage, go home first then scroll
    if (location.pathname !== "/") {
      navigate("/");
      // wait for DOM to render Index sections
      setTimeout(doScroll, 200);
    } else {
      doScroll();
    }

    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/25">
            <Receipt className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold">ExpenseFlow</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-8 md:flex">
          <button
            type="button"
            onClick={() => scrollToId("features")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </button>

          <button
            type="button"
            onClick={() => scrollToId("how-it-works")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </button>

          <button
            type="button"
            onClick={() => scrollToId("pricing")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Pricing
          </button>

          <button
            type="button"
            onClick={() => scrollToId("about")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            About
          </button>
        </div>

        {/* Auth buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Button asChild variant="ghost">
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild className="gradient-primary shadow-lg shadow-primary/25">
            <Link to="/auth?mode=signup">Get Started</Link>
          </Button>
        </div>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="border-t bg-background px-4 py-6 md:hidden">
          <div className="flex flex-col gap-4">
            <button
              type="button"
              className="text-left text-sm font-medium text-muted-foreground"
              onClick={() => scrollToId("features")}
            >
              Features
            </button>

            <button
              type="button"
              className="text-left text-sm font-medium text-muted-foreground"
              onClick={() => scrollToId("how-it-works")}
            >
              How it works
            </button>

            <button
              type="button"
              className="text-left text-sm font-medium text-muted-foreground"
              onClick={() => scrollToId("pricing")}
            >
              Pricing
            </button>

            <button
              type="button"
              className="text-left text-sm font-medium text-muted-foreground"
              onClick={() => scrollToId("about")}
            >
              About
            </button>

            <hr className="my-2" />

            <Button asChild variant="outline" className="w-full">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                Sign In
              </Link>
            </Button>

            <Button asChild className="w-full gradient-primary">
              <Link to="/auth?mode=signup" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
