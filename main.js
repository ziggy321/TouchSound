import {App} from "./src/App.js";

const menuBar = document.querySelector('.sticky-top');
window.addEventListener('scroll', () => {
    menuBar.style = `min-width: max-content; position: relative; left: ${window.scrollX}px`;
})

new App();