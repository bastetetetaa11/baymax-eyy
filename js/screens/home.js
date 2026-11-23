/**
 * home.js — The welcome screen.
 */

import { CONFIG } from '../config.js';
import { t } from '../ui/i18n.js';
import { createFace } from '../ui/face.js';

export function render(root, ctx) {
  const face = createFace('idle');

  root.innerHTML = `
    <section class="home">
      <div class="home-face" id="homeFace"></div>
      <h2 class="home-title">${CONFIG.TITLE}</h2>
      <p class="home-sub">${t('app.subtitle')}</p>
      <button class="btn btn-primary btn-xl" id="beginBtn">${t('home.begin')}</button>
    </section>
  `;

  root.querySelector('#homeFace').appendChild(face);
  ctx.setFace('listening');

  // Speak the greeting, and animate the face while speaking.
      // Play the custom introduction MP3
  const introAudio = new Audio('audio/intro.mp3');
  
  // Function to play starting at 2 seconds
  const playIntro = () => {
    introAudio.currentTime = 2; // Skips the first 2 seconds
    introAudio.play().catch(() => {
      // If Chrome blocks autoplay, play it on the first click anywhere
      const playOnFirstClick = () => {
        introAudio.currentTime = 2; // Ensure it still starts at 2s after clicking
        introAudio.play();
        document.removeEventListener('click', playOnFirstClick);
      };
      document.addEventListener('click', playOnFirstClick);
    });
  };

  // We wait for the browser to load the audio file's information
  // before skipping ahead, otherwise it might fail or reset to 0.
  introAudio.addEventListener('loadedmetadata', playIntro, { once: true });
  introAudio.load(); // Tells the browser to start loading the file
  setTimeout(() => {
    face.setExpression('happy');
  }, 800);
  setTimeout(() => {
    face.setExpression('idle');
  }, 3200);

  root.querySelector('#beginBtn').addEventListener('click', (e) => {
    // Disable the button so they can't click it twice while fading
    e.currentTarget.disabled = true;
    
    // Add the slow fade class to the screen
    const homeScreen = root.querySelector('.home');
    homeScreen.classList.add('fade-out-slow');
    
    // Wait 1.2 seconds (1200ms) for the fade to finish, then go to the next page
    setTimeout(() => {
      ctx.navigate('consent');
    }, 1200);
  });
}