import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { motion } from "framer-motion";
import dashboardPreview from "../../SVGS/pantry-pal Dashboard.svg";
import pantryPalLogo from "../../SVGS/pantry-pal-logo.svg";

interface LandingPageProps {
  onLogin: () => void;
  onSignUp: () => void;
}

const HEADLINE_WORDS = ["pantry", "recipes", "planning", "routine"];

const TOOLKIT = [
  {
    title: "Set Up Fast",
    icon: "spark",
    text: "Add staple items, scan what is already in the kitchen, and build a usable pantry list in minutes.",
  },
  {
    title: "Plan with Clarity",
    icon: "calendar",
    text: "Turn ingredients, recipes, and grocery needs into a weekly plan that feels calm instead of chaotic.",
  },
  {
    title: "Cook with Confidence",
    icon: "message",
    text: "Get practical recipe ideas based on what is on hand so fewer ingredients go unused at the back of the shelf.",
  },
];

const FEATURES = [
  {
    title: "Pantry Tracking",
    icon: "fridge",
    text: "Keep ingredients, quantities, and expiry dates in one simple view.",
  },
  {
    title: "Recipe Matching",
    icon: "recipe",
    text: "Turn what is already at home into recipe suggestions people can actually use.",
  },
  {
    title: "Meal Plans",
    icon: "calendar",
    text: "Map breakfast, lunch, dinner, and prep in one weekly routine.",
  },
  {
    title: "Household Sharing",
    icon: "users",
    text: "Let families and roommates keep lists and pantry updates aligned.",
  },
];

const INTEGRATIONS = [
  {
    title: "Meal Planning",
    icon: "calendar",
    text: "Build a weekly plan around what is already in your kitchen so meals, prep, and grocery decisions stay easy to follow.",
  },
  {
    title: "Receipt Import",
    icon: "receipt",
    text: "Pull recent grocery purchases into PantryPal so your inventory stays current after every shop.",
  },
  {
    title: "Shopping List Sync",
    icon: "cart",
    text: "Keep shared shopping lists in one place so everyone in the household knows what still needs to be picked up.",
  },
  {
    title: "Calendar Reminders",
    icon: "clock",
    text: "Stay on track with prep reminders, grocery days, and meal-plan prompts throughout the week.",
  },
];

const RESOURCES = [
  {
    title: "Pantry Organization Guide",
    icon: "book",
    text: "Learn how to organize staples, reduce duplicate purchases, and keep ingredients easier to use.",
  },
  {
    title: "Weekly Meal Planning Tips",
    icon: "clipboard",
    text: "Build a simple routine for breakfast, lunch, dinner, and leftovers without overplanning your week.",
  },
  {
    title: "Getting Started with PantryPal",
    icon: "download",
    text: "See how to set up your pantry, invite your household, and start getting smarter recipe suggestions right away.",
  },
];

const FAQS = [
  {
    question: "What can I do with PantryPal?",
    answer:
      "PantryPal helps you track ingredients, plan meals, build grocery lists, and find recipes based on what you already have at home.",
  },
  {
    question: "Can I use PantryPal with my family or roommates?",
    answer:
      "Yes. Pantry updates, shopping lists, and meal plans are designed to be easier to manage across a shared household.",
  },
  {
    question: "How does PantryPal help reduce food waste?",
    answer:
      "By showing what is already available, surfacing ingredients nearing expiry, and suggesting recipes that use them before they are forgotten.",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "PantryPal helps me plan meals around what I already have, and that alone has made grocery shopping feel calmer and much more intentional.",
    author: "Jenny Chan",
    company: "Student",
    image:
      "https://images.pexels.com/photos/1066134/pexels-photo-1066134.jpeg?cs=srgb&dl=pexels-minan1398-1066134.jpg&fm=jpg",
  },
  {
    quote:
      "I love that it turns pantry ingredients into actual dinner ideas. It feels practical, clear, and built around how people really cook at home.",
    author: "Jordan Mensah",
    company: "Working Professional",
    image:
      "https://images.pexels.com/photos/7428657/pexels-photo-7428657.jpeg?cs=srgb&dl=pexels-august-de-richelieu-7428657.jpg&fm=jpg",
  },
  {
    quote:
      "The weekly planning flow makes it easier to waste less food and still know what everyone in the house can eat during the week.",
    author: "Gillian Roberts",
    company: "Content Creator",
    image:
      "https://images.pexels.com/photos/6593585/pexels-photo-6593585.jpeg?cs=srgb&dl=pexels-shvetsa-6593585.jpg&fm=jpg",
  },
  {
    quote:
      "I like trying dishes from different cultures, and PantryPal makes it easier to turn what I already have into something new, exciting, and worth sharing.",
    author: "Vineeth Kaur",
    company: "Foodie",
    image:
      "https://images.pexels.com/photos/18036890/pexels-photo-18036890.jpeg?cs=srgb&dl=pexels-theamritdev-18036890.jpg&fm=jpg",
  },
];

function IconGlyph({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: "1.8",
  };

  switch (name) {
    case "spark":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 3v4" />
          <path {...common} d="M12 17v4" />
          <path {...common} d="M3 12h4" />
          <path {...common} d="M17 12h4" />
          <path {...common} d="m6.5 6.5 2.8 2.8" />
          <path {...common} d="m14.7 14.7 2.8 2.8" />
          <path {...common} d="m17.5 6.5-2.8 2.8" />
          <path {...common} d="m9.3 14.7-2.8 2.8" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="3.5" y="5.5" width="17" height="15" rx="3" />
          <path {...common} d="M8 3.5v4" />
          <path {...common} d="M16 3.5v4" />
          <path {...common} d="M3.5 10.5h17" />
          <path {...common} d="M8 14h3" />
          <path {...common} d="M13 14h3" />
          <path {...common} d="M8 17h3" />
        </svg>
      );
    case "message":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M6 18.5h8l4 2v-2a4.8 4.8 0 0 0 3-4.4V8.5a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v5a5 5 0 0 0 5 5Z" />
          <path {...common} d="M8 9.5h8" />
          <path {...common} d="M8 13h5" />
        </svg>
      );
    case "fridge":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="6" y="3.5" width="12" height="17" rx="3" />
          <path {...common} d="M6 11.5h12" />
          <path {...common} d="M9 7.5h.01" />
          <path {...common} d="M9 15.5h.01" />
          <path {...common} d="M12 20.5v-2" />
        </svg>
      );
    case "recipe":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M7 4.5h10a3 3 0 0 1 3 3v11a1 1 0 0 1-1.6.8L16 17.5H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Z" />
          <path {...common} d="M8 9.5h8" />
          <path {...common} d="M8 13h6" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M8.5 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path {...common} d="M16.5 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          <path {...common} d="M3.5 19a5 5 0 0 1 10 0" />
          <path {...common} d="M13.5 19a4 4 0 0 1 7 0" />
        </svg>
      );
    case "monitor":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="3.5" y="4.5" width="17" height="11" rx="2.5" />
          <path {...common} d="M8.5 19.5h7" />
          <path {...common} d="M12 15.5v4" />
        </svg>
      );
    case "barcode":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M5 5v14" />
          <path {...common} d="M8 5v14" />
          <path {...common} d="M11 5v14" />
          <path {...common} d="M14 8v11" />
          <path {...common} d="M17 5v14" />
          <path {...common} d="M20 8v11" />
        </svg>
      );
    case "receipt":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M7 4.5h10v15l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3v-15Z" />
          <path {...common} d="M9 9h6" />
          <path {...common} d="M9 12.5h6" />
          <path {...common} d="M9 16h4" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="10" cy="19" r="1.5" />
          <circle {...common} cx="17" cy="19" r="1.5" />
          <path {...common} d="M3.5 5h2l2.2 8.5h9.8l2-6.5H7" />
        </svg>
      );
    case "clock":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M12 7.5v5l3 2" />
        </svg>
      );
    case "image":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="4" y="5" width="16" height="14" rx="3" />
          <path {...common} d="m8 15 2.5-2.5L14 16l2.5-2.5L20 17" />
          <circle {...common} cx="9" cy="9" r="1.2" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M6 5.5h11a2 2 0 0 1 2 2v10H8a2 2 0 0 0-2 2Z" />
          <path {...common} d="M6 5.5a2 2 0 0 0-2 2v11.5h11" />
        </svg>
      );
    case "clipboard":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect {...common} x="6" y="4.5" width="12" height="16" rx="3" />
          <path {...common} d="M9 4.5h6v3H9z" />
          <path {...common} d="M9 11h6" />
          <path {...common} d="M9 15h4" />
        </svg>
      );
    case "download":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path {...common} d="M12 4.5v10" />
          <path {...common} d="m8.5 11 3.5 3.5 3.5-3.5" />
          <path {...common} d="M5 18.5h14" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle {...common} cx="12" cy="12" r="8.5" />
          <path {...common} d="M12 8v4l2.5 2.5" />
        </svg>
      );
  }
}

function PlaceholderIcon({ icon }: { icon: string }) {
  return (
    <div className="lp-placeholder-icon" aria-hidden="true">
      <IconGlyph name={icon} />
    </div>
  );
}

function FadeIn({
  children,
  className = "",
  delay = 0,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}) {
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.58, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

export function LandingPage({ onLogin, onSignUp }: LandingPageProps) {
  const heroRef = useRef<HTMLElement | null>(null);
  const rotatingWordRef = useRef<HTMLSpanElement | null>(null);
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-topbar]", { opacity: 0, y: 18, duration: 0.45 })
        .from("[data-hero-left]", { opacity: 0, y: 28, duration: 0.65 }, "-=0.1")
        .from("[data-hero-right]", { opacity: 0, y: 22, scale: 0.985, duration: 0.7 }, "-=0.35");
    }, heroRef);

    return () => context.revert();
  }, []);

  useEffect(() => {
    if (!rotatingWordRef.current) return undefined;

    gsap.fromTo(
      rotatingWordRef.current,
      { opacity: 0, y: 18, filter: "blur(6px)" },
      { opacity: 1, y: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" },
    );

    return undefined;
  }, [headlineIndex]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (!rotatingWordRef.current) return;

      gsap.to(rotatingWordRef.current, {
        opacity: 0,
        y: -18,
        filter: "blur(6px)",
        duration: 0.24,
        ease: "power2.in",
        onComplete: () => setHeadlineIndex((current) => (current + 1) % HEADLINE_WORDS.length),
      });
    }, 2600);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setActiveTestimonial((current) => (current + 1) % TESTIMONIALS.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  const scrollToId = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f7f2] text-[#10120f]">
      <header ref={heroRef} className="fixed inset-x-0 top-0 z-40 w-full border-b border-[#e8eaec] bg-[#f8f7f2]">
        <div
          data-topbar
          className="mx-auto flex w-full max-w-screen-2xl items-center justify-between px-4 py-4 sm:px-5 lg:px-7"
        >
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="flex items-center gap-1.5 text-base font-bold tracking-[0.04em] text-[#10120f]"
          >
            <img src={pantryPalLogo} alt="PantryPal logo" className="block h-6 w-6 rounded-full object-contain" />
            <span className="inline-flex items-center leading-none">PantryPal</span>
          </button>

          <button
            type="button"
            onClick={onSignUp}
            className="inline-flex items-center justify-center rounded-full bg-[#10120f] px-5 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:text-white"
          >
            Get Started
          </button>
        </div>
      </header>

      <main
        id="top"
        className="mx-auto flex w-full max-w-screen-2xl flex-col gap-24 px-4 pb-24 pt-28 sm:px-5 lg:px-7"
      >
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-6">
          <div data-hero-left className="max-w-xl">
            <p className="lp-eyebrow">Smart kitchen tools for modern homes</p>
            <h1 className="display-font mt-5 text-[clamp(3.15rem,7vw,6.1rem)] leading-[0.95] tracking-[-0.06em] text-[#10120f]">
              Smart food tools
              <br />
              for your
              <br />
              <span ref={rotatingWordRef} className="lp-rotating-word text-[#00c755]">
                {HEADLINE_WORDS[headlineIndex]}
              </span>
              .
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-[#5f645c]">
              PantryPal keeps your pantry, recipes, grocery lists, and weekly meal plans in sync so cooking at home feels easier every day.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onSignUp}
                className="inline-flex items-center justify-center rounded-full bg-[#10120f] px-6 py-3.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:text-white sm:min-w-[210px]"
              >
                Join Now
              </button>
              <button
                type="button"
                onClick={onLogin}
                className="inline-flex items-center justify-center rounded-full border border-[#e8eaec] bg-white px-6 py-3.5 text-sm font-semibold text-[#32352f] transition hover:border-[#10120f] sm:min-w-[210px]"
              >
                Explore Features
              </button>
            </div>
          </div>

          <div data-hero-right className="self-start rounded-[40px] border border-[#e4e8db] bg-white p-4">
            <div className="overflow-hidden rounded-[32px] bg-[#10120f]">
              <video
                className="block aspect-[5/4] w-full object-cover lg:aspect-square"
                autoPlay
                loop
                muted
                playsInline
                preload="metadata"
              >
                <source src="https://www.pexels.com/download/video/5608629/" type="video/mp4" />
              </video>
            </div>
          </div>
        </section>

        <FadeIn id="toolkit" className="text-center">
          <p className="lp-eyebrow justify-center">Everything in one place</p>
          <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-[#10120f] sm:text-5xl">
            A kitchen companion built for real weekly routines.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#5f645c]">
            PantryPal helps households stay on top of ingredients, grocery trips, and dinner decisions without adding more friction to the week.
          </p>

          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {TOOLKIT.map((item) => (
              <motion.article
                key={item.title}
                whileHover={{ y: -8 }}
                transition={{ duration: 0.22 }}
                className="rounded-[30px] border border-[#e8eaec] bg-white p-7 text-left"
              >
                <PlaceholderIcon icon={item.icon} />
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-[#10120f]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#5f645c]">{item.text}</p>
              </motion.article>
            ))}
          </div>
        </FadeIn>

        <section id="features" className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <FadeIn className="rounded-[36px] border border-[#e8eaec] bg-white p-8">
            <p className="lp-eyebrow">Built for everyday cooking</p>
            <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-[#10120f] sm:text-5xl">
              The tools you need to shop smarter and cook with what you have.
            </h2>

            <div className="mt-8 space-y-4">
              {FEATURES.map((item) => (
                <div key={item.title} className="rounded-[24px] bg-[#dce9dd] p-5">
                  <div className="flex items-start gap-4">
                    <PlaceholderIcon icon={item.icon} />
                    <div>
                      <h3 className="text-xl font-semibold tracking-[-0.04em] text-[#10120f]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-[#5f645c]">{item.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={0.08} className="rounded-[36px] bg-[#10120f] p-5 text-white">
            <div className="flex h-full min-h-[560px] flex-col rounded-[30px] border border-white/10 bg-white/4 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.04em] text-white/45">PantryPal Dashboard</p>
                  <h3 className="mt-3 max-w-xl text-3xl font-semibold tracking-[-0.05em]">
                    See your pantry, recipes, and plan for the week from one clear home base.
                  </h3>
                </div>
                <PlaceholderIcon icon="monitor" />
              </div>

              <div className="mt-8 flex flex-1">
                <div className="w-full overflow-hidden rounded-[28px] border border-white/14 bg-white/3">
                  <div className="border-b border-white/10 px-5 py-3 text-sm text-white/55">
                    Pantry Overview
                  </div>
                  <div className="bg-white p-0">
                    <img
                      src={dashboardPreview}
                      alt="PantryPal dashboard preview"
                      className="block w-full h-auto"
                    />
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </section>

        <FadeIn className="lp-testimonial-spotlight overflow-hidden rounded-[36px] bg-[#10120f]">
          <div className="grid min-h-[380px] lg:grid-cols-[1.35fr_0.65fr]">
            <div className="flex flex-col justify-center px-8 py-8 text-white sm:px-12 sm:py-10 lg:px-16">
              <div className="mx-auto grid w-full max-w-[640px] flex-1 grid-rows-[1fr_auto_auto] items-center text-center">
                <motion.div
                  key={`quote-${activeTestimonial}`}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="flex min-h-[165px] items-center justify-center sm:min-h-[190px]"
                >
                  <p className="text-[clamp(1.35rem,2.6vw,2.2rem)] font-medium leading-[1.4] tracking-[-0.04em] text-white">
                    “{TESTIMONIALS[activeTestimonial].quote}”
                  </p>
                </motion.div>

                <motion.div
                  key={`meta-${activeTestimonial}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
                  className="mt-8 min-h-[28px]"
                >
                  <p className="whitespace-nowrap text-[clamp(0.92rem,1.05vw,1.08rem)] font-medium text-[#747b87]">
                    {TESTIMONIALS[activeTestimonial].author}, {TESTIMONIALS[activeTestimonial].company}
                  </p>
                </motion.div>

                <div className="mt-7 flex h-3 items-center justify-center gap-3">
                  {TESTIMONIALS.map((item, index) => (
                    <button
                      key={item.author}
                      aria-label={`Show testimonial ${index + 1}`}
                      className={`lp-testimonial-dot ${index === activeTestimonial ? "is-active" : ""}`}
                      onClick={() => setActiveTestimonial(index)}
                      type="button"
                    />
                  ))}
                </div>
              </div>
            </div>

            <motion.div
              key={`image-${activeTestimonial}`}
              initial={{ opacity: 0.9, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative min-h-[280px] lg:min-h-full"
            >
              <img
                alt={TESTIMONIALS[activeTestimonial].author}
                className="block h-full w-full object-cover"
                src={TESTIMONIALS[activeTestimonial].image}
              />
            </motion.div>
          </div>
        </FadeIn>

        <FadeIn className="text-center">
          <p className="lp-eyebrow justify-center">Integrations That Matter</p>
          <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-[#10120f] sm:text-5xl">
            Helpful connections for the way people already shop.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[#5f645c]">
            Bring purchases, reminders, and shared lists together so your pantry stays current without constant manual updates.
          </p>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {INTEGRATIONS.map((item) => (
              <div key={item.title} className="min-h-[250px] rounded-[30px] border border-[#e8eaec] bg-white p-6 text-left">
                <PlaceholderIcon icon={item.icon} />
                <h3 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-[#10120f]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#5f645c]">{item.text}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <section id="support" className="grid gap-6 lg:grid-cols-[1fr_0.92fr]">
          <FadeIn className="rounded-[36px] bg-[#10120f] p-6 text-white">
            <p className="lp-eyebrow !text-[#d7dbd1]">Support when you need it</p>
            <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-white sm:text-5xl">
              Guidance that makes daily cooking easier.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-white/72">
              PantryPal is designed to feel useful from day one, with simple setup, shared-household tools, and recipe guidance that stays practical.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold tracking-[0.04em] text-white/45">Easy Onboarding</p>
                <p className="mt-3 text-base leading-7 text-white/72">
                  Get started with pantry setup, category organization, and list sharing without a steep learning curve.
                </p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-semibold tracking-[0.04em] text-white/45">Smarter Suggestions</p>
                <p className="mt-3 text-base leading-7 text-white/72">
                  Get recipe ideas and planning prompts that reflect what your household can actually cook this week.
                </p>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={0.08} className="rounded-[36px] border border-[#e8eaec] bg-white p-5">
            <div className="flex h-full min-h-[430px] flex-col justify-between rounded-[30px] bg-[#dce9dd] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold tracking-[0.04em] text-[#7d8277]">Household-Friendly Design</p>
                  <p className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-[#10120f]">
                    PantryPal keeps shared kitchens more organized with simple views everyone can understand.
                  </p>
                </div>
                <PlaceholderIcon icon="image" />
              </div>

              <div className="mt-8 rounded-[28px] border border-[#e8eaec] bg-white px-5 py-20 text-center text-sm text-[#777d73]">
                Family dashboard or onboarding preview
              </div>
            </div>
          </FadeIn>
        </section>

        <section id="resources" className="grid gap-6 lg:grid-cols-[1.04fr_0.96fr]">
          <FadeIn className="rounded-[36px] border border-[#e8eaec] bg-white p-8">
            <p className="lp-eyebrow">Tips to help you start strong</p>
            <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-[#10120f] sm:text-5xl">
              Useful resources for better pantry habits.
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5f645c]">
              Explore quick guides and planning ideas that help households cook more intentionally and waste less over time.
            </p>

            <div className="mt-8 grid gap-4">
              {RESOURCES.map((item) => (
                <motion.article
                  key={item.title}
                  whileHover={{ x: 6 }}
                  transition={{ duration: 0.2 }}
                  className="rounded-[26px] bg-[#dce9dd] p-6"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-2xl font-semibold tracking-[-0.04em] text-[#10120f]">{item.title}</h3>
                    <PlaceholderIcon icon={item.icon} />
                  </div>
                  <p className="mt-4 text-sm leading-7 text-[#5f645c]">{item.text}</p>
                </motion.article>
              ))}
            </div>
          </FadeIn>

          <FadeIn id="faq" delay={0.08} className="rounded-[36px] bg-[#10120f] p-8 text-white">
            <p className="lp-eyebrow !text-[#d7dbd1]">Common Questions</p>
            <h2 className="display-font mt-4 text-4xl tracking-[-0.05em] text-white sm:text-5xl">
              Answers for people getting started.
            </h2>

            <div className="mt-8 space-y-3">
              {FAQS.map((item) => (
                <details key={item.question} className="lp-faq-item">
                  <summary>{item.question}</summary>
                  <p>{item.answer}</p>
                </details>
              ))}
            </div>
          </FadeIn>
        </section>

        <FadeIn id="cta" className="rounded-[40px] bg-[#10120f] px-6 py-14 text-center text-white sm:px-10">
          <p className="lp-eyebrow justify-center !text-[#d7dbd1]">Get started with ease</p>
          <h2 className="display-font mx-auto mt-4 max-w-4xl text-4xl tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
            Bring more calm to your kitchen with PantryPal.
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-white/72">
            Keep ingredients visible, make meal planning simpler, and give your household one place to stay organized through the week.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={onSignUp}
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-[#10120f] transition hover:-translate-y-0.5"
            >
              Join the Waitlist
            </button>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center justify-center rounded-full border border-white/14 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:text-white"
            >
              Explore Features
            </button>
          </div>
        </FadeIn>

      </main>

      <footer className="bg-[#10120f] px-4 py-8 text-white sm:px-5 lg:px-7">
        <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={() => scrollToId("top")}
            className="flex items-center gap-1.5 text-left text-base font-bold tracking-[0.04em] text-white"
          >
            <img src={pantryPalLogo} alt="PantryPal logo" className="block h-6 w-6 rounded-full object-contain" />
            <span className="inline-flex items-center leading-none">PantryPal</span>
          </button>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium text-white/72">
            <button type="button" className="transition hover:text-white" onClick={() => scrollToId("toolkit")}>
              Toolkit
            </button>
            <button type="button" className="transition hover:text-white" onClick={() => scrollToId("features")}>
              Features
            </button>
            <button type="button" className="transition hover:text-white" onClick={() => scrollToId("support")}>
              Support
            </button>
            <button type="button" className="transition hover:text-white" onClick={() => scrollToId("faq")}>
              FAQ
            </button>
          </nav>
        </div>
      </footer>
    </div>
  );
}
