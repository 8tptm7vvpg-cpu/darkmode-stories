/* =========================================================
       GLOBAL BUTTON FEEDBACK
       Adds:
       - Press compression
       - Neon ripple
       - Tiny sparkle burst
       - Keyboard activation support
       ========================================================= */
    function addButtonRipple(button, clientX, clientY){
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');

      ripple.className = 'dm-ripple';
      ripple.style.left = (clientX - rect.left) + 'px';
      ripple.style.top = (clientY - rect.top) + 'px';

      button.appendChild(ripple);

      setTimeout(() => {
        ripple.remove();
      }, 650);
    }

    function addButtonSparkles(clientX, clientY){
      const symbols = ['✨','✦','✧','⋆'];

      for(let index = 0; index < 3; index++){
        const spark = document.createElement('span');

        spark.className = 'dm-spark';
        spark.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        spark.style.left = clientX + 'px';
        spark.style.top = clientY + 'px';
        spark.style.setProperty(
          '--sx',
          ((Math.random() * 60) - 30) + 'px'
        );
        spark.style.setProperty(
          '--sy',
          (-35 - Math.random() * 35) + 'px'
        );

        document.body.appendChild(spark);

        setTimeout(() => {
          spark.remove();
        }, 760);
      }
    }

    function animateButton(button, type = 'success'){
      button.classList.remove('dm-success', 'dm-warning');
      void button.offsetWidth;
      button.classList.add(
        type === 'warning' ? 'dm-warning' : 'dm-success'
      );

      setTimeout(() => {
        button.classList.remove('dm-success', 'dm-warning');
      }, 650);
    }

    document.addEventListener('pointerdown', event => {
      const button = event.target.closest('button');

      if(!button || button.disabled){
        return;
      }

      button.classList.add('dm-pressed');
      addButtonRipple(button, event.clientX, event.clientY);
      addButtonSparkles(event.clientX, event.clientY);
    });

    document.addEventListener('pointerup', event => {
      const button = event.target.closest('button');

      if(button){
        button.classList.remove('dm-pressed');
      }
    });

    document.addEventListener('pointercancel', event => {
      const button = event.target.closest('button');

      if(button){
        button.classList.remove('dm-pressed');
      }
    });

    document.addEventListener('keydown', event => {
      if(
        (event.key === 'Enter' || event.key === ' ') &&
        document.activeElement?.tagName === 'BUTTON'
      ){
        document.activeElement.classList.add('dm-pressed');
      }
    });

    document.addEventListener('keyup', event => {
      if(
        (event.key === 'Enter' || event.key === ' ') &&
        document.activeElement?.tagName === 'BUTTON'
      ){
        document.activeElement.classList.remove('dm-pressed');
        animateButton(document.activeElement);
      }
    });

    /* =========================================================
       APPLICATION BOOT STATUS
       Confirms that JavaScript successfully parsed and began running.
       ========================================================= */
    document.documentElement.dataset.storiesJs = 'loaded';

    window.addEventListener('error', event => {
      console.error('DARKMODE STORIES runtime error:', event.error || event.message);
    });

    /* =========================================================
       ELEMENT REFERENCES
       Stores frequently used page elements in variables.
       ========================================================= */
    const viewport = document.getElementById('viewport');
    const artboard = document.getElementById('artboard');
    const scratch = document.getElementById('scratch');
    const ctx = scratch.getContext('2d');
    const contentLayer = document.getElementById('contentLayer');
    const hint = document.getElementById('hint');
    const lockBtn = document.getElementById('lockBtn');
    const modeBadge = document.getElementById('modeBadge');
    const micBtn = document.getElementById('micBtn');
    const dictation = document.getElementById('dictation');
    const liveText = document.getElementById('liveText');
    const emojiLibrary = document.getElementById('emojiLibrary');
    const stickerLibrary = document.getElementById('stickerLibrary');
    const toast = document.getElementById('toast');
    const drawTarget = document.getElementById('drawTarget');

    /* =========================================================
       APP STATE
       Tracks:
       - Current mode
       - Artboard position
       - Pointer movement
       - Message placement
       ========================================================= */
    let mode = 'pan';
    let artX = 0;
    let artY = 0;

    let pointerActive = false;
    let startX = 0;
    let startY = 0;
    let startArtX = 0;
    let startArtY = 0;

    let drawing = false;
    let lastX = 0;
    let lastY = 0;

    let messageCount = 0;

    /* =========================================================
       EMOJI AND STICKER CONTENT
       These are original generic Unicode symbols.
       No third-party character artwork is included.
       ========================================================= */
    const emojis = [
      "😀","🥰","😂","😍","🤩",
      "🥳","😎","🤗","❤️","💜",
      "🌈","✨","⭐","🎉","👍",
      "👏","🔥","🌞","🌙","☁️"
    ];

    let stickerManifest = [];

    /* =========================================================
       BUILD THE EMOJI / STICKER LIBRARIES
       Creates one button for each item in the arrays above.
       ========================================================= */
    function fillLibrary(gridId, items){
      const grid = document.getElementById(gridId);

      items.forEach(item => {
        const button = document.createElement('button');
        button.className = 'pick';
        button.textContent = item;

        button.onclick = () => {
          addSticker(item);
          closeLibraries();
        };

        grid.appendChild(button);
      });
    }

    async function loadStickerManifest(){
      const grid = document.getElementById('stickerGrid');
      grid.innerHTML = '';

      try{
        const response = await fetch(
          'DARKMODE-STORIES-STICKER-MANIFEST-0001.json',
          { cache:'no-store' }
        );

        if(!response.ok){
          throw new Error('Sticker manifest could not be loaded.');
        }

        stickerManifest = await response.json();

        stickerManifest.forEach(sticker => {
          const button = document.createElement('button');
          button.className = 'pick';
          button.setAttribute('aria-label', sticker.name);

          const image = document.createElement('img');
          image.src = sticker.src;
          image.alt = sticker.name;

          button.appendChild(image);

          button.onclick = () => {
            addImageSticker(sticker);
            closeLibraries();
          };

          grid.appendChild(button);
        });
      }catch(error){
        /* Build the fallback with DOM methods instead of a quoted
           multi-line HTML string. This avoids syntax corruption when
           app.js is uploaded or edited through GitHub's mobile UI. */
        grid.replaceChildren();

        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'library-title';
        fallbackMessage.textContent =
          'Stickers could not be loaded. Try reloading the page.';

        grid.appendChild(fallbackMessage);
        console.warn(error);
      }
    }

    fillLibrary('emojiGrid', emojis);

    /* Sticker buttons are loaded from the manifest beside this file. */
    loadStickerManifest();

    /* =========================================================
       OPEN / CLOSE LIBRARIES
       Only one library can be visible at a time.
       ========================================================= */
    function toggleLibrary(type){
      const target = type === 'emoji' ? emojiLibrary : stickerLibrary;
      const other = type === 'emoji' ? stickerLibrary : emojiLibrary;

      other.classList.remove('show');
      target.classList.toggle('show');
    }

    function closeLibraries(){
      emojiLibrary.classList.remove('show');
      stickerLibrary.classList.remove('show');
    }

    document.getElementById('emojiBtn').onclick = event => {
      toggleLibrary('emoji');
      animateButton(event.currentTarget);
    };

    document.getElementById('stickerBtn').onclick = event => {
      toggleLibrary('sticker');
      animateButton(event.currentTarget);
    };

    /* =========================================================
       NATIVE DEVICE EMOJI INPUT
       Focusing a normal input asks the browser to display the
       device keyboard. The user can switch to the keyboard's emoji
       page, then add the selected emoji to the Story Canvas.
       ========================================================= */
    const nativeEmojiInput =
      document.getElementById('nativeEmojiInput');

    document.getElementById('emojiBtn').addEventListener(
      'click',
      () => {
        setTimeout(() => {
          nativeEmojiInput.focus();
        }, 220);
      }
    );

    document.getElementById('addNativeEmojiBtn').onclick = event => {
      const value = nativeEmojiInput.value.trim();

      if(value){
        if(/[\p{L}\p{N}]/u.test(value)){
          addMessage(value);
        }else{
          addSticker(value);
        }

        nativeEmojiInput.value = '';
        closeLibraries();
        nativeEmojiInput.blur();
        animateButton(event.currentTarget);
      }else{
        animateButton(event.currentTarget, 'warning');
      }
    };

    document.getElementById('closeNativeEmojiBtn').onclick = () => {
      nativeEmojiInput.value = '';
      nativeEmojiInput.blur();
      closeLibraries();
    };

    /* =========================================================
       ARTBOARD MOVEMENT
       Updates the position of the larger Story Canvas.
       ========================================================= */
    function updateTransform(){
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      // On phones and tablets, fit at least the left page across the viewport.
      const scale = width <= 900
        ? Math.min(width <= 600 ? .52 : .72, width / 800)
        : 1;
      const clipped = 1600 * scale > width || 1200 * scale > height;
      const homeX = clipped ? (1600 * scale - width) / 2 : 0;
      const homeY = clipped ? (1200 * scale - height) / 2 : 0;

      artboard.style.transform =
        `translate(calc(-50% + ${homeX + artX}px), calc(-50% + ${homeY + artY}px)) scale(${scale})`;

      /* Drives the global parallax layers.
         Each CSS layer applies a different multiplier to these values. */
      document.documentElement.style.setProperty('--px', artX + 'px');
      document.documentElement.style.setProperty('--py', artY + 'px');
    }

    /* =========================================================
       MODE SWITCH
       - Pan mode moves the Story Canvas
       - Draw mode scratches away the black layer
       ========================================================= */
    function setMode(nextMode){
      mode = nextMode;

      const drawModeActive = mode === 'draw';

      /* The icon shows the action available next. */
      lockBtn.textContent = drawModeActive ? '↔️' : '🖌️';
      lockBtn.setAttribute(
        'aria-label',
        drawModeActive
          ? 'Switch to Story Mode'
          : 'Switch to Draw Mode'
      );

      lockBtn.classList.toggle('locked', drawModeActive);

      modeBadge.textContent =
        drawModeActive ? 'DRAW MODE' : 'STORY MODE';

      hint.innerHTML = drawModeActive
        ? 'Drag your finger to paint with the black brush.'
        : 'Drag to move around the larger colorful Storyboard.';
    }

    lockBtn.onclick = event => {
      setMode(mode === 'pan' ? 'draw' : 'pan');
      animateButton(event.currentTarget);
    };

    /* =========================================================
       SCRATCH CANVAS SETUP
       Paints a black foreground over the rainbow gradient.
       Drawing uses destination-out to erase the black layer.
       ========================================================= */
    function sizeScratch(){
      scratch.width = 1600;
      scratch.height = 1200;

      /* Start with a completely transparent drawing layer so the
         bright gradient artboard is immediately visible. */
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, scratch.width, scratch.height);

      /* Draw Mode now paints an oversized black brush stroke. */
      ctx.strokeStyle = '#050509';
      ctx.fillStyle = '#050509';
      ctx.lineWidth = 36;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    sizeScratch();
    updateTransform();
    if(typeof ResizeObserver !== 'undefined'){
      new ResizeObserver(updateTransform).observe(viewport);
    }else{
      window.addEventListener('resize', updateTransform);
    }

    /* =========================================================
       OPTIONAL DEVICE-TILT PARALLAX
       On supported tablets/phones, gentle device movement adds
       a small amount of depth even when the canvas is stationary.
       This does not affect the actual artboard position.
       ========================================================= */
    if(window.DeviceOrientationEvent){
      window.addEventListener('deviceorientation', event => {
        const tiltX = Math.max(-12, Math.min(12, event.gamma || 0));
        const tiltY = Math.max(-12, Math.min(12, event.beta || 0));

        document.documentElement.style.setProperty(
          '--tiltX',
          tiltX + 'px'
        );

        document.documentElement.style.setProperty(
          '--tiltY',
          tiltY + 'px'
        );
      });
    }

    /* Converts a screen pointer location into artboard coordinates */
    function artPoint(event){
      const rect = artboard.getBoundingClientRect();

      return {
        x:(event.clientX - rect.left) * (1600 / rect.width),
        y:(event.clientY - rect.top) * (1200 / rect.height)
      };
    }

    /* Positions the oversized brush target inside the visible viewport. */
    function moveDrawTarget(event){
      const viewportRect = viewport.getBoundingClientRect();

      drawTarget.style.left =
        (event.clientX - viewportRect.left) + 'px';

      drawTarget.style.top =
        (event.clientY - viewportRect.top) + 'px';
    }

    /* =========================================================
       POINTER INTERACTION
       Uses the same finger/mouse drag gesture for:
       - Panning when unlocked
       - Drawing when locked
       ========================================================= */
    viewport.addEventListener('pointerdown', event => {
      closeLibraries();
      hint.style.opacity = '0';

      if(mode === 'pan'){
        pointerActive = true;
        viewport.setPointerCapture(event.pointerId);

        startX = event.clientX;
        startY = event.clientY;
        startArtX = artX;
        startArtY = artY;
      }else{
        drawing = true;
        viewport.setPointerCapture(event.pointerId);

        const point = artPoint(event);
        lastX = point.x;
        lastY = point.y;

        /* Paint a round dot immediately, even before the finger moves. */
        ctx.beginPath();
        ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();

        moveDrawTarget(event);
        drawTarget.classList.add('show');
      }
    });

    viewport.addEventListener('pointermove', event => {
      if(mode === 'pan' && pointerActive){
        artX = startArtX + (event.clientX - startX);
        artY = startArtY + (event.clientY - startY);
        updateTransform();
      }

      if(mode === 'draw' && drawing){
        const point = artPoint(event);

        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();

        lastX = point.x;
        lastY = point.y;

        moveDrawTarget(event);
      }
    });

    function finishPointer(event){
      pointerActive = false;
      drawing = false;
      drawTarget.classList.remove('show');

      try{
        viewport.releasePointerCapture(event.pointerId);
      }catch(error){
        /* Safe fallback if the pointer was already released */
      }
    }

    viewport.addEventListener('pointerup', finishPointer);
    viewport.addEventListener('pointercancel', finishPointer);
    viewport.addEventListener('pointerleave', event => {
      if(drawing){
        finishPointer(event);
      }
    });

    /* =========================================================
       ADD EMOJIS / STICKERS
       Places the selected item near the center of the visible area.
       ========================================================= */
    /* Editorial flow: left page first, then right page.
       A cell is reserved when an item is inserted; manual dragging
       remains independent of automatic placement. */
    const layoutSlots = [];
    function placeEditorialItem(element, kind){
      const pageInset = 62, columnGap = 18, rowGap = 20;
      const cellWidth = kind === 'text' ? 310 : (kind === 'photo' ? 310 : kind === 'decor' ? 250 : 110);
      const cellHeight = kind === 'text' ? 138 : (kind === 'photo' ? 245 : kind === 'decor' ? 95 : 120);
      let page=0, x=pageInset, y=65;
      for(const slot of layoutSlots){
        if(slot.page!==page) continue;
        const nextX=slot.x+slot.width+columnGap;
        if(nextX+cellWidth <= 800-pageInset){ x=nextX; y=slot.y; }
        else { x=pageInset; y=Math.max(...layoutSlots.filter(s=>s.page===page).map(s=>s.y+s.height))+rowGap; }
      }
      while(y+cellHeight>1120 && page<1){
        page++;x=pageInset;y=65;
      }
      /* Place against all existing slots, wrapping rows as needed. */
      for(let tries=0;tries<250;tries++){
        const collision=layoutSlots.find(s=>s.page===page &&
          x<s.x+s.width+columnGap && x+cellWidth+columnGap>s.x &&
          y<s.y+s.height+rowGap && y+cellHeight+rowGap>s.y);
        if(!collision) break;
        x=collision.x+collision.width+columnGap;
        if(x+cellWidth>800-pageInset){
          x=pageInset;
          y=Math.max(...layoutSlots.filter(s=>s.page===page && s.y<=y+rowGap).map(s=>s.y+s.height),y)+rowGap;
        }
        if(y+cellHeight>1120 && page===0){page=1;x=pageInset;y=65;}
      }
      const absoluteX=page*800+x;
      element.style.left=absoluteX+'px';
      element.style.top=y+'px';
      layoutSlots.push({page,x,y,width:cellWidth,height:cellHeight});
    }

    function addSticker(symbol){
      hint.style.opacity = '0';

      const element = document.createElement('div');
      element.className = 'sticker';
      element.textContent = symbol;
      element.dataset.readableText =
        /[\p{L}\p{N}]/u.test(symbol) ? symbol : '';

      placeEditorialItem(element, 'emoji');

      contentLayer.appendChild(element);
      makeDraggable(element);
    }

    /* Adds an original image sticker from the library. */
    function addImageSticker(sticker){
      hint.style.opacity = '0';

      const image = document.createElement('img');
      image.className = 'sticker sticker-image';
      image.src = sticker.src;
      image.alt = sticker.name;

      placeEditorialItem(image, 'decor');

      contentLayer.appendChild(image);
      makeDraggable(image);
    }

    /* Photos are kept only in browser memory, never uploaded. */
    const photoUrls=[];
    document.getElementById('photoAddBtn').onclick=()=>{
      document.getElementById('photoInput').click();
    };
    document.getElementById('photoInput').addEventListener('change',event=>{
      const file=event.target.files?.[0];
      if(!file || !file.type.startsWith('image/')) return;
      const url=URL.createObjectURL(file);
      photoUrls.push(url);
      const image=document.createElement('img');
      image.src=url;image.alt='Your photo';
      image.className='sticker photo-sticker';
      placeEditorialItem(image,'photo');
      contentLayer.appendChild(image);
      makeDraggable(image);
      hint.style.opacity='0';
      closeLibraries();
      event.target.value='';
    });
    window.addEventListener('pagehide',()=>photoUrls.forEach(url=>URL.revokeObjectURL(url)));

    /* =========================================================
       MAKE OBJECTS DRAGGABLE
       Applies to:
       - Stickers
       - Emojis
       - Message bubbles
       ========================================================= */
    function makeDraggable(element){
      let drag = false;
      let offsetX = 0;
      let offsetY = 0;

      element.addEventListener('pointerdown', event => {
        event.stopPropagation();

        drag = true;
        element.classList.add('is-dragging');
        element.style.zIndex = '100';
        element.setPointerCapture(event.pointerId);

        const rect = element.getBoundingClientRect();
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
      });

      element.addEventListener('pointermove', event => {
        if(!drag){
          return;
        }

        const artboardRect = artboard.getBoundingClientRect();
        const scaleX = 1600 / artboardRect.width;
        const scaleY = 1200 / artboardRect.height;

        let x = (event.clientX - artboardRect.left - offsetX) * scaleX;
        let y = (event.clientY - artboardRect.top - offsetY) * scaleY;

        x = Math.max(36, Math.min(x, 1510));
        y = Math.max(35, Math.min(y, 1090));

        element.style.left = x + 'px';
        element.style.top = y + 'px';
      });

      element.addEventListener('pointerup', event => {
        drag = false;
        element.classList.remove('is-dragging');
        element.style.zIndex = element.classList.contains('message') ? '20' : (element.classList.contains('sticker-image') || element.classList.contains('photo-sticker') ? '8' : '18');

        try{
          element.releasePointerCapture(event.pointerId);
        }catch(error){
          /* Safe fallback if the pointer was already released */
        }
      });
    }

    /* =========================================================
       ADD A SPEECH-TO-TEXT MESSAGE BUBBLE
       Messages are placed in a loose vertical story sequence.
       ========================================================= */
    function addMessage(text){
      const cleanText = text.trim();

      if(!cleanText){
        return;
      }

      hint.style.opacity = '0';

      const element = document.createElement('div');
      element.className = 'message message-arrival';
      element.textContent = cleanText;
      element.dataset.readableText = cleanText;

      placeEditorialItem(element, 'text');
      contentLayer.appendChild(element);
      makeDraggable(element);

      messageCount++;
    }

    /* =========================================================
       SPEECH RECOGNITION — VERSION 13
       Browser behavior differs significantly:
       - Android Chrome can repeat interim/continuous results.
       - Amazon Silk may expose the constructor without providing a
         working microphone-backed recognition session.

       Strategy:
       - Android uses one utterance at a time, with interim results off.
       - Final phrases are normalized and deduplicated.
       - Silk uses the tablet keyboard's own dictation field.
       - A startup watchdog prevents the mic from getting stuck on.
       ========================================================= */
    const userAgent = navigator.userAgent || '';
    const isAppleMobile = /iPhone|iPad|iPod/i.test(userAgent) ||
      (/Macintosh/i.test(userAgent) && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(userAgent);
    const isSilk = /Silk\//i.test(userAgent);

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    const dictationLabel =
      document.getElementById('dictationLabel');

    const speechFallback =
      document.getElementById('speechFallback');

    const speechFallbackInput =
      document.getElementById('speechFallbackInput');

    const speechFallbackAdd =
      document.getElementById('speechFallbackAdd');

    const speechFallbackCancel =
      document.getElementById('speechFallbackCancel');

    let recognition = null;
    let listening = false;
    let recognitionStarting = false;
    let finalTranscript = '';
    let recognitionWatchdog = null;
    let resultCommitted = false;
    let liveTranscriptDraft = '';
    let acceptLateResult = false;
    const visualViewport = window.visualViewport;

    function positionSpeechFallback(){
      if(!visualViewport || !dictation.classList.contains('composing')){
        return;
      }

      const obscuredBottom = Math.max(
        0, window.innerHeight - visualViewport.height - visualViewport.offsetTop
      );
      const keyboardOpen = window.innerHeight - visualViewport.height > 80;
      const bottom = keyboardOpen ? obscuredBottom + 12 : Math.max(obscuredBottom + 12, 116);
      const availableHeight = window.innerHeight - bottom - visualViewport.offsetTop - 12;
      dictation.style.setProperty('--composer-bottom', bottom + 'px');
      dictation.style.setProperty('--composer-max-height', Math.max(48, availableHeight) + 'px');
    }

    visualViewport?.addEventListener('resize', positionSpeechFallback);
    visualViewport?.addEventListener('scroll', positionSpeechFallback);

    function setLiveTranscript(text){
      liveTranscriptDraft = (text || '').trim();

      liveText.textContent =
        liveTranscriptDraft || 'Start talking...';

      dictation.classList.toggle(
        'has-speech',
        Boolean(liveTranscriptDraft)
      );
    }

    function normalizeTranscript(text){
      return text
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s']/gu, '')
        .replace(/\s+/g, ' ')
        .trim();
    }

    function resetMicVisualState(){
      listening = false;
      recognitionStarting = false;

      clearTimeout(recognitionWatchdog);
      recognitionWatchdog = null;

      micBtn.classList.remove('listening');
      micBtn.textContent = '🎤';
      dictation.classList.remove('has-speech');
    }

    function closeSpeechFallback(){
      speechFallback.classList.remove('show');
      speechFallbackInput.blur();
      speechFallbackInput.value = '';
      dictation.classList.remove('show', 'composing');
      resetMicVisualState();
    }

    function openSpeechFallback(focusInput = false){
      resetMicVisualState();

      micBtn.classList.add('unsupported');
      dictation.classList.add('show', 'composing');
      speechFallback.classList.add('show');
      positionSpeechFallback();
      if(focusInput){
        speechFallbackInput.focus({ preventScroll:true });
      }
    }

    function commitRecognitionText(text){
      const cleanText = (text || '').trim();
      const normalized = normalizeTranscript(cleanText);

      if(!cleanText || !normalized){
        return false;
      }

      if(resultCommitted){
        return false;
      }

      resultCommitted = true;
      addMessage(cleanText);
      return true;
    }


    function stopAllSpeechActivity(options = {}){
      const {
        preserveFallbackText = false,
        hidePanels = true
      } = options;

      if(recognition && (listening || recognitionStarting)){
        stopRecognitionSession(true);
      }

      acceptLateResult = false;
      resetMicVisualState();
      micBtn.classList.remove('unsupported');

      stopReadAloud();

      if(!preserveFallbackText){
        speechFallbackInput.value = '';
      }

      speechFallbackInput.blur();
      nativeEmojiInput.blur();

      if(hidePanels){
        speechFallback.classList.remove('show');
        dictation.classList.remove('show', 'composing');
      }
    }

    function stopAndCommitRecognition(){
      if(!recognition){
        resetMicVisualState();
        return;
      }

      const textToCommit =
        liveTranscriptDraft ||
        finalTranscript ||
        (
          liveText.textContent === 'Start talking...'
            ? ''
            : liveText.textContent
        );

      commitRecognitionText(textToCommit);
      acceptLateResult = !resultCommitted;

      clearTimeout(recognitionWatchdog);
      recognitionWatchdog = null;

      try{
        recognition.stop();
      }catch(error){
        try{
          recognition.abort();
        }catch(abortError){
          /* Browser already ended the session. */
        }
      }

      resetMicVisualState();
      dictation.classList.remove('show');
      finalTranscript = '';
      liveTranscriptDraft = '';
      setLiveTranscript('');
    }

    function stopRecognitionSession(useAbort = false){
      if(!recognition){
        resetMicVisualState();
        return;
      }

      clearTimeout(recognitionWatchdog);
      recognitionWatchdog = null;

      try{
        if(useAbort && typeof recognition.abort === 'function'){
          recognition.abort();
        }else{
          recognition.stop();
        }
      }catch(error){
        resetMicVisualState();
        if(!dictation.classList.contains('composing')){
          dictation.classList.remove('show');
        }
      }
    }

    if(SpeechRecognition && !isSilk){
      try{
        recognition = new SpeechRecognition();
      }catch(error){
        console.warn('Speech recognition could not be initialized:', error);
      }
    }

    if(recognition){
      recognition.lang = 'en-US';
      recognition.continuous = !isAndroid;
      recognition.interimResults = !isAndroid;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        if(!recognitionStarting){
          stopRecognitionSession(true);
          return;
        }

        clearTimeout(recognitionWatchdog);
        recognitionWatchdog = null;

        listening = true;
        recognitionStarting = false;
        resultCommitted = false;
        finalTranscript = '';
        liveTranscriptDraft = '';

        micBtn.classList.remove('unsupported');
        micBtn.classList.add('listening');
        micBtn.textContent = '■';

        speechFallback.classList.remove('show');
        dictation.classList.remove('composing');
        dictation.classList.add('show');
        dictationLabel.textContent =
          isAndroid ? 'Listening — one phrase' : 'Listening';
        setLiveTranscript('');
      };

      recognition.onresult = event => {
        if(!listening && !acceptLateResult){
          return;
        }

        let interimText = '';
        const uniqueFinals = [];
        const seenFinals = new Set();

        for(let index = 0; index < event.results.length; index++){
          const result = event.results[index];
          const transcript = result[0].transcript.trim();
          const normalized = normalizeTranscript(transcript);

          if(!normalized){
            continue;
          }

          if(result.isFinal){
            if(!seenFinals.has(normalized)){
              seenFinals.add(normalized);
              uniqueFinals.push(transcript);
            }
          }else{
            interimText = transcript;
          }
        }

        if(uniqueFinals.length){
          finalTranscript = uniqueFinals.reduce(
            (longest, item) =>
              item.length > longest.length ? item : longest,
            ''
          );
        }

        setLiveTranscript(
          finalTranscript ||
          interimText ||
          liveTranscriptDraft
        );

        if(isAndroid && finalTranscript && !resultCommitted){
          commitRecognitionText(finalTranscript);
        }
      };

      recognition.onspeechend = () => {
        if(isAndroid){
          stopRecognitionSession(false);
        }
      };

      recognition.onend = () => {
        const wasActive = listening || recognitionStarting;
        const textToCommit =
          liveTranscriptDraft ||
          finalTranscript;

        if((wasActive || acceptLateResult) && textToCommit && !resultCommitted){
          commitRecognitionText(textToCommit);
        }

        acceptLateResult = false;
        resetMicVisualState();
        if(wasActive && !textToCommit){
          openSpeechFallback();
        }else if(!dictation.classList.contains('composing')){
          dictation.classList.remove('show');
        }
        finalTranscript = '';
        liveTranscriptDraft = '';
        setLiveTranscript('');
      };

      recognition.onerror = event => {
        if((listening || recognitionStarting) && event.error !== 'aborted'){
          openSpeechFallback();
        }
      };
    }else{
      micBtn.classList.add('unsupported');
    }

    document.addEventListener('click', event => {
      const clickedButton = event.target.closest('button');

      if(!clickedButton || clickedButton === micBtn || clickedButton.id === 'readBtn'){
        return;
      }

      if(
        clickedButton === speechFallbackAdd ||
        clickedButton === speechFallbackCancel
      ){
        return;
      }

      stopAllSpeechActivity({
        preserveFallbackText:false,
        hidePanels:true
      });
    }, true);

    micBtn.onclick = event => {
      closeLibraries();
      animateButton(event.currentTarget);

      if(speechFallback.classList.contains('show')){
        closeSpeechFallback();
        return;
      }

      stopReadAloud();
      if(!recognition){
        openSpeechFallback(true);
        return;
      }

      if(listening){
        stopAndCommitRecognition();
        return;
      }

      if(recognitionStarting){
        stopRecognitionSession(true);
        resetMicVisualState();
        dictation.classList.remove('show');
        return;
      }

      recognitionStarting = true;
      resultCommitted = false;
      acceptLateResult = false;
      finalTranscript = '';
      liveTranscriptDraft = '';
      setLiveTranscript('');

      micBtn.classList.add('listening');
      micBtn.textContent = '■';
      dictation.classList.add('show');
      dictationLabel.textContent = 'Starting microphone';
      liveText.textContent = 'Getting ready...';

      recognitionWatchdog = setTimeout(() => {
        openSpeechFallback();
        stopRecognitionSession(true);
      }, isAndroid ? 3500 : 5000);

      try{
        recognition.start();
      }catch(error){
        openSpeechFallback(true);
      }
    };

    speechFallbackAdd.onclick = event => {
      const fallbackText = speechFallbackInput.value.trim();

      if(fallbackText){
        addMessage(fallbackText);
        animateButton(event.currentTarget);
        closeSpeechFallback();
      }else{
        animateButton(event.currentTarget, 'warning');
      }
    };

    speechFallbackCancel.onclick = () => {
      closeSpeechFallback();
    };

    /* =========================================================
       TEXT-TO-SPEECH COMPATIBILITY
       Start the first utterance on the tap and play one chunk at a
       time so a voice failure cannot strand the whole speech queue.
       ========================================================= */
    function splitSpeechText(text, maximumLength = 150){
      const sentences = text
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean);

      const chunks = [];
      let current = '';

      sentences.forEach(sentence => {
        const candidate =
          current ? current + ' ' + sentence : sentence;

        if(candidate.length <= maximumLength){
          current = candidate;
          return;
        }

        if(current){
          chunks.push(current);
        }

        if(sentence.length <= maximumLength){
          current = sentence;
          return;
        }

        const words = sentence.split(/\s+/);
        current = '';

        words.forEach(word => {
          const wordCandidate =
            current ? current + ' ' + word : word;

          if(wordCandidate.length > maximumLength && current){
            chunks.push(current);
            current = word;
          }else{
            current = wordCandidate;
          }
        });
      });

      if(current){
        chunks.push(current);
      }

      return chunks;
    }

    const speechEngine = window.speechSynthesis;
    // Some browsers load the device voice list after the first request.
    speechEngine?.getVoices();

    let activeReading = null;

    function preferredStoryVoices(){
      const englishVoices = speechEngine.getVoices().filter(voice =>
        voice.localService && /^en(?:-|$)/i.test(voice.lang)
      );
      const rank = voice => (/^en-US$/i.test(voice.lang) ? 2 : 0) + Number(voice.default);
      return englishVoices.sort((first, second) => rank(second) - rank(first));
    }

    function finishReadAloud(reading, cancel = false){
      if(activeReading !== reading){
        return;
      }

      activeReading = null;
      clearTimeout(reading.timer);
      reading.button.classList.remove('dm-reading');
      reading.button.setAttribute('aria-pressed', 'false');
      if(cancel){
        speechEngine.cancel();
      }
      if(reading.previousAudioType !== undefined){
        navigator.audioSession.type = reading.previousAudioType;
      }
    }

    function stopReadAloud(){
      if(activeReading){
        finishReadAloud(activeReading, true);
      }
    }

    function speakStoryText(text, readButton){
      if(!speechEngine || typeof SpeechSynthesisUtterance === 'undefined'){
        showToast('Read Aloud is unavailable in this browser.');
        return;
      }

      const chunks = splitSpeechText(text);
      const reading = { button:readButton, timer:null, utterance:null, previousAudioType:undefined };
      activeReading = reading;
      readButton.classList.add('dm-reading');
      readButton.setAttribute('aria-pressed', 'true');

      // Request media playback on browsers that expose the audio session.
      // Restore the prior category before the microphone is used again.
      try{
        if(navigator.audioSession){
          const previousType = navigator.audioSession.type;
          navigator.audioSession.type = 'playback';
          reading.previousAudioType = previousType;
        }
      }catch(error){
        console.debug('Could not set the playback audio session:', error);
      }

      let chunkIndex = 0;
      let voice = preferredStoryVoices()[0] ?? null;
      let reportedStart = false;

      function speakChunk(retrying = false){
        if(activeReading !== reading){
          return;
        }

        const chunk = chunks[chunkIndex];
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = voice?.lang || 'en-US';
        if(voice){
          utterance.voice = voice;
        }
        utterance.rate = .88;
        utterance.volume = 1;
        reading.utterance = utterance;
        const isCurrent = () => activeReading === reading && reading.utterance === utterance;
        const submittedAt = Date.now();

        function failChunk(reason){
          if(!isCurrent()){
            return;
          }

          if(retrying || reason === 'not-allowed'){
            finishReadAloud(reading, true);
            showToast(reason === 'not-allowed'
              ? 'This browser blocked speech. Tap the speaker again.'
              : 'Read Aloud could not play. Tap the speaker to try again.');
            return;
          }

          clearTimeout(reading.timer);
          reading.utterance = null;
          const alternate = preferredStoryVoices().find(candidate => !voice ||
            (candidate.voiceURI || candidate.name) !== (voice.voiceURI || voice.name));
          voice = alternate ?? null;
          showToast('Retrying Read Aloud…');
          // Let the browser finish its current speech callback before
          // resetting its queue and submitting another utterance.
          reading.timer = setTimeout(() => {
            if(activeReading === reading){
              speechEngine.cancel();
              speakChunk(true);
            }
          }, 0);
        }

        utterance.onstart = () => {
          if(!isCurrent()){
            return;
          }

          clearTimeout(reading.timer);
          reading.timer = setTimeout(() => failChunk('timeout'), Math.max(15000, chunk.length * 160 + 10000));
          if(!reportedStart){
            reportedStart = true;
            showToast('Reading story…');
          }
        };

        utterance.onerror = event => failChunk(event.error);
        utterance.onend = () => {
          if(!isCurrent()){
            return;
          }

          // Some voices report completion immediately without speaking.
          if(chunk.length >= 4 && /\p{L}/u.test(chunk) && Date.now() - submittedAt < 150){
            failChunk('empty-playback');
            return;
          }

          clearTimeout(reading.timer);
          reading.utterance = null;
          chunkIndex += 1;
          if(chunkIndex < chunks.length){
            reading.timer = setTimeout(speakChunk, 0);
          }else{
            finishReadAloud(reading);
          }
        };

        reading.timer = setTimeout(() => failChunk('timeout'), isAppleMobile ? 11000 : 6500);
        try{
          if(speechEngine.paused){
            speechEngine.resume();
          }
          speechEngine.speak(utterance);
        }catch(error){
          failChunk(error.name === 'NotAllowedError' ? 'not-allowed' : 'synthesis-failed');
        }
      }

      showToast('Starting Read Aloud…');
      if(speechEngine.speaking || speechEngine.pending){
        speechEngine.cancel();
      }
      speakChunk();
    }

    /* =========================================================
       READ STORY ALOUD
       Reads all message bubbles in their current page order.
       ========================================================= */
    document.getElementById('readBtn').onclick = event => {
      if(activeReading){
        stopReadAloud();
        return;
      }

      stopAllSpeechActivity({
        preserveFallbackText:false,
        hidePanels:true
      });

      const readButton = event.currentTarget;

      const readableItems = [
        ...contentLayer.querySelectorAll(
          '.message, .sticker[data-readable-text]'
        )
      ]
      .filter(element =>
        (element.dataset.readableText || element.textContent).trim()
      )
      .sort((first, second) => {
        const firstLeft = parseFloat(first.style.left) || 0;
        const secondLeft = parseFloat(second.style.left) || 0;
        const pageDifference = Math.floor(firstLeft / 800) - Math.floor(secondLeft / 800);
        if(pageDifference){
          return pageDifference;
        }

        const firstTop = parseFloat(first.style.top) || 0;
        const secondTop = parseFloat(second.style.top) || 0;

        if(Math.abs(firstTop - secondTop) > 8){
          return firstTop - secondTop;
        }

        return firstLeft - secondLeft;
      });

      const storyText = readableItems
        .map(element =>
          (
            element.dataset.readableText ||
            element.textContent
          ).trim()
        )
        .map(words => /[.!?]$/.test(words) ? words : words + '.')
        .join(' ');

      if(!storyText){
        animateButton(readButton, 'warning');
        showToast('Add words to your story first.');
        return;
      }

      animateButton(readButton);
      speakStoryText(storyText, readButton);
    };

    /* =========================================================
       RESET STORY CANVAS
       Clears:
       - Drawings
       - Messages
       - Stickers
       - Artboard position
       ========================================================= */
    document.getElementById('resetBtn').onclick = event => {
      animateButton(event.currentTarget, 'warning');

      artX = 0;
      artY = 0;
      messageCount = 0;
      layoutSlots.length = 0;

      updateTransform();
      sizeScratch();

      contentLayer.innerHTML = '';
      hint.style.opacity = '1';
      drawTarget.classList.remove('show');

      setMode('pan');
    };

    /* =========================================================
       EXPORT FULL ARTBOARD AS JPG
       Renders the complete spread, including drawings, text,
       emojis, stickers and photos.
       ========================================================= */
    function drawExportImage(context, image, style){
      if(!image.complete || !image.naturalWidth || !image.naturalHeight){
        return;
      }

      const x = image.offsetLeft;
      const y = image.offsetTop;
      const width = image.offsetWidth;
      const height = image.offsetHeight;
      const leftBorder = parseFloat(style.borderLeftWidth);
      const topBorder = parseFloat(style.borderTopWidth);
      const innerWidth = width - leftBorder - parseFloat(style.borderRightWidth);
      const innerHeight = height - topBorder - parseFloat(style.borderBottomWidth);
      if(innerWidth <= 0 || innerHeight <= 0){
        return;
      }

      const widthRatio = innerWidth / image.naturalWidth;
      const heightRatio = innerHeight / image.naturalHeight;
      const cover = style.objectFit === 'cover';
      const scale = cover ? Math.max(widthRatio, heightRatio) : Math.min(widthRatio, heightRatio);
      const drawnWidth = image.naturalWidth * scale;
      const drawnHeight = image.naturalHeight * scale;
      const innerX = x + leftBorder;
      const innerY = y + topBorder;

      if(leftBorder || topBorder){
        context.fillStyle = style.backgroundColor;
        context.fillRect(x, y, width, height);
      }

      context.save();
      context.beginPath();
      context.rect(innerX, innerY, innerWidth, innerHeight);
      context.clip();
      context.drawImage(
        image,
        innerX + (innerWidth - drawnWidth) / 2,
        innerY + (innerHeight - drawnHeight) / 2,
        drawnWidth,
        drawnHeight
      );
      context.restore();
    }

    function drawExportText(context, element, style, origin, scale){
      const node = element.firstChild;
      if(!node){
        return;
      }

      const range = document.createRange();
      const source = node.textContent;
      const graphemes = typeof Intl.Segmenter === 'function'
        ? new Intl.Segmenter().segment(source)
        : Array.from(source, segment => ({ segment }));
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.2;
      const lines = [];
      let index = 0;

      // Read the actual browser line breaks, including long words wrapped
      // by CSS. Range coordinates include the current storyboard zoom.
      for(const { segment } of graphemes){
        range.setStart(node, index);
        index += segment.length;
        range.setEnd(node, index);
        const rect = range.getBoundingClientRect();
        if(!rect.width || !rect.height){
          continue;
        }

        const line = lines[lines.length - 1];
        if(!line || Math.abs(rect.top - line.top) >= lineHeight * scale / 2){
          lines.push({ text:segment, left:rect.left, top:rect.top });
        }else{
          line.text += segment;
          line.left = Math.min(line.left, rect.left);
        }
      }

      context.save();
      context.fillStyle = style.color;
      context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      context.direction = style.direction;
      context.textAlign = 'left';
      context.textBaseline = 'alphabetic';
      if('letterSpacing' in context){
        context.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
      }

      for(const line of lines){
        const text = line.text.replace(/[ \t\n\r\f]+/g, ' ').replace(/^ | $/g, '');
        const metrics = context.measureText(text);
        const ascent = metrics.fontBoundingBoxAscent ?? parseFloat(style.fontSize) * .8;
        context.fillText(
          text,
          (line.left - origin.left) / scale,
          (line.top - origin.top) / scale + ascent
        );
      }
      context.restore();
    }

    function renderJPG(){
      const boardWidth = scratch.width;
      const boardHeight = scratch.height;
      const frame = 48;
      const footerHeight = 82;
      const spreadWidth = boardWidth + frame * 2;
      const spreadHeight = boardHeight + frame * 2;
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = spreadWidth;
      outputCanvas.height = spreadHeight + footerHeight;
      const outputContext = outputCanvas.getContext('2d');

      // Extend the viewport's rainbow gradient around the entire spread.
      const theme = getComputedStyle(viewport);
      const colors = ['--cyan', '--purple', '--pink', '--orange', '--yellow', '--lime'];
      const centerX = spreadWidth / 2;
      const centerY = spreadHeight / 2;
      const diagonal = (spreadWidth + spreadHeight) / 4;
      const background = outputContext.createLinearGradient(
        centerX - diagonal, centerY - diagonal,
        centerX + diagonal, centerY + diagonal
      );
      colors.forEach((color, index) => {
        background.addColorStop(index / (colors.length - 1), theme.getPropertyValue(color).trim());
      });
      outputContext.fillStyle = background;
      outputContext.fillRect(0, 0, spreadWidth, spreadHeight);

      outputContext.save();
      outputContext.translate(frame, frame);
      outputContext.beginPath();
      outputContext.rect(0, 0, boardWidth, boardHeight);
      outputContext.clip();

      const paper = outputContext.createLinearGradient(0, 0, boardWidth, 0);
      paper.addColorStop(0, '#fffdf8');
      paper.addColorStop(.492, '#fffdf8');
      paper.addColorStop(.4994, '#ece8e0');
      paper.addColorStop(.5, '#c6beb4');
      paper.addColorStop(.5006, '#f1eee7');
      paper.addColorStop(.509, '#fffefa');
      paper.addColorStop(1, '#fffefa');
      outputContext.fillStyle = paper;
      outputContext.fillRect(0, 0, boardWidth, boardHeight);

      outputContext.drawImage(scratch, 0, 0);
      const origin = contentLayer.getBoundingClientRect();
      const scale = artboard.getBoundingClientRect().width / artboard.offsetWidth;
      const items = Array.from(contentLayer.children, element => ({
        element,
        style:getComputedStyle(element)
      }));
      items.sort((first, second) => Number(first.style.zIndex) - Number(second.style.zIndex));
      for(const { element, style } of items){
        if(element.tagName === 'IMG'){
          drawExportImage(outputContext, element, style);
        }else{
          drawExportText(outputContext, element, style, origin, scale);
        }
      }
      outputContext.restore();

      // The watermark sits below the frame so it cannot cover artwork.
      outputContext.fillStyle = '#202024';
      outputContext.fillRect(0, spreadHeight, spreadWidth, footerHeight);

      const watermarkGradient = outputContext.createLinearGradient(
        centerX - 280,
        0,
        centerX + 280,
        0
      );

      watermarkGradient.addColorStop(0, '#00eaff');
      watermarkGradient.addColorStop(.3, '#7c5cff');
      watermarkGradient.addColorStop(.55, '#ff3dbb');
      watermarkGradient.addColorStop(.78, '#ffe45c');
      watermarkGradient.addColorStop(1, '#8cff54');

      outputContext.fillStyle = watermarkGradient;
      outputContext.font = '900 38px Arial';
      outputContext.textAlign = 'center';
      outputContext.textBaseline = 'middle';
      outputContext.fillText(
        'DARKMODE STORIES',
        outputCanvas.width / 2,
        spreadHeight + footerHeight / 2
      );

      // Build the File synchronously so iOS can open its share sheet
      // while the Save tap still grants user activation.
      const encoded = outputCanvas.toDataURL('image/jpeg', .92);
      const bytes = Uint8Array.from(atob(encoded.split(',')[1]), char => char.charCodeAt(0));
      return new File([bytes], `DARKMODE-STORIES-STORY-${Date.now()}.jpg`, { type:'image/jpeg' });
    }

    function downloadJPG(file){
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.hidden = true;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      showToast('JPG sent to your browser downloads.');
    }

    async function saveJPG(){
      const loadingArtwork = [...contentLayer.querySelectorAll('img')].some(image => !image.complete);
      if(loadingArtwork){
        showToast('Artwork is loading. Tap Save again in a moment.');
        return;
      }

      const file = renderJPG();
      const shareData = { files:[file] };

      if(isAppleMobile && navigator.share && navigator.canShare?.(shareData)){
        showToast('Choose Save to Files and pick a folder.');
        try{
          await navigator.share(shareData);
          return;
        }catch(error){
          if(error.name === 'AbortError'){
            return;
          }
        }
      }

      downloadJPG(file);
    }

    /* Shows a brief status message */
    let toastTimeout;
    function showToast(message){
      toast.textContent = message;
      toast.classList.add('show');

      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
      }, 3200);
    }

    document.getElementById('exportBtn').onclick = event => {
      animateButton(event.currentTarget);
      saveJPG().catch(error => {
        console.warn('Could not export story JPG:', error);
        showToast('The JPG could not be created. Tap Save to try again.');
      });
    };
