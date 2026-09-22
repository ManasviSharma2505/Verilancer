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
// FAQ Accordion
// ===========================

const faqItems = document.querySelectorAll(".faq-item");

faqItems.forEach(item => {

    const question = item.querySelector(".faq-question");

    question.addEventListener("click", () => {

        // Close all other FAQs
        faqItems.forEach(other => {

            if(other !== item){

                other.classList.remove("active");

            }

        });

        // Toggle current FAQ
        item.classList.toggle("active");

    });

});