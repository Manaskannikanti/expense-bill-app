<div className="hidden items-center gap-8 md:flex">
  <button
    onClick={() =>
      document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
    }
    className="text-sm font-medium text-muted-foreground hover:text-foreground"
  >
    Features
  </button>

  <button
    onClick={() =>
      document
        .getElementById("how-it-works")
        ?.scrollIntoView({ behavior: "smooth" })
    }
    className="text-sm font-medium text-muted-foreground hover:text-foreground"
  >
    How it works
  </button>

  <button
    onClick={() =>
      document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })
    }
    className="text-sm font-medium text-muted-foreground hover:text-foreground"
  >
    Pricing
  </button>

  <button
    onClick={() =>
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" })
    }
    className="text-sm font-medium text-muted-foreground hover:text-foreground"
  >
    About
  </button>
</div>
