const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

    if(window.scrollY > 50){

        navbar.classList.add("scrolled");

    }

    else{

        navbar.classList.remove("scrolled");

    }

});
// ===========================
// FAQ Accordion - allow multiple answers to stay open
// ===========================

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {
    const question = item.querySelector(".faq-question");

    if (!question) return;

    question.addEventListener("click", () => {
        const isOpen = item.classList.toggle("active");
        question.setAttribute("aria-expanded", String(isOpen));
    });
});