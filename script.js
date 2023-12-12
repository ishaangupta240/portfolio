//Loading Screen
function startLoader (){
  let counterElement = document.querySelector(".counter");
  let currentValue = 0;

  function updateCounter(){
    if(currentValue === 100){
      return;
    }

    currentValue += Math.floor(Math.random() * 10) + 1;

    if(currentValue > 100){
      currentValue = 100;
    }

    counterElement.textContent = currentValue + "%";

    let delay = Math.floor(Math.random() * 200) + 50;
    setTimeout(updateCounter, delay);
  }

  updateCounter();
}

startLoader();

gsap.to(".counter" , 0.25 , {
  delay: 3.5,
  opacity: 0,
});

gsap.to(".bar" , 1.5 ,{
  delay: 3.5,
  height: 0,
  stagger: {
    amount: 0.5,
  },
  ease: "power4.inOut",
});





//Projects Buttom Timecode
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let interval = null;

document.querySelector("div.projects").onmouseover = event => {  
  let iteration = 0;
  
  clearInterval(interval);
  
  interval = setInterval(() => {
    event.target.innerText = event.target.innerText
      .split("")
      .map((letter, index) => {
        if(index < iteration) {
          return event.target.dataset.value[index];
        }
      
        return letters[Math.floor(Math.random() * 26)]
      })
      .join("");
    
    if(iteration >= event.target.dataset.value.length){ 
      clearInterval(interval);
    }
    
    iteration += 1;
  }, 30);
}





//Info Button Timecode
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let animationInterval = null;

document.querySelector("div.info").onmouseover = mouseOverEvent => {  
  let currentIteration = 0;
  
  clearInterval(animationInterval);
  
  animationInterval = setInterval(() => {
    mouseOverEvent.target.innerText = mouseOverEvent.target.innerText
      .split("")
      .map((currentLetter, index) => {
        if(index < currentIteration) {
          return mouseOverEvent.target.dataset.value[index];
        }
      
        return alphabet[Math.floor(Math.random() * 26)];
      })
      .join("");
    
    if(currentIteration >= mouseOverEvent.target.dataset.value.length){ 
      clearInterval(animationInterval);
    }
    
    currentIteration += 0.5;
  }, 30);
}







//Theme Randomizer
function randomTheme(){
var randomTheme = Math.floor(Math.random() * 8);
var htmlclass = document.getElementById("html-tag");

if(randomTheme===0){
  htmlclass.classList.add("dark-theme");
}
if(randomTheme===1){
  htmlclass.classList.add("grey-theme");
}
if(randomTheme===2){
  htmlclass.classList.add("lime-green-theme");
}
if(randomTheme===3){
  htmlclass.classList.add("khaki-theme");
}
if(randomTheme===4){
  htmlclass.classList.add("red-theme");
}
if(randomTheme===5){
  htmlclass.classList.add("grey-white-theme");
}
if(randomTheme===6){
  htmlclass.classList.add("light-theme");
}
if(randomTheme===7){
  htmlclass.classList.add("pastel-red-theme");
}
}

document.addEventListener("DOMContentLoaded", randomTheme())






//Theme Button
var predefinedClasses = [
  "dark-theme",
  "grey-theme",
  "lime-green-theme",
  "khaki-theme",
  "red-theme",
  "grey-white-theme",
  "light-theme",
  "pastel-red-theme"
];



function changeClass() {
  var htmlclass = document.getElementById("html-tag").className;

if(htmlclass==="dark-theme"){
  var currentClassIndex = 0;
}

if(htmlclass==="grey-theme"){
  var currentClassIndex = 1;
}

if(htmlclass==="lime-green-theme"){
  var currentClassIndex = 2;
}

if(htmlclass==="khaki-theme"){
  var currentClassIndex = 3;
}

if(htmlclass==="red-theme"){
  var currentClassIndex = 4;
}

if(htmlclass==="grey-white-theme"){
  var currentClassIndex = 5;
}

if(htmlclass==="light-theme"){
  var currentClassIndex = 6;
}

if(htmlclass==="pastel-red-theme"){
  var currentClassIndex = 7;
}


  var element = document.getElementById("html-tag");

  // Remove the current class
  element.classList.remove(predefinedClasses[currentClassIndex]);


  // Increment the class index or reset to 0 if it exceeds the number of predefined classes
  currentClassIndex = (currentClassIndex + 1) % predefinedClasses.length;

  // Add the new class
  element.classList.add(predefinedClasses[currentClassIndex]);
}