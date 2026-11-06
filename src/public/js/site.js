(function () {
  "use strict";

  // --- Theme toggle -------------------------------------------------
  // The no-flash initial theme is set by an inline script in <head>
  // (runs before paint); this just wires up the toggle button and
  // keeps localStorage in sync.
  var root = document.documentElement;
  var toggleBtn = document.getElementById("theme-toggle");

  function currentTheme() {
    return root.getAttribute("data-theme") === "dark" ? "dark" : "light";
  }
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    localStorage.setItem("amandas-theme", theme);
    if (toggleBtn) toggleBtn.textContent = theme === "dark" ? "☀" : "☾";
  }
  if (toggleBtn) {
    toggleBtn.textContent = currentTheme() === "dark" ? "☀" : "☾";
    toggleBtn.addEventListener("click", function () {
      applyTheme(currentTheme() === "dark" ? "light" : "dark");
    });
  }

  // --- Mobile nav toggle ------------------------------------------
  var mobileToggle = document.getElementById("mobile-nav-toggle");
  var headerSection = mobileToggle ? mobileToggle.closest(".header-section") : null;
  if (mobileToggle && headerSection) {
    mobileToggle.addEventListener("click", function () {
      headerSection.classList.toggle("mobile-open");
    });
    headerSection.querySelectorAll(".header-nav a").forEach(function (link) {
      link.addEventListener("click", function () {
        headerSection.classList.remove("mobile-open");
      });
    });
  }

  // --- Booking modal --------------------------------------------------
  var overlay = document.getElementById("booking-overlay");
  var form = document.getElementById("booking-form");
  var done = document.getElementById("booking-done");
  var closeBtn = document.getElementById("booking-close");

  function openModal() {
    if (!overlay) return;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    if (!overlay) return;
    overlay.hidden = true;
    document.body.style.overflow = "";
  }
  document.querySelectorAll("[data-open-booking]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openModal();
      var presetService = el.getAttribute("data-service-id");
      if (presetService && form) {
        var sel = form.querySelector("#service");
        if (sel) {
          sel.value = presetService;
          sel.dispatchEvent(new Event("change"));
        }
      }
    });
  });
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (overlay) {
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay && !overlay.hidden) closeModal();
  });

  // --- Services data + estimate (mirrors src/services/pricing.service.ts) ---
  var SERVICES = window.AMANDAS_SERVICES || [];
  var serviceSelect = form ? form.querySelector("#service") : null;
  var qtyBox = form ? form.querySelector("#qtyBox") : null;
  var qtyInput = form ? form.querySelector("#qty") : null;
  var qtyLabel = form ? form.querySelector("#qtyLabel") : null;
  var estBox = form ? form.querySelector("#est") : null;

  function findService(id) {
    for (var i = 0; i < SERVICES.length; i++) {
      if (SERVICES[i].id === id) return SERVICES[i];
    }
    return null;
  }

  function estimate() {
    var service = serviceSelect ? findService(serviceSelect.value) : null;
    if (!service) {
      if (qtyBox) qtyBox.hidden = true;
      return "Choose a service to see an estimate.";
    }
    if (service.basePrice === null) {
      if (qtyBox) qtyBox.hidden = true;
      return "We will quote after a short site visit.";
    }
    if (service.pricingUnit === "hourly") {
      if (qtyBox) qtyBox.hidden = false;
      if (qtyLabel) qtyLabel.textContent = "Hours needed";
      var minimum = service.minimum || 1;
      var hours = Math.max(parseFloat(qtyInput.value) || minimum, minimum);
      return "Estimate: £" + (hours * service.basePrice).toFixed(2) + " (" + hours + " hrs at £" + service.basePrice + "/hr, minimum " + minimum + " hr" + (minimum > 1 ? "s" : "") + ")";
    }
    if (service.pricingUnit === "flat") {
      if (qtyBox) qtyBox.hidden = false;
      if (qtyLabel) qtyLabel.textContent = "Quantity";
      var units = parseFloat(qtyInput.value) || 1;
      return "Estimate: £" + (units * service.basePrice).toFixed(2) + " (" + units + " at £" + service.basePrice + " each)";
    }
    if (qtyBox) qtyBox.hidden = true;
    return "From £" + service.basePrice + ". We will confirm a fixed price after seeing photos or a quick visit.";
  }

  function refreshEstimate() {
    if (estBox) estBox.textContent = estimate();
  }

  if (serviceSelect) {
    serviceSelect.addEventListener("change", function () {
      var service = findService(serviceSelect.value);
      if (qtyInput && service) {
        qtyInput.value = service.pricingUnit === "hourly" ? Math.max(service.minimum || 1, 2) : 1;
      }
      refreshEstimate();
    });
  }
  if (qtyInput) qtyInput.addEventListener("input", refreshEstimate);

  // --- Submit -----------------------------------------------------
  if (form) {
    var dateInput = form.querySelector("#date");
    if (dateInput) {
      var today = new Date();
      today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
      dateInput.min = today.toISOString().slice(0, 10);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var errorsBox = form.querySelector("#form-errors");
      if (errorsBox) errorsBox.textContent = "";

      var payload = {
        serviceId: form.querySelector("#service").value,
        requestedDate: form.querySelector("#date").value,
        requestedTime: form.querySelector("#time").value,
        frequency: form.querySelector("#freq").value,
        quantity: qtyInput && !qtyBox.hidden ? parseFloat(qtyInput.value) || undefined : undefined,
        address: form.querySelector("#address").value,
        postcode: form.querySelector("#pc").value,
        instructions: form.querySelector("#notes").value || undefined,
        customer: {
          name: form.querySelector("#name").value,
          phone: form.querySelector("#phone").value,
          email: form.querySelector("#email").value || undefined,
        },
      };

      var submitBtn = form.querySelector("button[type=submit]");
      if (submitBtn) submitBtn.disabled = true;

      fetch("/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(function (res) {
          return res.json().then(function (body) {
            return { status: res.status, body: body };
          });
        })
        .then(function (result) {
          if (submitBtn) submitBtn.disabled = false;
          if (result.status === 201 && result.body.ok) {
            form.hidden = true;
            if (done) done.hidden = false;
            return;
          }
          if (errorsBox) {
            errorsBox.textContent = "Please check the form: some details weren't valid. Check your email, date, and required fields and try again.";
          }
        })
        .catch(function () {
          if (submitBtn) submitBtn.disabled = false;
          if (errorsBox) errorsBox.textContent = "Something went wrong sending your request. Please try again, or contact us directly.";
        });
    });
  }

  var editBtn = document.getElementById("booking-edit");
  if (editBtn) {
    editBtn.addEventListener("click", function () {
      if (done) done.hidden = true;
      if (form) form.hidden = false;
    });
  }
})();
