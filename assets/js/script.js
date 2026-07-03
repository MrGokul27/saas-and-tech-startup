document.addEventListener("DOMContentLoaded", () => {
  "use strict";

  // ==========================================
  // Empty / Hash Link → 404 Redirect
  // ==========================================
  const is404Page = window.location.pathname.endsWith("404.html");
  if (!is404Page) {
    const base404 = window.location.pathname.includes("/pages/")
      ? "404.html"
      : "pages/404.html";

    document.addEventListener("click", (e) => {
      const anchor = e.target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.trim() === "#" || href.trim() === "") {
        e.preventDefault();
        window.location.href = base404;
      }
    });
  }

  // ==========================================
  // Component Loader Utility
  // ==========================================
  const isSubpage =
    window.location.pathname.includes("/pages/") ||
    window.location.pathname.endsWith("about.html") ||
    window.location.pathname.endsWith("services.html") ||
    window.location.pathname.endsWith("pricing.html") ||
    window.location.pathname.endsWith("blog.html") ||
    window.location.pathname.endsWith("contact.html") ||
    window.location.pathname.endsWith("404.html");

  const adjustPaths = (htmlText) => {
    if (!isSubpage) return htmlText;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;

    tempDiv.querySelectorAll("[href]").forEach((el) => {
      const href = el.getAttribute("href");
      if (
        href &&
        !href.startsWith("http") &&
        !href.startsWith("#") &&
        !href.startsWith("mailto:") &&
        !href.startsWith("tel:")
      ) {
        if (
          href.startsWith("assets/") ||
          href.startsWith("pages/") ||
          href === "index.html"
        ) {
          el.setAttribute("href", "../" + href);
        }
      }
    });

    tempDiv.querySelectorAll("[src]").forEach((el) => {
      const src = el.getAttribute("src");
      if (src && !src.startsWith("http")) {
        if (
          src.startsWith("assets/") ||
          src.startsWith("images/") ||
          src.startsWith("js/")
        ) {
          el.setAttribute("src", "../" + src);
        }
      }
    });

    return tempDiv.innerHTML;
  };

  const loadComponent = (placeholderId, componentPath) => {
    const resolvedPath = isSubpage
      ? componentPath.replace("pages/", "")
      : componentPath;

    return fetch(resolvedPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(
            `Failed to load ${resolvedPath}: ${response.statusText}`,
          );
        }
        return response.text();
      })
      .then((data) => {
        const placeholder = document.getElementById(placeholderId);
        if (placeholder) {
          const adjustedData = adjustPaths(data);
          const tempWrapper = document.createElement("div");
          tempWrapper.innerHTML = adjustedData;

          const parent = placeholder.parentElement;
          if (parent) {
            while (tempWrapper.firstChild) {
              parent.insertBefore(tempWrapper.firstChild, placeholder);
            }
            placeholder.remove();
          } else {
            placeholder.outerHTML = adjustedData;
          }
        }
      })
      .catch((error) => {
        console.error("Component Loader Error:", error);
      });
  };

  // Always hide preloader after 2s regardless of component load status
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    setTimeout(() => {
      preloader.classList.add("hidden");
      setTimeout(() => (preloader.style.display = "none"), 500);
    }, 2000);
  }

  const hasHeader = document.getElementById("header-placeholder");
  const hasFooter = document.getElementById("footer-placeholder");

  if (hasHeader || hasFooter) {
    const promises = [];
    if (hasHeader)
      promises.push(
        loadComponent("header-placeholder", "pages/components/header.html"),
      );
    if (hasFooter)
      promises.push(
        loadComponent("footer-placeholder", "pages/components/footer.html"),
      );

    Promise.all(promises).then(() => {
      initInteractions();
    });
  } else {
    initInteractions();
  }

  // ==========================================
  // Page Interactions Initializer
  // ==========================================
  function initInteractions() {
    // Set active link highlight based on window location
    const currentPage =
      window.location.pathname.split("/").pop() || "index.html";
    const navigationLinks = document.querySelectorAll(".navigation li a");
    navigationLinks.forEach((link) => {
      const linkHref = link.getAttribute("href");
      if (linkHref) {
        const linkPage = linkHref.split("/").pop();
        if (linkPage === currentPage) {
          link.parentElement.classList.add("current");
        } else {
          link.parentElement.classList.remove("current");
        }
      }
    });

    // 1. Sticky Header Scroll Trigger
    const stickyHeader = document.querySelector(".sticky-header");
    if (stickyHeader) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 150) {
          stickyHeader.classList.add("sticky");
        } else {
          stickyHeader.classList.remove("sticky");
        }
      });
    }

    // 3. Mobile Navigation Menu Drawer
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileTogglers = document.querySelectorAll(".mobile-nav-toggler");
    const closeBtn = document.querySelector(".mobile-menu .close-btn");
    const menuBackdrop = document.querySelector(".mobile-menu .menu-backdrop");

    if (mobileMenu && mobileTogglers.length > 0) {
      const openMobileMenu = () => {
        mobileMenu.classList.add("open");
        document.body.style.overflow = "hidden";
      };

      const closeMobileMenu = () => {
        mobileMenu.classList.remove("open");
        document.body.style.overflow = "";
      };

      mobileTogglers.forEach((toggler) => {
        toggler.addEventListener("click", openMobileMenu);
      });
      if (closeBtn) closeBtn.addEventListener("click", closeMobileMenu);
      if (menuBackdrop) menuBackdrop.addEventListener("click", closeMobileMenu);

      // Close menu when clicking a link
      const mobileLinks = mobileMenu.querySelectorAll(".navigation li a");
      mobileLinks.forEach((link) => {
        link.addEventListener("click", closeMobileMenu);
      });
    }

    // 4. Mobile Menu Accordion Submenus
    const mobileDropdowns = document.querySelectorAll(
      ".mobile-menu .navigation li.dropdown",
    );
    mobileDropdowns.forEach((dropdown) => {
      const btn = dropdown.querySelector(".dropdown-btn");
      const submenu = dropdown.querySelector("ul");
      if (btn && submenu) {
        btn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();

          const isActive = dropdown.classList.contains("active");

          // Close other sibling dropdowns
          const siblings = dropdown.parentElement.children;
          for (let sibling of siblings) {
            if (
              sibling !== dropdown &&
              sibling.classList.contains("dropdown")
            ) {
              sibling.classList.remove("active");
              const siblingSub = sibling.querySelector("ul");
              if (siblingSub) siblingSub.style.display = "none";
            }
          }

          if (isActive) {
            dropdown.classList.remove("active");
            submenu.style.display = "none";
          } else {
            dropdown.classList.add("active");
            submenu.style.display = "block";
          }
        });
      }
    });

    // 5. Pricing Monthly / Yearly Plan Toggles
    const pricingSection = document.querySelector(".pricing-section");
    if (pricingSection) {
      const tabButtons = pricingSection.querySelectorAll(".tab-btn");
      const tabs = pricingSection.querySelectorAll(".tabs-content .tab");

      tabButtons.forEach((button) => {
        button.addEventListener("click", () => {
          const targetTabId = button.getAttribute("data-tab");
          const targetTab = pricingSection.querySelector(targetTabId);

          if (targetTab) {
            tabButtons.forEach((btn) => btn.classList.remove("active-btn"));
            tabs.forEach((tab) => tab.classList.remove("active-tab"));

            button.classList.add("active-btn");
            targetTab.classList.add("active-tab");
          }
        });
      });
    }

    // 6. Testimonial Carousel Slider
    const carousel = document.querySelector(".testimonial-carousel");
    if (carousel) {
      const track = carousel.querySelector(".owl-stage");
      const clonedSlides = carousel.querySelectorAll(".owl-item.cloned");
      clonedSlides.forEach((slide) =>
        slide.style.setProperty("display", "none", "important"),
      );

      const slides = Array.from(
        carousel.querySelectorAll(".owl-item:not(.cloned)"),
      );
      const dots = Array.from(carousel.querySelectorAll(".owl-dots .owl-dot"));
      const nextBtn = carousel.querySelector(".owl-next");
      const prevBtn = carousel.querySelector(".owl-prev");

      let currentIndex = 0;

      const updateSlider = (index) => {
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;
        currentIndex = index;

        const amountToTranslate = -currentIndex * 100;
        if (track) {
          track.style.transform = `translate3d(${amountToTranslate}%, 0px, 0px)`;
        }

        dots.forEach((dot, idx) => {
          if (idx === currentIndex) {
            dot.classList.add("active");
          } else {
            dot.classList.remove("active");
          }
        });
      };

      if (nextBtn) {
        nextBtn.addEventListener("click", () => {
          updateSlider(currentIndex + 1);
        });
      }
      if (prevBtn) {
        prevBtn.addEventListener("click", () => {
          updateSlider(currentIndex - 1);
        });
      }

      dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
          updateSlider(index);
        });
      });

      // Swipe Gestures
      let startX = 0;
      let isDragging = false;

      carousel.addEventListener(
        "touchstart",
        (e) => {
          startX = e.touches[0].clientX;
          isDragging = true;
        },
        { passive: true },
      );

      carousel.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        const endX = e.changedTouches[0].clientX;
        const diffX = startX - endX;

        if (Math.abs(diffX) > 50) {
          if (diffX > 0) {
            updateSlider(currentIndex + 1);
          } else {
            updateSlider(currentIndex - 1);
          }
        }
        isDragging = false;
      });

      updateSlider(0);
    }

    // 7. Video Lightbox Modal Popup
    const playButtons = document.querySelectorAll(
      ".lightbox-image, .video-section .btn-box a",
    );
    playButtons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        let videoUrl = "https://www.youtube.com/embed/nfP5N9Yc72A?autoplay=1";
        const href = btn.getAttribute("href");
        if (href && href.startsWith("http")) {
          if (href.includes("watch?v=")) {
            const videoId = href.split("v=")[1].split("&")[0];
            videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          } else if (href.includes("youtu.be/")) {
            const videoId = href.split("youtu.be/")[1].split("?")[0];
            videoUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
          }
        }

        const modalOverlay = document.createElement("div");
        modalOverlay.className = "video-modal-overlay";
        modalOverlay.innerHTML = `
          <div class="video-modal-container">
            <span class="video-modal-close"><i class="fas fa-times"></i></span>
            <iframe src="${videoUrl}" allow="autoplay; encrypted-media" allowfullscreen></iframe>
          </div>
        `;

        document.body.appendChild(modalOverlay);

        setTimeout(() => {
          modalOverlay.classList.add("active");
        }, 50);

        const closeModal = () => {
          modalOverlay.classList.remove("active");
          setTimeout(() => {
            modalOverlay.remove();
          }, 400);
        };

        const closeBtn = modalOverlay.querySelector(".video-modal-close");
        closeBtn.addEventListener("click", closeModal);
        modalOverlay.addEventListener("click", (event) => {
          if (event.target === modalOverlay) {
            closeModal();
          }
        });
      });
    });

    // 8. Scroll-to-top Smooth Scrolling
    let scrollTopBtn = document.querySelector(".scroll-top");
    if (!scrollTopBtn) {
      scrollTopBtn = document.createElement("button");
      scrollTopBtn.className = "scroll-top";
      scrollTopBtn.setAttribute("aria-label", "Scroll to top");
      scrollTopBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
      document.body.appendChild(scrollTopBtn);
    }

    if (scrollTopBtn) {
      window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
          scrollTopBtn.classList.add("show");
        } else {
          scrollTopBtn.classList.remove("show");
        }
      });

      scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      });
    }

    // 9. Newsletter Subscription Handler
    const subscribeForms = document.querySelectorAll(".subscribe-form");
    subscribeForms.forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailInput = form.querySelector('input[type="email"]');
        const submitBtn = form.querySelector("button");

        if (emailInput && emailInput.value.trim() !== "") {
          const originalText = submitBtn.innerHTML;
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>';

          setTimeout(() => {
            submitBtn.innerHTML = '<i class="fas fa-check"></i> Subscribed!';
            submitBtn.style.background = "var(--accent-cyan)";
            submitBtn.style.boxShadow = "var(--shadow-cyan-glow)";
            emailInput.value = "";

            setTimeout(() => {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
              submitBtn.style.background = "";
              submitBtn.style.boxShadow = "";
              // Redirect to form action (404 page)
              window.location.href =
                form.getAttribute("action") || "pages/404.html";
            }, 1000);
          }, 1500);
        }
      });
    });

    // 10. Navigation Scroll Spy & Smooth Scroll Navigation Link active states
    const sections = document.querySelectorAll("section[id], footer[id]");
    const navLinks = document.querySelectorAll(".navigation li a");

    if (sections.length && navLinks.length) {
      window.addEventListener("scroll", () => {
        let currentSectionId = "";
        const scrollPos = window.scrollY + 200;

        sections.forEach((section) => {
          const sectionTop = section.offsetTop;
          const sectionHeight = section.offsetHeight;
          if (
            scrollPos >= sectionTop &&
            scrollPos < sectionTop + sectionHeight
          ) {
            currentSectionId = section.getAttribute("id");
          }
        });

        navLinks.forEach((link) => {
          const href = link.getAttribute("href");
          if (href && (href.startsWith("#") || href.includes("#"))) {
            const parentLi = link.parentElement;
            parentLi.classList.remove("current");
            if (
              href === `#${currentSectionId}` ||
              href.endsWith(`#${currentSectionId}`)
            ) {
              parentLi.classList.add("current");
            }
          }
        });
      });
    }

    // 11. Register Form Submission Storage & Matching Verification
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
      const password = document.getElementById("registerPassword");
      const confirmPassword = document.getElementById(
        "registerConfirmPassword",
      );

      registerForm.addEventListener("submit", (e) => {
        if (
          password &&
          confirmPassword &&
          password.value !== confirmPassword.value
        ) {
          e.preventDefault();
          e.stopPropagation();

          let errDiv = registerForm.querySelector(".password-match-error");
          if (!errDiv) {
            errDiv = document.createElement("div");
            errDiv.className = "password-match-error text-danger mt-2 small";
            errDiv.innerHTML =
              '<i class="fas fa-exclamation-circle me-1"></i> Passwords do not match!';
            confirmPassword.parentElement.appendChild(errDiv);
          }
          confirmPassword.classList.add("is-invalid");
        } else {
          // Passwords match! Let's save the data to localStorage and redirect to login
          e.preventDefault();
          const username = document
            .getElementById("registerUsername")
            .value.trim();
          const email = document.getElementById("registerEmail").value.trim();
          const role = document.getElementById("registerRole").value;

          localStorage.setItem(
            "registered_user_" + email.toLowerCase(),
            JSON.stringify({
              username: username,
              role: role,
              email: email,
            }),
          );

          window.location.href = "login.html";
        }
      });

      if (confirmPassword) {
        confirmPassword.addEventListener("input", () => {
          confirmPassword.classList.remove("is-invalid");
          const errDiv = registerForm.querySelector(".password-match-error");
          if (errDiv) errDiv.remove();
        });
      }
    }

    // 12. Login Form Submission Redirect & Data Storage
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("loginEmail");
        const roleSelect = document.getElementById("loginRole");
        if (emailInput && roleSelect) {
          const email = emailInput.value.trim();
          const role = roleSelect.value;

          let username = email.split("@")[0];
          username = username.charAt(0).toUpperCase() + username.slice(1);

          const registeredStr = localStorage.getItem(
            "registered_user_" + email.toLowerCase(),
          );
          if (registeredStr) {
            try {
              const regUser = JSON.parse(registeredStr);
              username = regUser.username || username;
            } catch (err) {
              console.error("Failed parsing registered user", err);
            }
          }

          sessionStorage.setItem(
            "user_session",
            JSON.stringify({
              username: username,
              role: role,
              email: email,
            }),
          );

          window.location.href = "dashboard.html";
        }
      });
    }

    // 13. Password Visibility Toggle
    const toggleButtons = document.querySelectorAll(".toggle-password");
    toggleButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const group = btn.parentElement;
        const input = group.querySelector("input");
        if (input) {
          if (input.type === "password") {
            input.type = "text";
            btn.classList.remove("fa-eye");
            btn.classList.add("fa-eye-slash");
          } else {
            input.type = "password";
            btn.classList.remove("fa-eye-slash");
            btn.classList.add("fa-eye");
          }
        }
      });
    });

    // 14. Dashboard Role-based Content Renderer
    const dashSidebar = document.getElementById("dashSidebar");
    if (dashSidebar) {
      const sidebarToggle = document.getElementById("sidebarToggle");
      const sidebarOverlay = document.getElementById("sidebarOverlay");
      const logoutBtn = document.getElementById("logoutBtn");

      if (sidebarToggle && dashSidebar && sidebarOverlay) {
        const toggleSidebar = () => {
          dashSidebar.classList.toggle("open");
          sidebarOverlay.classList.toggle("show");
        };

        sidebarToggle.addEventListener("click", toggleSidebar);
        sidebarOverlay.addEventListener("click", toggleSidebar);
      }

      // Check depth and set path prefixes dynamically
      const isSubpage = window.location.pathname.includes("/dashboard/");
      const pathPrefix = isSubpage ? "../../" : "";
      const rootPrefix = isSubpage ? "../../../" : "../";
      const subdirPrefix = isSubpage ? "" : "dashboard/";

      if (logoutBtn) {
        logoutBtn.setAttribute("href", pathPrefix + "login.html");
        logoutBtn.addEventListener("click", (e) => {
          sessionStorage.removeItem("user_session");
        });
      }

      const logoLink = document.querySelector(".sidebar-brand a");
      if (logoLink) {
        logoLink.setAttribute("href", rootPrefix + "index.html");
      }

      const sessionStr = sessionStorage.getItem("user_session");
      let user = {
        username: "Alex Rivera",
        role: "developer",
        email: "alex.rivera@stackly.com",
      };

      if (sessionStr) {
        try {
          user = JSON.parse(sessionStr);
        } catch (err) {
          console.error("Session parse error", err);
        }
      }

      // Session role verification to prevent visiting other roles' subfolders
      if (isSubpage) {
        const currentPath = window.location.pathname.toLowerCase();
        const roleFolderMap = {
          developer: "/dashboard/developer/",
          manager: "/dashboard/product-manager/",
          admin: "/dashboard/system-administrator/",
          executive: "/dashboard/founder-or-executive/",
        };
        const expectedFolder = roleFolderMap[user.role];
        if (expectedFolder && !currentPath.includes(expectedFolder)) {
          window.location.href = pathPrefix + "dashboard.html";
        }
      }

      const sidebarUserName = document.getElementById("sidebarUserName");
      const sidebarUserRole = document.getElementById("sidebarUserRole");
      const sidebarAvatar = document.getElementById("sidebarAvatar");
      const topbarGreetingName = document.getElementById("topbarGreetingName");
      const topbarMiniAvatar = document.getElementById("topbarMiniAvatar");
      const topbarPillName = document.getElementById("topbarPillName");

      const getInitials = (name) => {
        if (!name) return "AR";
        return name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
      };

      const initials = getInitials(user.username);

      if (sidebarUserName) sidebarUserName.textContent = user.username;
      if (sidebarAvatar) sidebarAvatar.textContent = initials;
      if (topbarGreetingName)
        topbarGreetingName.innerHTML = `<span>${user.username}</span>`;
      if (topbarMiniAvatar) topbarMiniAvatar.textContent = initials;
      if (topbarPillName) topbarPillName.textContent = user.username;

      if (sidebarUserRole) {
        sidebarUserRole.className = "sidebar-role-badge";
        sidebarUserRole.classList.add("badge-" + user.role);
        const roleMapping = {
          developer: "Developer",
          manager: "Product Manager",
          admin: "Systems Admin",
          executive: "Founder / CEO",
        };
        sidebarUserRole.textContent = roleMapping[user.role] || user.role;
      }

      const currentPath = window.location.pathname;
      const getActive = (pageName) => {
        return currentPath.endsWith(pageName) ? "active" : "";
      };
      const overviewActive =
        !currentPath.endsWith(".html") || currentPath.endsWith("dashboard.html")
          ? "active"
          : "";

      const getLink = (subfolder, filename) => {
        if (isSubpage) {
          return filename;
        } else {
          return `dashboard/${subfolder}/${filename}`;
        }
      };

      const sidebarNav = document.getElementById("sidebarNav");
      if (sidebarNav) {
        let navHtml = "";
        if (user.role === "developer") {
          navHtml = `
            <div class="nav-section-label">Developer Dashboard</div>
            <a href="${pathPrefix}dashboard.html" class="nav-item ${overviewActive}"><i class="fas fa-desktop"></i> <span>Overview</span></a>
            <a href="${getLink("developer", "api-logs.html")}" class="nav-item ${getActive("api-logs.html")}"><i class="fas fa-terminal"></i> <span>API Logs</span> <span class="nav-badge">Live</span></a>
            <a href="${getLink("developer", "console-telemetry.html")}" class="nav-item ${getActive("console-telemetry.html")}"><i class="fas fa-file-code"></i> <span>Console Telemetry</span></a>
            <a href="${getLink("developer", "build-monitor.html")}" class="nav-item ${getActive("build-monitor.html")}"><i class="fas fa-circle-check"></i> <span>Build Monitor</span></a>
            
            <div class="nav-section-label mt-4">Developer Tools</div>
            <a href="${getLink("developer", "database-cli.html")}" class="nav-item ${getActive("database-cli.html")}"><i class="fas fa-database"></i> <span>Database CLI</span></a>
            <a href="${getLink("developer", "git-sync.html")}" class="nav-item ${getActive("git-sync.html")}"><i class="fas fa-code-commit"></i> <span>Git Sync</span></a>
            <a href="${getLink("developer", "webhook-tester.html")}" class="nav-item ${getActive("webhook-tester.html")}"><i class="fas fa-plug"></i> <span>Webhook Tester</span></a>
          `;
        } else if (user.role === "manager") {
          navHtml = `
            <div class="nav-section-label">Product Dashboard</div>
            <a href="${pathPrefix}dashboard.html" class="nav-item ${overviewActive}"><i class="fas fa-desktop"></i> <span>Overview</span></a>
            <a href="${getLink("product-manager", "product-insights.html")}" class="nav-item ${getActive("product-insights.html")}"><i class="fas fa-chart-line"></i> <span>Product Insights</span></a>
            <a href="${getLink("product-manager", "analytics-funnels.html")}" class="nav-item ${getActive("analytics-funnels.html")}"><i class="fas fa-filter"></i> <span>Analytics Funnels</span></a>
            <a href="${getLink("product-manager", "user-retention.html")}" class="nav-item ${getActive("user-retention.html")}"><i class="fas fa-users-gear"></i> <span>User Retention</span></a>
            
            <div class="nav-section-label mt-4">Product Management</div>
            <a href="${getLink("product-manager", "roadmap.html")}" class="nav-item ${getActive("roadmap.html")}"><i class="fas fa-map"></i> <span>Roadmap</span></a>
            <a href="${getLink("product-manager", "release-notes.html")}" class="nav-item ${getActive("release-notes.html")}"><i class="fas fa-bullhorn"></i> <span>Release Notes</span></a>
            <a href="${getLink("product-manager", "ab-tests.html")}" class="nav-item ${getActive("ab-tests.html")}"><i class="fas fa-flask"></i> <span>A/B Tests</span></a>
          `;
        } else if (user.role === "admin") {
          navHtml = `
            <div class="nav-section-label">Systems Dashboard</div>
            <a href="${pathPrefix}dashboard.html" class="nav-item ${overviewActive}"><i class="fas fa-desktop"></i> <span>Overview</span></a>
            <a href="${getLink("system-administrator", "systems-health.html")}" class="nav-item ${getActive("systems-health.html")}"><i class="fas fa-server"></i> <span>Systems Health</span></a>
            <a href="${getLink("system-administrator", "operational-logs.html")}" class="nav-item ${getActive("operational-logs.html")}"><i class="fas fa-microchip"></i> <span>Operational Logs</span></a>
            <a href="${getLink("system-administrator", "security-logs.html")}" class="nav-item ${getActive("security-logs.html")}"><i class="fas fa-shield-halved"></i> <span>Security Logs</span></a>
            
            <div class="nav-section-label mt-4">Admin Tools</div>
            <a href="${getLink("system-administrator", "iam-access-rings.html")}" class="nav-item ${getActive("iam-access-rings.html")}"><i class="fas fa-key"></i> <span>IAM Access Rings</span></a>
            <a href="${getLink("system-administrator", "networks.html")}" class="nav-item ${getActive("networks.html")}"><i class="fas fa-network-wired"></i> <span>Networks</span></a>
            <a href="${getLink("system-administrator", "billing-audit.html")}" class="nav-item ${getActive("billing-audit.html")}"><i class="fas fa-file-invoice-dollar"></i> <span>Billing Audit</span></a>
          `;
        } else if (user.role === "executive") {
          navHtml = `
            <div class="nav-section-label">Executive Dashboard</div>
            <a href="${pathPrefix}dashboard.html" class="nav-item ${overviewActive}"><i class="fas fa-desktop"></i> <span>Overview</span></a>
            <a href="${getLink("founder-or-executive", "financial-insights.html")}" class="nav-item ${getActive("financial-insights.html")}"><i class="fas fa-sack-dollar"></i> <span>Financial Insights</span></a>
            <a href="${getLink("founder-or-executive", "client-accounts.html")}" class="nav-item ${getActive("client-accounts.html")}"><i class="fas fa-briefcase"></i> <span>Client Accounts</span></a>
            <a href="${getLink("founder-or-executive", "team-metrics.html")}" class="nav-item ${getActive("team-metrics.html")}"><i class="fas fa-people-group"></i> <span>Team Metrics</span></a>
            
            <div class="nav-section-label mt-4">Leadership Tools</div>
            <a href="${getLink("founder-or-executive", "capital-management.html")}" class="nav-item ${getActive("capital-management.html")}"><i class="fas fa-wallet"></i> <span>Capital Management</span></a>
            <a href="${getLink("founder-or-executive", "billing-audits.html")}" class="nav-item ${getActive("billing-audits.html")}"><i class="fas fa-file-signature"></i> <span>Billing Audits</span></a>
            <a href="${getLink("founder-or-executive", "settings.html")}" class="nav-item ${getActive("settings.html")}"><i class="fas fa-gears"></i> <span>Settings</span></a>
          `;
        }
        sidebarNav.innerHTML = navHtml;
      }

      const statCardsGrid = document.getElementById("statCardsGrid");
      const mainDashboardContent = document.getElementById(
        "mainDashboardContent",
      );

      if (statCardsGrid && mainDashboardContent) {
        let statsHtml = "";
        let mainHtml = "";

        if (user.role === "developer") {
          statsHtml = `
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-indigo"><i class="fas fa-clock"></i></div>
                <div class="stat-value">24ms</div>
                <div class="stat-label">API Latency SLA</div>
                <div class="stat-change up"><i class="fas fa-arrow-down"></i> 12%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-cyan"><i class="fas fa-network-wired"></i></div>
                <div class="stat-value">1.2M</div>
                <div class="stat-label">API Requests Today</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 18%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-pink"><i class="fas fa-exclamation-triangle"></i></div>
                <div class="stat-value">0.04%</div>
                <div class="stat-label">Production Errors</div>
                <div class="stat-change up"><i class="fas fa-arrow-down"></i> 45%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-green"><i class="fas fa-circle-check"></i></div>
                <div class="stat-value">Passed</div>
                <div class="stat-label">Active Node Builds</div>
                <div class="stat-change up">Stable</div>
              </div>
            </div>
          `;

          mainHtml = `
            <div class="col-lg-8">
              <div class="dash-card mb-4">
                <div class="dash-card-header">
                  <h5>API Request Volume (Hourly)</h5>
                  <span class="card-action">View Telemetry</span>
                </div>
                <div class="bar-chart">
                  <div class="bar-group"><div class="bar" style="height: 30%;"></div><span class="bar-label">09:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 45%;"></div><span class="bar-label">10:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 60%;"></div><span class="bar-label">11:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 75%;"></div><span class="bar-label">12:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 50%;"></div><span class="bar-label">13:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 80%;"></div><span class="bar-label">14:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 95%;"></div><span class="bar-label">15:00</span></div>
                </div>
              </div>
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Active Deployments logs</h5>
                  <span class="card-action">View Repository</span>
                </div>
                <div class="table-responsive">
                  <table class="dash-table">
                    <thead>
                      <tr>
                        <th>Build ID</th>
                        <th>Repository</th>
                        <th>Status</th>
                        <th>Commit</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span class="td-primary">v2.4.1</span></td>
                        <td>main-repo</td>
                        <td><span class="status-pill status-active">Active</span></td>
                        <td>Add OAuth auth flow</td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">v2.4.0</span></td>
                        <td>main-repo</td>
                        <td><span class="status-pill status-active">Active</span></td>
                        <td>Refactor metric components</td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">v2.3.9</span></td>
                        <td>billing-api</td>
                        <td><span class="status-pill status-active">Active</span></td>
                        <td>Fix Stripe webhook retry log</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Recent Server Logs</h5>
                </div>
                <ul class="activity-feed">
                  <li class="activity-item">
                    <div class="activity-dot icon-amber"><i class="fas fa-triangle-exclamation"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Node CPU capacity spiked above 85%</div>
                      <div class="act-time">2 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-green"><i class="fas fa-check"></i></div>
                    <div class="activity-body">
                      <div class="act-title">DB sync completed successfully</div>
                      <div class="act-time">15 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-indigo"><i class="fas fa-plug"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Webhook delivered to Slack channel</div>
                      <div class="act-time">1 hour ago</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          `;
        } else if (user.role === "manager") {
          statsHtml = `
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-indigo"><i class="fas fa-users"></i></div>
                <div class="stat-value">12.4K</div>
                <div class="stat-label">Monthly Active Users</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 8%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-cyan"><i class="fas fa-user-check"></i></div>
                <div class="stat-value">48.2%</div>
                <div class="stat-label">Product Retention Rate</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 3%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-pink"><i class="fas fa-star"></i></div>
                <div class="stat-value">76%</div>
                <div class="stat-label">Feature Adoption SLA</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 12%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-amber"><i class="fas fa-flask"></i></div>
                <div class="stat-value">4 Active</div>
                <div class="stat-label">A/B Testing Experiments</div>
                <div class="stat-change up">Stable</div>
              </div>
            </div>
          `;

          mainHtml = `
            <div class="col-lg-8">
              <div class="dash-card mb-4">
                <div class="dash-card-header">
                  <h5>Weekly New Signups</h5>
                  <span class="card-action">View Retention</span>
                </div>
                <div class="bar-chart">
                  <div class="bar-group"><div class="bar" style="height: 40%;"></div><span class="bar-label">Wk 1</span></div>
                  <div class="bar-group"><div class="bar" style="height: 55%;"></div><span class="bar-label">Wk 2</span></div>
                  <div class="bar-group"><div class="bar" style="height: 35%;"></div><span class="bar-label">Wk 3</span></div>
                  <div class="bar-group"><div class="bar" style="height: 65%;"></div><span class="bar-label">Wk 4</span></div>
                  <div class="bar-group"><div class="bar" style="height: 80%;"></div><span class="bar-label">Wk 5</span></div>
                  <div class="bar-group"><div class="bar" style="height: 70%;"></div><span class="bar-label">Wk 6</span></div>
                  <div class="bar-group"><div class="bar" style="height: 90%;"></div><span class="bar-label">Wk 7</span></div>
                </div>
              </div>
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Feature Roadmap Status</h5>
                  <span class="card-action">View Board</span>
                </div>
                <div class="table-responsive">
                  <table class="dash-table">
                    <thead>
                      <tr>
                        <th>Feature Name</th>
                        <th>Target Qtr</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span class="td-primary">SSO Authentication</span></td>
                        <td>Q3 2026</td>
                        <td>High</td>
                        <td><span class="status-pill status-active">In Progress</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">Slack Integration</span></td>
                        <td>Q3 2026</td>
                        <td>Medium</td>
                        <td><span class="status-pill status-done">Completed</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">Audit Logs Export</span></td>
                        <td>Q4 2026</td>
                        <td>Low</td>
                        <td><span class="status-pill status-pending">Queued</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Product Updates</h5>
                </div>
                <ul class="activity-feed">
                  <li class="activity-item">
                    <div class="activity-dot icon-green"><i class="fas fa-circle-check"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Release version 2.4.1 deployed</div>
                      <div class="act-time">10 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-cyan"><i class="fas fa-flask"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Onboarding funnel experiment active</div>
                      <div class="act-time">4 hours ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-purple"><i class="fas fa-ticket"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Feedback ticket resolved with Eng group</div>
                      <div class="act-time">1 day ago</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          `;
        } else if (user.role === "admin") {
          statsHtml = `
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-indigo"><i class="fas fa-microchip"></i></div>
                <div class="stat-value">32.4%</div>
                <div class="stat-label">Cluster CPU Load</div>
                <div class="stat-change up"><i class="fas fa-arrow-down"></i> 5%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-cyan"><i class="fas fa-memory"></i></div>
                <div class="stat-value">64.8%</div>
                <div class="stat-label">Memory Usage SLA</div>
                <div class="stat-change up">Stable</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-pink"><i class="fas fa-server"></i></div>
                <div class="stat-value">450 GB</div>
                <div class="stat-label">Bandwidth Throughput</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 22%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-red"><i class="fas fa-shield-alt"></i></div>
                <div class="stat-value">1,284</div>
                <div class="stat-label">Firewall Blocks (Hour)</div>
                <div class="stat-change down"><i class="fas fa-arrow-up"></i> 14%</div>
              </div>
            </div>
          `;

          mainHtml = `
            <div class="col-lg-8">
              <div class="dash-card mb-4">
                <div class="dash-card-header">
                  <h5>Bandwidth Traffic (GB/hr)</h5>
                  <span class="card-action">View Logs</span>
                </div>
                <div class="bar-chart">
                  <div class="bar-group"><div class="bar" style="height: 20%;"></div><span class="bar-label">09:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 40%;"></div><span class="bar-label">10:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 65%;"></div><span class="bar-label">11:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 50%;"></div><span class="bar-label">12:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 80%;"></div><span class="bar-label">13:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 75%;"></div><span class="bar-label">14:00</span></div>
                  <div class="bar-group"><div class="bar" style="height: 90%;"></div><span class="bar-label">15:00</span></div>
                </div>
              </div>
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Active Clusters</h5>
                  <span class="card-action">View Console</span>
                </div>
                <div class="table-responsive">
                  <table class="dash-table">
                    <thead>
                      <tr>
                        <th>Node Name</th>
                        <th>IP Address</th>
                        <th>CPU / RAM</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span class="td-primary">nyc-node-01</span></td>
                        <td>192.168.1.10</td>
                        <td>32% / 64%</td>
                        <td><span class="status-pill status-active">Healthy</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">nyc-node-02</span></td>
                        <td>192.168.1.11</td>
                        <td>45% / 78%</td>
                        <td><span class="status-pill status-active">Healthy</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">lon-node-01</span></td>
                        <td>10.0.4.15</td>
                        <td>89% / 92%</td>
                        <td><span class="status-pill status-critical">High Load</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>System Alerts</h5>
                </div>
                <ul class="activity-feed">
                  <li class="activity-item">
                    <div class="activity-dot icon-green"><i class="fas fa-database"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Backup sync completed successfully</div>
                      <div class="act-time">4 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-cyan"><i class="fas fa-arrow-up-right-dots"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Pod replica autoscaled trigger fired</div>
                      <div class="act-time">12 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-red"><i class="fas fa-shield-halved"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Unauthorized database access attempt blocked</div>
                      <div class="act-time">1 hour ago</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          `;
        } else if (user.role === "executive") {
          statsHtml = `
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-indigo"><i class="fas fa-dollar-sign"></i></div>
                <div class="stat-value">$42.5K</div>
                <div class="stat-label">Monthly Recurring Revenue</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 14%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-cyan"><i class="fas fa-briefcase"></i></div>
                <div class="stat-value">482</div>
                <div class="stat-label">Active Customer Accounts</div>
                <div class="stat-change up"><i class="fas fa-arrow-up"></i> 12%</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-pink"><i class="fas fa-chart-pie"></i></div>
                <div class="stat-value">4.2x</div>
                <div class="stat-label">LTV / CAC Ratio SLA</div>
                <div class="stat-change up">Stable</div>
              </div>
            </div>
            <div class="col-lg-3 col-md-6">
              <div class="stat-card">
                <div class="stat-icon icon-green"><i class="fas fa-chart-line"></i></div>
                <div class="stat-value">$18.5K</div>
                <div class="stat-label">Monthly Operational Burn</div>
                <div class="stat-change up"><i class="fas fa-arrow-down"></i> 8%</div>
              </div>
            </div>
          `;

          mainHtml = `
            <div class="col-lg-8">
              <div class="dash-card mb-4">
                <div class="dash-card-header">
                  <h5>MRR Growth (Monthly)</h5>
                  <span class="card-action">View Financials</span>
                </div>
                <div class="bar-chart">
                  <div class="bar-group"><div class="bar" style="height: 50%;"></div><span class="bar-label">Dec</span></div>
                  <div class="bar-group"><div class="bar" style="height: 55%;"></div><span class="bar-label">Jan</span></div>
                  <div class="bar-group"><div class="bar" style="height: 62%;"></div><span class="bar-label">Feb</span></div>
                  <div class="bar-group"><div class="bar" style="height: 70%;"></div><span class="bar-label">Mar</span></div>
                  <div class="bar-group"><div class="bar" style="height: 78%;"></div><span class="bar-label">Apr</span></div>
                  <div class="bar-group"><div class="bar" style="height: 85%;"></div><span class="bar-label">May</span></div>
                  <div class="bar-group"><div class="bar" style="height: 95%;"></div><span class="bar-label">Jun</span></div>
                </div>
              </div>
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Top Client Accounts</h5>
                  <span class="card-action">View Accounts</span>
                </div>
                <div class="table-responsive">
                  <table class="dash-table">
                    <thead>
                      <tr>
                        <th>Company</th>
                        <th>Size</th>
                        <th>MRR Contribution</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span class="td-primary">Acme Corp</span></td>
                        <td>250 seats</td>
                        <td>$2,450</td>
                        <td><span class="status-pill status-done">Active</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">Hooli Systems</span></td>
                        <td>120 seats</td>
                        <td>$1,200</td>
                        <td><span class="status-pill status-done">Active</span></td>
                      </tr>
                      <tr>
                        <td><span class="td-primary">Initech Software</span></td>
                        <td>80 seats</td>
                        <td>$800</td>
                        <td><span class="status-pill status-review">Trial</span></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="dash-card">
                <div class="dash-card-header">
                  <h5>Executive Alerts</h5>
                </div>
                <ul class="activity-feed">
                  <li class="activity-item">
                    <div class="activity-dot icon-green"><i class="fas fa-handshake"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Enterprise Contract closed: Initech</div>
                      <div class="act-time">5 mins ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-cyan"><i class="fas fa-rocket"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Growth marketing campaign active</div>
                      <div class="act-time">1 hour ago</div>
                    </div>
                  </li>
                  <li class="activity-item">
                    <div class="activity-dot icon-indigo"><i class="fas fa-file-invoice-dollar"></i></div>
                    <div class="activity-body">
                      <div class="act-title">Monthly invoice audits delivered</div>
                      <div class="act-time">3 hours ago</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          `;
        }

        statCardsGrid.innerHTML = statsHtml;
        mainDashboardContent.innerHTML = mainHtml;
      }

      // Catch all clicks on links and buttons (except sidebar nav, toggle, and brand logo) and redirect to 404 page
      document.addEventListener("click", (e) => {
        const target = e.target.closest(
          "a, button, .card-action, .quick-action-btn",
        );
        if (!target) return;

        // Exclude sidebar navigation links
        if (
          target.classList.contains("nav-item") &&
          target.id !== "logoutBtn"
        ) {
          return;
        }

        // Exclude logout button
        if (target.id === "logoutBtn") {
          return;
        }

        // Exclude brand logo link
        if (target.closest(".sidebar-brand")) {
          return;
        }

        // Exclude mobile sidebar toggle button
        if (target.id === "sidebarToggle" || target.closest("#sidebarToggle")) {
          return;
        }

        // Exclude interactive elements that have custom JS behavior
        const interactiveIds = [
          "liveToggle",
          "clearBtn",
          "dlBtn",
          "triggerBlockSim",
          "triggerBuildBtn",
          "downloadLogsBtn",
          "restartContainerBtn",
          "runQueryBtn",
          "stageAllBtn",
          "commitBtn",
          "deliverBtn",
          "retryInitechBtn",
          "addClientBtn",
          "viewGrowthBtn",
          "viewBreakBtn",
          "saveSettingsBtn",
          "saveBudgetsBtn",
          "startExpBtn",
          "downloadPdfBtn",
          "npsTriggerBtn",
          "triggerBackupBtn",
          "triggerRotationBtn",
          "approveReqBtn",
          "denyReqBtn",
        ];
        if (target.id && interactiveIds.includes(target.id)) {
          return;
        }

        // Redirect all other links and buttons to the 404 page
        e.preventDefault();
        e.stopPropagation();
        window.location.href = pathPrefix + "404.html";
      });
    }

    // 15. Inline Video Section Play/Pause
    const sectionVideo = document.getElementById("sectionVideo");
    const videoOverlay = document.getElementById("videoOverlay");
    const videoPlayIcon = document.getElementById("videoPlayIcon");

    const toggleVideo = () => {
      if (!sectionVideo) return;
      if (sectionVideo.paused) {
        sectionVideo.play();
        if (videoOverlay) videoOverlay.classList.add("hidden");
        if (videoPlayIcon)
          videoPlayIcon.classList.replace("fa-play", "fa-pause");
      } else {
        sectionVideo.pause();
        if (videoOverlay) videoOverlay.classList.remove("hidden");
        if (videoPlayIcon)
          videoPlayIcon.classList.replace("fa-pause", "fa-play");
      }
    };

    const videoPlayBtn = document.getElementById("videoPlayBtn");
    const videoPlayBtn2 = document.getElementById("videoPlayBtn2");
    if (videoPlayBtn) videoPlayBtn.addEventListener("click", toggleVideo);
    if (videoPlayBtn2) videoPlayBtn2.addEventListener("click", toggleVideo);
    if (sectionVideo) {
      sectionVideo.addEventListener("ended", () => {
        if (videoOverlay) videoOverlay.classList.remove("hidden");
        if (videoPlayIcon)
          videoPlayIcon.classList.replace("fa-pause", "fa-play");
      });
      // clicking the video itself also toggles
      sectionVideo.addEventListener("click", toggleVideo);
    }

    // 15. Ecosystem Showcase Section Tabs Switcher
    const ecoTabButtons = document.querySelectorAll(".eco-tab-btn");
    const ecoTabContents = document.querySelectorAll(".eco-tab-content");

    ecoTabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        ecoTabButtons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const targetTabId = btn.getAttribute("data-tab");
        ecoTabContents.forEach((content) => {
          content.classList.remove("active");
          if (content.id === targetTabId) {
            content.classList.add("active");
          }
        });
      });
    });
  }
});
