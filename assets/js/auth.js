/**
 * Astrosonix - Dynamic Authentication & Session Management
 * Coordinates frontend login, signup, logout, header updating, and card gating.
 */

(function() {
  "use strict";

  // Backend endpoint base
  const BACKEND_BASE = "https://astrosonix-backend.onrender.com";

  // Initialize on script load or DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  function init() {
    // 0. Inject Coming Soon Modal
    injectComingSoonModal();

    // 1. Setup Auth dynamic UI
    updateAuthUI();

    // 2. Setup event delegation for card gating
    setupCardInteractions();

    // 3. Override inline signup/login handler functions to save tokens
    overrideAuthenticationHandlers();

    // 4. Setup global click listener to close dropdowns on clicking outside
    setupGlobalClickClose();
  }

  // Inject a stylized Bootstrap modal for the "Coming Soon" call notification
  function injectComingSoonModal() {
    if (document.getElementById("comingSoonModal")) return;
    const modalDiv = document.createElement("div");
    modalDiv.innerHTML = `
      <div class="modal fade" id="comingSoonModal" tabindex="-1" aria-labelledby="comingSoonModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered" style="max-width: 400px; width: 90%;">
          <div class="modal-content text-white shadow-lg" style="background: rgba(18, 15, 27, 0.98) !important; border: 1px solid #d4a967 !important; backdrop-filter: blur(12px); border-radius: 16px;">
            <div class="modal-header d-flex align-items-center justify-content-between py-3" style="border-bottom: 1px solid rgba(212, 169, 103, 0.25) !important;">
              <h5 class="modal-title fw-bold" id="comingSoonModalLabel" style="color: #d4a967 !important; font-family: 'Poppins', sans-serif;">Voice Call</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close" style="filter: invert(1) grayscale(1) brightness(1.5);"></button>
            </div>
            <div class="modal-body text-center py-4" style="font-family: 'Poppins', sans-serif;">
              <div class="mb-3">
                <i class="bi bi-telephone-fill" style="font-size: 40px; color: #d4a967;"></i>
              </div>
              <h5 class="fw-bold mb-2">Voice Consultation</h5>
              <p class="text-muted small px-3">Our voice call feature is currently in alignment with the stars and will be launching very soon. Thank you for your patience!</p>
              <button class="btn px-4 py-2 mt-2 fw-bold text-dark rounded-pill" style="background-color: #d4a967; border: none; font-size: 14px; transition: transform 0.2s;" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modalDiv.firstElementChild);
  }

  // Open "Coming Soon" Modal
  function openComingSoonModal() {
    const csModalEl = document.getElementById("comingSoonModal");
    if (csModalEl) {
      const csModal = bootstrap.Modal.getInstance(csModalEl) || new bootstrap.Modal(csModalEl);
      csModal.show();
    }
  }

  // Helper to robustly check if user is logged in
  function isUserLoggedIn() {
    const token = localStorage.getItem("auth_token");
    return token && token !== "undefined" && token !== "null" && token.trim() !== "";
  }

  // Setup global click handler to dismiss open profile dropdowns
  function setupGlobalClickClose() {
    document.addEventListener("click", function() {
      document.querySelectorAll(".dropdown-menu.show").forEach(menu => {
        menu.classList.remove("show");
      });
      document.querySelectorAll(".dropdown-toggle.show").forEach(toggle => {
        toggle.classList.remove("show");
      });
    });
  }

  // Bind manual click handler to profile toggles to bypass library/Bootstrap version conflicts
  function setupManualDropdownToggle(dropdownEl) {
    const toggle = dropdownEl.querySelector(".dropdown-toggle") || dropdownEl.querySelector("#navbarProfileDropdown");
    const menu = dropdownEl.querySelector(".dropdown-menu");

    if (toggle && menu) {
      // Clear existing listeners
      toggle.replaceWith(toggle.cloneNode(true));
      const newToggle = dropdownEl.querySelector(".dropdown-toggle") || dropdownEl.querySelector("#navbarProfileDropdown");

      newToggle.addEventListener("click", function(e) {
        e.preventDefault();
        e.stopPropagation();

        const isShown = menu.classList.contains("show");

        // Close all other open dropdowns
        document.querySelectorAll(".dropdown-menu.show").forEach(m => {
          if (m !== menu) m.classList.remove("show");
        });
        document.querySelectorAll(".dropdown-toggle.show").forEach(t => {
          if (t !== newToggle) t.classList.remove("show");
        });

        // Toggle state
        if (isShown) {
          menu.classList.remove("show");
          newToggle.classList.remove("show");
        } else {
          menu.classList.add("show");
          newToggle.classList.add("show");
        }
      });
    }
  }

  // Update navbar/profile header based on session
  function updateAuthUI() {
    const isLoggedIn = isUserLoggedIn();
    const fullName = localStorage.getItem("full_name") || "User";

    const menuUl = document.querySelector(".as_menu ul");
    if (!menuUl) return;

    // Find existing Login links & Dropdown
    let loginBtn = menuUl.querySelector('a[data-bs-target="#signInModal"]');
    let profileDropdown = menuUl.querySelector(".nav-item.dropdown") || menuUl.querySelector(".auth-profile-dropdown");

    // Banner/Page specific Login & Sign Up buttons (like in home banner)
    const bannerLogins = document.querySelectorAll('a[data-bs-target="#signInModal"]:not(.nav-link), a[data-bs-target="#signUpModal"]');

    if (isLoggedIn) {
      // LOGGED IN STATE
      
      // Hide banner login/signup buttons
      bannerLogins.forEach(btn => {
        btn.style.setProperty("display", "none", "important");
      });

      // Hide navbar login button if present
      if (loginBtn) {
        loginBtn.style.setProperty("display", "none", "important");
        const parentLi = loginBtn.closest("li");
        if (parentLi && parentLi.querySelectorAll("a").length === 1) {
          parentLi.style.setProperty("display", "none", "important");
        }
      }

      // Ensure profile dropdown exists
      if (!profileDropdown) {
        profileDropdown = document.createElement("li");
        profileDropdown.className = "nav-item dropdown auth-profile-dropdown";
        profileDropdown.style.display = "inline-block";
        profileDropdown.style.verticalAlign = "middle";
        profileDropdown.style.marginLeft = "15px";
        profileDropdown.innerHTML = `
          <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="navbarProfileDropdown" role="button" aria-expanded="false" style="padding: 0;">
            <img src="assets/img/user-icon-person-symbol-human-avatar-3d-render.png" alt="Profile" class="rounded-circle" width="32" height="32" style="border: 2px solid #d4a967;">
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="navbarProfileDropdown" style="background-color: #120f1b; border: 1px solid #d4a967; padding: 10px; min-width: 180px; z-index: 1050;">
            <li class="dropdown-header text-center" style="padding: 5px 15px;">
              <strong class="user-display-name" style="color: #d4a967; font-size: 14px; font-weight: bold;">${fullName}</strong>
            </li>
            <li><hr class="dropdown-divider" style="background-color: rgba(212, 169, 103, 0.25); margin: 5px 0;"></li>
            <li><a class="dropdown-item" href="#" data-bs-toggle="modal" data-bs-target="#buyCoinsModal" style="color: #fff; padding: 5px 15px; font-size: 13.5px;">Buy Coins</a></li>
            <li><a class="dropdown-item" href="#" style="color: #fff; padding: 5px 15px; font-size: 13.5px;">Edit Profile</a></li>
            <li><a class="dropdown-item" href="#" style="color: #fff; padding: 5px 15px; font-size: 13.5px;">Help & Support</a></li>
            <li><a class="dropdown-item" href="#" style="color: #fff; padding: 5px 15px; font-size: 13.5px;">Display & Accessibility</a></li>
            <li><a class="dropdown-item text-danger logout-btn" href="#" style="color: #ff6b6b !important; padding: 5px 15px; font-size: 13.5px; font-weight: bold;">Logout</a></li>
          </ul>
        `;
        menuUl.appendChild(profileDropdown);
      } else {
        profileDropdown.style.removeProperty("display");
        const nameEl = profileDropdown.querySelector(".user-display-name") || profileDropdown.querySelector(".dropdown-header strong");
        if (nameEl) {
          nameEl.textContent = fullName;
        }
      }

      // Bind logout event
      const logoutBtn = profileDropdown.querySelector(".logout-btn") || profileDropdown.querySelector('a[href*="logout"], .text-danger');
      if (logoutBtn) {
        logoutBtn.replaceWith(logoutBtn.cloneNode(true));
        const newLogoutBtn = profileDropdown.querySelector(".logout-btn") || profileDropdown.querySelector('a[href*="logout"], .text-danger');
        newLogoutBtn.addEventListener("click", function(e) {
          e.preventDefault();
          handleLogout();
        });
      }

      // Bind manual toggle click handler to bypass library conflicts
      setupManualDropdownToggle(profileDropdown);

    } else {
      // LOGGED OUT STATE

      // Show banner login/signup buttons
      bannerLogins.forEach(btn => {
        btn.style.removeProperty("display");
      });

      // Show navbar login button
      if (loginBtn) {
        loginBtn.style.removeProperty("display");
        const parentLi = loginBtn.closest("li");
        if (parentLi) {
          parentLi.style.removeProperty("display");
        }
      } else {
        const liveChatBtn = menuUl.querySelector('a[onclick*="toggleChatPopup"]');
        const loginLi = document.createElement("li");
        loginLi.innerHTML = `
          <a href="#" class="btn btn-outline-warning ms-3 px-4 py-1 rounded-pill" style="border-color: #d4a967; color: #d4a967;" data-bs-toggle="modal" data-bs-target="#signInModal">
            Login
          </a>
        `;
        if (liveChatBtn && liveChatBtn.closest("li")) {
          menuUl.insertBefore(loginLi.firstElementChild, liveChatBtn.closest("li"));
        } else {
          menuUl.appendChild(loginLi.firstElementChild);
        }
      }

      // Remove profile dropdown
      if (profileDropdown) {
        profileDropdown.remove();
      }
    }
  }

  // Handle Logout
  function handleLogout() {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("full_name");
    alert("✅ Logged out successfully!");
    window.location.href = "index.html";
  }

  // Gate Card actions: CHAT and CALL via Capture Phase Event Listeners
  function setupCardInteractions() {
    const cards = document.querySelectorAll(".as_sign_box");
    cards.forEach(card => {
      const stretchedLink = card.querySelector(".stretched-link");

      // 1. Gate card stretched-link click when logged in
      if (stretchedLink) {
        stretchedLink.addEventListener("click", (e) => {
          if (isUserLoggedIn()) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, true); // Capture phase runs first
      }

      // 2. Gate CHAT button click when logged out
      const chatBtn = Array.from(card.querySelectorAll("button")).find(b => b.textContent.includes("CHAT"));
      if (chatBtn) {
        chatBtn.addEventListener("click", (e) => {
          if (!isUserLoggedIn()) {
            e.preventDefault();
            e.stopPropagation(); // Stops event bubbling and propagation to other listeners (like ai-chat.js)
            openLoginModal();
          }
        }, true); // Capture phase intercepts event before it reaches bubble phase listeners
      }

      // 3. Gate CALL button click in all states
      const callBtn = Array.from(card.querySelectorAll("button")).find(b => b.textContent.includes("CALL"));
      if (callBtn) {
        callBtn.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isUserLoggedIn()) {
            openLoginModal();
          } else {
            openComingSoonModal();
          }
        }, true); // Capture phase
      }
    });
  }

  // Helper: Open Login Modal
  function openLoginModal() {
    const signInModalEl = document.getElementById("signInModal");
    if (signInModalEl) {
      const signInModal = bootstrap.Modal.getInstance(signInModalEl) || new bootstrap.Modal(signInModalEl);
      signInModal.show();
    }
  }

  // Helper to parse DRF and Django validation errors
  function parseBackendError(data, defaultMsg) {
    if (!data) return defaultMsg;
    if (data.error) return data.error;
    if (data.message) return data.message;
    if (typeof data === "object") {
      const fieldErrors = [];
      for (const key in data) {
        if (Array.isArray(data[key])) {
          fieldErrors.push(`${key}: ${data[key].join(", ")}`);
        } else if (typeof data[key] === "string") {
          fieldErrors.push(`${key}: ${data[key]}`);
        }
      }
      if (fieldErrors.length > 0) {
        return fieldErrors.join("\n");
      }
    }
    return defaultMsg;
  }

  // Override auth handlers in the global namespace (window)
  function overrideAuthenticationHandlers() {
    // 1. Send Phone Login OTP
    window.sendSignInOTP = function() {
      const phone = document.getElementById("signInPhone").value.trim();

      if (phone.length !== 10 || !/^\d+$/.test(phone)) {
        alert("⚠️ Enter valid 10-digit number.");
        return;
      }

      fetch(`${BACKEND_BASE}/api/send_otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone, is_login: true })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "Failed to send OTP"));
        }
        return data;
      })
      .then(data => {
        document.getElementById("otpSection").classList.remove("d-none");
        alert("✅ OTP sent successfully!");
      })
      .catch((error) => {
        alert("❌ Login error:\n" + error.message);
        console.error(error);
      });
    };

    // 2. Phone Login OTP Verification
    window.verifySignInOTP = function() {
      const phone = document.getElementById("signInPhone").value.trim();
      const otp = document.getElementById("otpInput").value.trim();

      if (!otp) {
        alert("⚠️ Please enter the OTP.");
        return;
      }

      fetch(`${BACKEND_BASE}/api/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: phone, otp: otp })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "OTP verification failed"));
        }
        return data;
      })
      .then(data => {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("full_name", data.full_name || "User");
        
        const modalEl = document.getElementById("signInModal");
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }

        alert("✅ Login successful! Welcome back.");
        
        updateAuthUI();
        setupCardInteractions();
        
        window.location.reload();
      })
      .catch((error) => {
        alert("❌ Login verification failed:\n" + error.message);
      });
    };

    // 3. Send Email Login OTP
    window.sendEmailOTP = function() {
      const email = document.getElementById("loginEmail").value.trim();
      if (!email || !email.includes("@")) {
        alert("⚠️ Enter valid email address.");
        return;
      }

      fetch(`${BACKEND_BASE}/api/send_email_otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "Failed to send OTP"));
        }
        return data;
      })
      .then(data => {
        if (data.message?.toLowerCase().includes("otp sent")) {
          document.getElementById("emailOtpSection").classList.remove("d-none");
          alert("✅ OTP sent to email.");
        } else {
          alert("❌ " + (data.message || "Failed to send OTP"));
        }
      })
      .catch(err => {
        console.error(err);
        alert("❌ Failed to send OTP:\n" + err.message);
      });
    };

    // 4. Email Login OTP Verification
    window.verifyEmailOTP = function() {
      const email = document.getElementById("loginEmail").value.trim();
      const otp = document.getElementById("emailOtpInput").value.trim();

      if (!otp || !email) {
        alert("⚠️ Please enter both email and OTP.");
        return;
      }

      fetch(`${BACKEND_BASE}/api/verify_email_otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email, otp: otp })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "OTP verification failed"));
        }
        return data;
      })
      .then(data => {
        if (data.message === "Login success") {
          localStorage.setItem("auth_token", data.token);
          localStorage.setItem("full_name", data.full_name || "User");
          localStorage.setItem("email", email);
          
          const modalEl = document.getElementById("signInModal");
          if (modalEl) {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
          }

          alert("✅ Login successful! Welcome back.");
          
          updateAuthUI();
          setupCardInteractions();
          
          window.location.reload();
        } else {
          alert("❌ " + data.message);
        }
      })
      .catch(err => {
        console.error(err);
        alert("❌ OTP verification failed:\n" + err.message);
      });
    };

    // 5. Register User (Send Signup OTP)
    window.registerUser = function() {
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const phone = document.getElementById("signup-phone").value.trim();

      if (!name || !email || phone.length !== 10 || !/^\d{10}$/.test(phone)) {
        alert("⚠️ Please fill in all fields correctly.");
        return;
      }

      fetch(`${BACKEND_BASE}/api/send_otp/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phone })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "Failed to send OTP"));
        }
        return data;
      })
      .then(data => {
        document.getElementById("otp-section").style.display = "block";
        alert("✅ OTP sent to +91" + phone);
      })
      .catch((error) => {
        console.error(error);
        alert("❌ OTP send failed:\n" + error.message);
      });
    };

    // 6. User Sign Up OTP Verification
    window.verifyOtp = function() {
      const otp = document.getElementById("otp-input").value.trim();
      const name = document.getElementById("signup-name").value.trim();
      const email = document.getElementById("signup-email").value.trim();
      const phone = document.getElementById("signup-phone").value.trim();

      if (!otp) {
        alert("⚠️ Enter OTP to verify");
        return;
      }

      fetch(`${BACKEND_BASE}/api/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: name,
          phone_number: phone,
          email: email,
          otp: otp
        })
      })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(parseBackendError(data, "Signup failed"));
        }
        return data;
      })
      .then(data => {
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("full_name", data.full_name || name);
        localStorage.setItem("email", email);
        
        const modalEl = document.getElementById("signUpModal");
        if (modalEl) {
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
        }

        alert("✅ Signup successful! Welcome to Astrosonix.");
        
        updateAuthUI();
        setupCardInteractions();
        
        window.location.reload();
      })
      .catch((error) => {
        alert("❌ Signup failed:\n" + error.message);
      });
    };
  }

})();
