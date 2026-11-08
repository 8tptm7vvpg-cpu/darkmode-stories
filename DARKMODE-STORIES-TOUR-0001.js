import { scenes } from './DARKMODE-STORIES-TOUR-SCRIPT-0001.js?v=0.18.0';

const mix = (start, end, amount) => start + (end - start) * amount;
const limit = value => Math.max(0, Math.min(1, value));
const ease = value => {
  const t = limit(value);
  return t * t * (3 - 2 * t);
};

export function createTour(editor){
  const element = id => document.getElementById(id);
  const intro = document.querySelector('.intro');
  const controls = element('tourControls');
  const toggle = element('tourToggle');
  const sound = element('tourSound');
  const skip = element('tourSkip');
  const caption = element('tourCaption');
  const chapter = element('tourChapter');
  const narration = element('tourNarration');
  const picker = element('tourUpload');
  const scan = element('tourScan');
  const touch = element('tourTouch');
  const erase = element('eraseDialog');
  const dictation = element('dictation');
  const liveText = element('liveText');
  const dictationLabel = element('dictationLabel');
  const header = document.querySelector('.topbar');
  const dock = document.querySelector('.dock-space');
  const audio = element('tourAudio');

  let active = false;
  let paused = false;
  let finishing = false;
  let audible = false;
  let animationFrame = 0;
  let lastFrame = null;
  let elapsed = 0;
  let sceneIndex = -1;
  let sceneStarted = 0;
  let scene = null;
  let focus = null;
  let previousCamera = { x:800, y:600, ratio:1 };
  let camera = previousCamera;
  let portrait;
  let closingLine;
  let sampleMessage;

  function place(item, x, y){
    item.style.left = x + 'px';
    item.style.top = y + 'px';
    return item;
  }

  function textOnBoard(words, x, y, ending = false){
    const message = editor.addMessage(words);
    message.classList.add(ending ? 'tour-ending' : 'tour-copy');
    message.textContent = '';
    return place(message, x, y);
  }

  function drawWords(message, words, progress){
    const length = Math.floor(words.length * limit(progress));
    const text = words.slice(0, length);
    if(message.textContent !== text) message.textContent = text;
  }

  function highlight(id){
    focus?.classList.remove('tour-focus');
    focus = id ? element(id) : null;
    focus?.classList.add('tour-focus');
  }

  function closeDemoOverlays(){
    editor.closeLibraries();
    picker.classList.remove('show');
    dictation.classList.remove('show');
    scan.style.opacity = '0';
    touch.hidden = true;
    if(erase.classList.contains('is-demo')){
      if(erase.open) erase.close();
      erase.inert = false;
      erase.classList.remove('is-demo');
    }
    editor.setMode('pan');
    highlight();
    sampleMessage?.classList.remove('is-reading');
  }

  function showDemoErase(){
    erase.classList.add('is-demo');
    erase.inert = true;
    editor.setEraseProgress(0);
    erase.show();
  }

  function moveCamera(x, y, ratio, progress = 1){
    const movement = editor.reducedMotion.matches ? 1 : ease(progress);
    camera = {
      x:mix(previousCamera.x,x,movement),
      y:mix(previousCamera.y,y,movement),
      ratio:mix(previousCamera.ratio,ratio,movement)
    };
    editor.camera(camera.x, camera.y, camera.ratio);
  }

  function showTouches(box, distance, angle){
    const frame = editor.viewport.getBoundingClientRect();
    const centerX = box.left + box.width / 2 - frame.left - editor.viewport.clientLeft;
    const centerY = box.top + box.height / 2 - frame.top - editor.viewport.clientTop;
    const radius = Math.min(distance,frame.width * .37);
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    touch.hidden = editor.reducedMotion.matches;
    touch.firstElementChild.style.transform = `translate(${centerX-dx}px,${centerY-dy}px)`;
    touch.lastElementChild.style.transform = `translate(${centerX+dx}px,${centerY+dy}px)`;
  }

  function stroke(beat, name, progress, points, brush){
    const step = Math.floor(limit(progress) * points.length);
    const last = beat[name] || 0;
    for(let index = last; index < step; index++){
      const [x,y] = points[index];
      const [fromX,fromY] = points[Math.max(0,index-1)];
      editor.paintStroke({x:fromX,y:fromY}, {x,y}, brush);
    }
    beat[name] = Math.max(step,last);
  }

  const flourish = Array.from({length:39}, (_, index) => [
    875 + index * 16, 808 + Math.sin(index * .25) * 67
  ]);
  const underlining = Array.from({length:28}, (_, index) => [
    907 + index * 18, 926 - Math.sin(index * .14) * 31
  ]);

  const choreography = [
    {
      start(beat){
        beat.copy = textOnBoard(beat.words, 112, 145);
        const firstHand = place(editor.addSticker('🤚'), 172, 446);
        const secondHand = place(editor.addSticker('✋'), 367, 454);
        editor.applyItemTransform(firstHand, { scale:1.65, angle:-.27 });
        editor.applyItemTransform(secondHand, { scale:1.55, angle:.24 });
      },
      frame(beat,t){
        moveCamera(395, 387, 2.5, t * 3);
      }
    },
    {
      start(beat){
        highlight('micBtn');
        dictationLabel.textContent = 'Simulated dictation';
        liveText.textContent = '';
        dictation.classList.add('show');
        beat.copy = textOnBoard(beat.words, 110, 666);
      },
      frame(beat,t){
        moveCamera(405, 750, 2.4, t * 3);
        drawWords(liveText, 'This is Darkmode Stories…', t * 4);
        if(t > .38) dictation.classList.remove('show');
      }
    },
    {
      start(beat){
        highlight('emojiBtn');
        element('emojiLibrary').classList.add('show');
        beat.copy = textOnBoard(beat.words, 892, 106);
      },
      frame(beat,t){
        moveCamera(1176, 352, 2.44, t * 3);
        if(t > .36 && !beat.revealed){
          beat.revealed = true;
          editor.closeLibraries();
          place(editor.addSticker('🐉'), 1160, 385);
          place(editor.addSticker('⭐'), 997, 386);
          place(editor.addImageSticker({
            src:'DARKMODE-STORIES-STICKER-NEON-STAR-0001.svg',
            name:'Neon star sticker'
          }), 1307, 404);
        }
      }
    },
    {
      start(beat){
        highlight('lockBtn');
        editor.setMode('draw');
        editor.setPaintPanel(true);
        beat.copy = textOnBoard(beat.words, 885, 540);
        beat.original = ['brushWidth','brushStyle','brushHue','brushColor'].map(id => [element(id), element(id).value]);
      },
      frame(beat,t){
        moveCamera(1180, 766, 2.4, t * 3);
        const width = Math.round(mix(22,92,ease(t*3)));
        element('brushWidth').value = width;
        element('brushWidthValue').textContent = width + ' px';
        element('brushStyle').value = t < .66 ? 'watercolor' : 'bold';
        element('brushHue').value = t < .66 ? 288 : 169;
        element('brushColor').value = t < .66 ? '#bf4fd0' : '#00a78b';
        if(t > .4) editor.setPaintPanel(false);
        stroke(beat,'wash',(t-.4)*3.4,flourish,{ color:'#d348cd', width:85, opacity:.15, cap:'round' });
        stroke(beat,'ink',(t-.69)*3.6,underlining,{ color:'#00a78b', width:22, opacity:1, cap:'square' });
      },
      exit(beat){
        beat.original.forEach(([input,value]) => { input.value = value; });
        element('brushWidthValue').textContent = element('brushWidth').value + ' px';
      }
    },
    {
      start(beat){
        highlight('stickerBtn');
        picker.classList.add('show');
        beat.copy = textOnBoard(beat.words, 95, 952);
      },
      frame(beat,t){
        moveCamera(420, 852, 2.2, t * 3);
        if(t > .52 && !portrait){
          picker.classList.remove('show');
          portrait = place(editor.addImageSticker({
            src:'DARKMODE-STORIES-TOUR-PORTRAIT-0001.svg',
            name:'A moonlit bedroom'
          }), 408, 388);
          portrait.className = 'sticker photo-sticker tour-photo';
        }
      }
    },
    {
      start(beat){
        beat.copy = textOnBoard(beat.words, 870, 955);
      },
      frame(beat,t){
        if(!portrait) return;
        const rotate = ease((t-.12)*2.2);
        const drag = ease((t-.42)*2.1);
        place(portrait, mix(408,1432,drag), mix(388,285,drag));
        editor.applyItemTransform(portrait, { scale:mix(1,1.42,rotate), angle:mix(0,.29,rotate) });
        const x = t < .35 ? 600 : mix(600,1460,drag);
        moveCamera(x, 520, 2.4, t * 4);
        if(t > .1 && t < .56){
          showTouches(portrait.getBoundingClientRect(),mix(42,106,rotate),mix(-.2,.48,rotate));
        }else touch.hidden = true;
      }
    },
    {
      start(){},
      frame(beat,t){
        const zoomIn = ease((t-.26)/.36);
        const zoomOut = ease((t-.62)/.36);
        if(t < .62){
          moveCamera(mix(1430,365,ease(t*3.6)), 355, mix(2.2,3.05,zoomIn), t * 4);
        }else{
          moveCamera(mix(365,800,zoomOut),mix(355,600,zoomOut),mix(3.05,1,zoomOut));
        }
        if(t > .26 && t < .99){
          showTouches(editor.viewport.getBoundingClientRect(),
            t < .62 ? mix(115,27,zoomIn) : mix(27,126,zoomOut), 0);
        }else touch.hidden = true;
      }
    },
    {
      start(){
        highlight('exportBtn');
      },
      frame(beat,t){
        moveCamera(800,600,1,t*4);
        if(t > .39 && t < .82){
          scan.style.setProperty('--scan', mix(-4,104,(t-.39)/.43) + '%');
          scan.style.opacity = editor.reducedMotion.matches ? '.45' : '.9';
        }else scan.style.opacity = '0';
      }
    },
    {
      start(beat){
        highlight('resetBtn');
        showDemoErase();
      },
      frame(beat,t){
        if(t < .65){
          editor.setEraseProgress(ease((t-.32)/.28));
        }else if(!beat.cleared){
          beat.cleared = true;
          closeDemoOverlays();
          void editor.wipeArtboard();
        }
      }
    },
    {
      start(beat){
        sampleMessage = textOnBoard(beat.words, 116, 230);
        beat.copy = sampleMessage;
        highlight('readBtn');
        place(editor.addSticker('🐉'), 355, 600);
      },
      frame(beat,t){
        moveCamera(390,400,2.48,t*3);
        if(t > .49) sampleMessage.classList.add('is-reading');
      }
    },
    {
      start(beat){
        beat.copy = textOnBoard(beat.words, 890, 235);
        closingLine = textOnBoard('THE END', 300, 500, true);
      },
      frame(beat,t,seconds){
        if(seconds < beat.seconds - 3.3){
          moveCamera(1180,375,2.25,t*4);
        }else{
          if(!beat.endCamera){
            beat.endCamera = true;
            previousCamera = camera;
          }
          const zoomIn = (seconds - (beat.seconds - 3.3)) / 1.3;
          moveCamera(800,598,2.38,zoomIn);
          drawWords(closingLine,'THE END',zoomIn * 2);
        }
      }
    }
  ];

  function beginScene(index){
    if(index === scenes.length){
      void endTour();
      return;
    }
    if(scene) choreography[sceneIndex].exit?.(scene);
    closeDemoOverlays();
    sceneIndex = index;
    scene = { ...scenes[index] };
    chapter.textContent = scene.chapter;
    narration.textContent = scene.words;
    previousCamera = camera;
    choreography[index].start(scene);
  }

  function requestFrame(){
    animationFrame = requestAnimationFrame(frame);
  }

  function frame(now){
    if(!active || paused || finishing) return;
    if(audible && !audio.ended){
      elapsed = Math.max(elapsed,audio.currentTime * 1000);
    }else if(lastFrame !== null){
      elapsed += Math.min(150,now - lastFrame);
    }
    lastFrame = now;

    while(scene && elapsed >= sceneStarted + scene.seconds * 1000){
      sceneStarted += scene.seconds * 1000;
      beginScene(sceneIndex + 1);
      if(finishing) return;
    }

    const seconds = (elapsed - sceneStarted) / 1000;
    const progress = limit(seconds / scene.seconds);
    if(scene.copy) drawWords(scene.copy,scene.words,progress * 1.9);
    choreography[sceneIndex].frame(scene,progress,seconds);
    requestFrame();
  }

  function enableNarration(){
    if(!active || finishing || audio.error) return;
    audio.currentTime = elapsed / 1000;
    audio.play().then(() => {
      sound.hidden = true;
      audible = true;
      if(!active || paused || finishing) audio.pause();
    }).catch(() => {
      audible = false;
      if(active && !finishing) sound.hidden = false;
    });
  }

  function setPaused(value){
    paused = value;
    controls.classList.toggle('is-paused',paused);
    toggle.setAttribute('aria-label',paused ? 'Play walkthrough' : 'Pause walkthrough');
    editor.pauseWipe(paused);
    if(paused){
      cancelAnimationFrame(animationFrame);
      audio.pause();
    }else{
      lastFrame = null;
      enableNarration();
      requestFrame();
    }
  }

  async function endTour(){
    if(!active || finishing) return;
    finishing = true;
    if(scene && sceneIndex < scenes.length) choreography[sceneIndex].exit?.(scene);
    cancelAnimationFrame(animationFrame);
    audio.pause();
    controls.hidden = true;
    caption.hidden = true;
    closeDemoOverlays();
    editor.pauseWipe(false);
    await editor.wipeArtboard();
    scene = portrait = closingLine = sampleMessage = null;
    narration.textContent = '';
    chapter.textContent = '';
    editor.restoreEditor();
    editor.setActive(false);
    document.body.classList.remove('tour-active');
    header.inert = false;
    dock.inert = false;
    active = false;
    editor.modeBadge.textContent = 'STORY MODE';
    if(document.activeElement === document.body) element('micBtn').focus({preventScroll:true});
  }

  function startTour(){
    if(active) return;
    active = true;
    editor.setActive(true);
    document.body.classList.add('tour-active');
    header.inert = true;
    dock.inert = true;
    controls.hidden = false;
    caption.hidden = false;
    beginScene(0);
    enableNarration();
    requestFrame();
  }

  toggle.onclick = () => setPaused(!paused);
  skip.onclick = () => { void endTour(); };
  sound.onclick = () => {
    if(paused) setPaused(false);
    else enableNarration();
  };
  audio.addEventListener('error', () => {
    audible = false;
    sound.hidden = true;
  });
  window.addEventListener('pagehide', () => {
    if(active && !paused && !finishing) setPaused(true);
  });

  if(editor.reducedMotion.matches){
    intro.hidden = true;
    startTour();
  }else{
    intro.addEventListener('animationend', event => {
      if(event.target === intro && event.animationName === 'introOut') startTour();
    });
  }
}
