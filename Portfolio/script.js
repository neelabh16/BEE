const loadingScreen = document.getElementById("loadingScreen");
const loaderProgress = document.getElementById("loaderProgress");
const pageShell = document.getElementById("pageShell");
const nav = document.getElementById("nav");
const scrollProgress = document.getElementById("scrollProgress");
const navLinks = [...document.querySelectorAll(".nav-links a")];
const sections = [...document.querySelectorAll("[data-section]")];
const counters = [...document.querySelectorAll("[data-count]")];

let loaderValue = 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const bootSequence = () => {
  const interval = setInterval(() => {
    loaderValue += Math.floor(Math.random() * 9) + 5;
    loaderProgress.style.width = `${clamp(loaderValue, 0, 100)}%`;

    if (loaderValue >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.classList.add("done");
        pageShell.classList.add("visible");
      }, 520);
    }
  }, 145);
};

const updateScrollState = () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

  scrollProgress.style.width = `${progress}%`;
  nav.classList.toggle("scrolled", scrollTop > 64);
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.18 });

document.querySelectorAll(".reveal").forEach((item) => revealObserver.observe(item));

const animateCounter = (counter) => {
  const target = Number(counter.dataset.count);
  const duration = 1400;
  const start = performance.now();

  const tick = (now) => {
    const progress = clamp((now - start) / duration, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    counter.textContent = `${Math.round(target * eased)}+`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.55 });

counters.forEach((counter) => counterObserver.observe(counter));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, {
  rootMargin: "-45% 0px -45% 0px",
  threshold: 0
});

sections.forEach((section) => sectionObserver.observe(section));

const contactForm = document.querySelector(".contact-console");

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("button");
  const status = form.querySelector("[data-status]");
  const fields = form.querySelectorAll("input, textarea");
  const originalText = button.textContent;

  button.disabled = true;
  fields.forEach((field) => (field.disabled = true));
  button.textContent = "Transmitting...";
  status.hidden = true;

  try {
    const response = await fetch(form.action.replace("formsubmit.co/", "formsubmit.co/ajax/"), {
      method: "POST",
      headers: { Accept: "application/json" },
      body: new FormData(form),
    });

    if (!response.ok) throw new Error("Request failed");

    button.textContent = "Transmission Sent";
    button.style.boxShadow = "0 0 42px rgba(0, 229, 255, 0.32)";
    status.textContent = "Transmission sent. I'll get back to you soon.";
    status.classList.remove("form-status-error");
    status.hidden = false;
    form.reset();
  } catch (error) {
    button.textContent = "Send Failed";
    status.textContent = "Something went wrong. Please email me directly instead.";
    status.classList.add("form-status-error");
    status.hidden = false;
  } finally {
    setTimeout(() => {
      button.disabled = false;
      fields.forEach((field) => (field.disabled = false));
      button.textContent = originalText;
      button.style.boxShadow = "";
    }, 2200);
  }
});

window.addEventListener("scroll", updateScrollState, { passive: true });
window.addEventListener("load", bootSequence);
updateScrollState();
