(() => {
  'use strict'

  const forms = document.querySelectorAll('.needs-validation')

  Array.from(forms).forEach(form => {
    form.addEventListener('submit', event => {
      if (!form.checkValidity()) {
        event.preventDefault()
        event.stopPropagation()
      }

      form.classList.add('was-validated')
    }, false)
  })
})();

const searchForm = document.querySelector(".search-form");
const searchInput = document.querySelector(".search-inp");

if (searchForm && searchInput) {
  searchForm.addEventListener("submit", (event) => {
    if (!searchInput.value.trim()) {
      event.preventDefault();
      window.location.href = "/listings";
    }
  });

  searchInput.addEventListener("search", () => {
    if (!searchInput.value.trim()) {
      window.location.href = "/listings";
    }
  });

  searchInput.addEventListener("input", () => {
    if (!searchInput.value.trim() && window.location.pathname === "/listings") {
      window.location.href = "/listings";
    }
  });
}
