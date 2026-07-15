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
          'assets/stickers/manifest.json',
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
          'Add image files to assets/stickers and push to GitHub.';

        grid.appendChild(fallbackMessage);
        console.warn(error);
      }
    }

    fillLibrary('emojiGrid', emojis);

    /* Sticker buttons are loaded from assets/stickers/manifest.json.
       A GitHub Action regenerates that file whenever sticker artwork
       is added to or removed from the sticker folder. */
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
      artboard.style.transform =
        `translate(calc(-50% + ${artX}px), calc(-50% + ${artY}px))`;

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
    function addSticker(symbol){
      hint.style.opacity = '0';

      const element = document.createElement('div');
      element.className = 'sticker';
      element.textContent = symbol;
      element.dataset.readableText =
        /[\p{L}\p{N}]/u.test(symbol) ? symbol : '';

      element.style.left = (800 + (-artX) + Math.random() * 80 - 40) + 'px';
      element.style.top = (600 + (-artY) + Math.random() * 80 - 40) + 'px';

      contentLayer.appendChild(element);
      makeDraggable(element);
    }

    /* Adds an original image sticker loaded from the sticker folder. */
    function addImageSticker(sticker){
      hint.style.opacity = '0';

      const image = document.createElement('img');
      image.className = 'sticker sticker-image';
      image.src = sticker.src;
      image.alt = sticker.name;

      image.style.left =
        (800 + (-artX) + Math.random() * 80 - 40) + 'px';
      image.style.top =
        (600 + (-artY) + Math.random() * 80 - 40) + 'px';

      contentLayer.appendChild(image);
      makeDraggable(image);
    }

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

        x = Math.max(0, Math.min(x, 1530));
        y = Math.max(0, Math.min(y, 1120));

        element.style.left = x + 'px';
        element.style.top = y + 'px';
      });

      element.addEventListener('pointerup', event => {
        drag = false;
        element.classList.remove('is-dragging');
        element.style.zIndex = '12';

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

      const previousMessages = [
        ...contentLayer.querySelectorAll('.message')
      ];

      if(previousMessages.length){
        const previous = previousMessages[previousMessages.length - 1];
        const previousX = parseFloat(previous.style.left) || 24;
        const previousY = parseFloat(previous.style.top) || 24;
        const gap = 26;

        let messageX = previousX;
        let messageY =
          previousY +
          Math.max(previous.offsetHeight, 118) +
          gap;

        if(messageY > 1000){
          messageX = Math.min(previousX + 660, 940);
          messageY = 150;
        }

        element.style.left = messageX + 'px';
        element.style.top = messageY + 'px';
      }else{
        const viewportRect = viewport.getBoundingClientRect();
        const artboardRect = artboard.getBoundingClientRect();

        const visibleAnchorX =
          viewportRect.left + viewportRect.width * .5;

        const visibleAnchorY =
          viewportRect.top + viewportRect.height * .3;

        const scaleX = 1600 / artboardRect.width;
        const scaleY = 1200 / artboardRect.height;

        let messageX =
          (visibleAnchorX - artboardRect.left) * scaleX - 220;

        let messageY =
          (visibleAnchorY - artboardRect.top) * scaleY;

        messageX = Math.max(24, Math.min(messageX, 940));
        messageY = Math.max(24, Math.min(messageY, 980));

        element.style.left = messageX + 'px';
        element.style.top = messageY + 'px';
      }

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
    const isAndroid = /Android/i.test(userAgent);
    const isSilk = /Silk\//i.test(userAgent);
    const isFireDevice = /KF[A-Z]{2,}|Fire/i.test(userAgent);

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
    let lastCommittedTranscript = '';
    let recognitionWatchdog = null;
    let resultCommitted = false;
    let liveTranscriptDraft = '';
    let speechSessionId = 0;

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
      dictation.classList.remove('show');
      resetMicVisualState();
    }

    function openSpeechFallback(message){
      resetMicVisualState();

      micBtn.classList.add('unsupported');
      dictation.classList.add('show');
      speechFallback.classList.add('show');

      dictationLabel.textContent = 'Keyboard Dictation';
      liveText.textContent = message;

      setTimeout(() => {
        speechFallbackInput.focus();
      }, 120);
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

      if(normalized === lastCommittedTranscript){
        return false;
      }

      resultCommitted = true;
      lastCommittedTranscript = normalized;
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

      resetMicVisualState();
      micBtn.classList.remove('unsupported');

      if('speechSynthesis' in window){
        speechSynthesis.cancel();
      }

      if(!preserveFallbackText){
        speechFallbackInput.value = '';
      }

      speechFallbackInput.blur();
      nativeEmojiInput.blur();

      if(hidePanels){
        speechFallback.classList.remove('show');
        dictation.classList.remove('show');
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
        dictation.classList.remove('show');
      }
    }

    const canUseBrowserRecognition =
      Boolean(SpeechRecognition) && !isSilk;

    if(canUseBrowserRecognition){
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = !isAndroid;
      recognition.interimResults = !isAndroid;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        clearTimeout(recognitionWatchdog);
        recognitionWatchdog = null;

        listening = true;
        recognitionStarting = false;
        resultCommitted = false;
        finalTranscript = '';
        liveTranscriptDraft = '';
        speechSessionId += 1;

        micBtn.classList.remove('unsupported');
        micBtn.classList.add('listening');
        micBtn.textContent = '■';

        speechFallback.classList.remove('show');
        dictation.classList.add('show');
        dictationLabel.textContent =
          isAndroid ? 'Listening — one phrase' : 'Listening';
        setLiveTranscript('');
      };

      recognition.onresult = event => {
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
        const textToCommit =
          liveTranscriptDraft ||
          finalTranscript;

        if(textToCommit && !resultCommitted){
          commitRecognitionText(textToCommit);
        }

        resetMicVisualState();
        dictation.classList.remove('show');
        finalTranscript = '';
        liveTranscriptDraft = '';
        setLiveTranscript('');
      };

      recognition.onerror = event => {
        resetMicVisualState();

        const errorName = event?.error || 'unknown';

        if(
          errorName === 'not-allowed' ||
          errorName === 'service-not-allowed' ||
          errorName === 'audio-capture'
        ){
          openSpeechFallback(
            'Browser microphone recognition is unavailable. Use the keyboard microphone below.'
          );
        }else{
          dictation.classList.remove('show');
        }
      };
    }else{
      micBtn.classList.add('unsupported');
    }

    document.addEventListener('click', event => {
      const clickedButton = event.target.closest('button');

      if(!clickedButton || clickedButton === micBtn){
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

      if(isSilk || !canUseBrowserRecognition){
        if(speechFallback.classList.contains('show')){
          closeSpeechFallback();
        }else{
          openSpeechFallback(
            'Tap the field, then use the microphone on the Fire keyboard.'
          );
        }
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
      finalTranscript = '';
      liveTranscriptDraft = '';
      setLiveTranscript('');

      micBtn.classList.add('listening');
      micBtn.textContent = '■';
      dictation.classList.add('show');
      dictationLabel.textContent = 'Starting microphone';
      liveText.textContent = 'Getting ready...';

      recognitionWatchdog = setTimeout(() => {
        stopRecognitionSession(true);
        resetMicVisualState();

        if(isFireDevice){
          openSpeechFallback(
            'Silk could not start speech recognition. Use the keyboard microphone below.'
          );
        }else{
          dictation.classList.remove('show');
        }
      }, isAndroid ? 3500 : 5000);

      try{
        recognition.start();
      }catch(error){
        resetMicVisualState();
        openSpeechFallback(
          'Speech recognition could not start. Use keyboard dictation below.'
        );
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
       Silk can expose speechSynthesis but fail silently. This helper:
       - resumes a paused engine
       - waits briefly for voices
       - speaks shorter chunks
       - confirms that speech actually starts
       - shows a clear notice if the browser blocks TTS
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

    function chooseEnglishVoice(){
      if(!('speechSynthesis' in window)){
        return null;
      }

      const voices = window.speechSynthesis.getVoices();

      return (
        voices.find(voice =>
          /^en-US$/i.test(voice.lang)
        ) ||
        voices.find(voice =>
          /^en/i.test(voice.lang)
        ) ||
        voices[0] ||
        null
      );
    }

    function speakStoryText(text, readButton){
      if(
        !('speechSynthesis' in window) ||
        typeof SpeechSynthesisUtterance === 'undefined'
      ){
        readButton.classList.remove('dm-reading');
        showToast('Read aloud is not available in this browser.');
        return;
      }

      const engine = window.speechSynthesis;
      const chunks = splitSpeechText(text);
      let chunkIndex = 0;
      let speechStarted = false;
      let startWatchdog = null;

      engine.cancel();
      engine.resume();

      function finishReading(){
        clearTimeout(startWatchdog);
        readButton.classList.remove('dm-reading');
      }

      function speakNextChunk(){
        if(chunkIndex >= chunks.length){
          finishReading();
          return;
        }

        const utterance =
          new SpeechSynthesisUtterance(chunks[chunkIndex]);

        utterance.rate = .88;
        utterance.pitch = 1.05;
        utterance.volume = 1;

        const voice = chooseEnglishVoice();
        if(voice){
          utterance.voice = voice;
          utterance.lang = voice.lang || 'en-US';
        }else{
          utterance.lang = 'en-US';
        }

        utterance.onstart = () => {
          speechStarted = true;
          clearTimeout(startWatchdog);
        };

        utterance.onend = () => {
          chunkIndex += 1;
          setTimeout(speakNextChunk, 70);
        };

        utterance.onerror = () => {
          finishReading();
          showToast('The browser could not read this story aloud.');
        };

        engine.resume();
        engine.speak(utterance);

        startWatchdog = setTimeout(() => {
          if(!speechStarted && !engine.speaking){
            engine.cancel();
            finishReading();

            if(isSilk || isFireDevice){
              showToast('Silk is blocking Read Aloud on this tablet.');
            }else{
              showToast('Read Aloud did not start. Tap again to retry.');
            }
          }
        }, 1600);
      }

      /* Some engines populate voices asynchronously after the click. */
      if(engine.getVoices().length){
        speakNextChunk();
      }else{
        const voiceWait = setTimeout(speakNextChunk, 300);

        engine.addEventListener(
          'voiceschanged',
          () => {
            clearTimeout(voiceWait);
            speakNextChunk();
          },
          { once:true }
        );
      }
    }

    /* =========================================================
       READ STORY ALOUD
       Reads all message bubbles in their current page order.
       ========================================================= */
    document.getElementById('readBtn').onclick = event => {
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
        const firstTop = parseFloat(first.style.top) || 0;
        const secondTop = parseFloat(second.style.top) || 0;

        if(Math.abs(firstTop - secondTop) > 8){
          return firstTop - secondTop;
        }

        return
          (parseFloat(first.style.left) || 0) -
          (parseFloat(second.style.left) || 0);
      });

      const storyText = readableItems
        .map(element =>
          (
            element.dataset.readableText ||
            element.textContent
          ).trim()
        )
        .join('. ');

      if(!storyText){
        animateButton(readButton, 'warning');
        return;
      }

      animateButton(readButton);
      readButton.classList.add('dm-reading');

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

      updateTransform();
      sizeScratch();

      contentLayer.innerHTML = '';
      hint.style.opacity = '1';
      drawTarget.classList.remove('show');

      setMode('pan');
    };

    /* =========================================================
       EXPORT FULL ARTBOARD AS JPG
       Renders:
       - Rainbow background
       - Thick black brush artwork
       - Messages
       - Emojis and stickers

       Note:
       Browser behavior determines whether the file lands in
       Downloads or another device folder.
       ========================================================= */
    function exportJPG(){
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = 1600;
      outputCanvas.height = 1200;

      const outputContext = outputCanvas.getContext('2d');

      /* Rebuild the rainbow gradient in the exported image */
      const gradient = outputContext.createLinearGradient(
        0,
        0,
        1600,
        1200
      );

      gradient.addColorStop(0, '#00eaff');
      gradient.addColorStop(.23, '#7c5cff');
      gradient.addColorStop(.43, '#ff3dbb');
      gradient.addColorStop(.62, '#ff8c42');
      gradient.addColorStop(.79, '#ffe45c');
      gradient.addColorStop(1, '#8cff54');

      outputContext.fillStyle = gradient;
      outputContext.fillRect(0, 0, 1600, 1200);

      /* Places the scratch layer over the gradient */
      outputContext.drawImage(scratch, 0, 0);

      /* Draw each draggable object onto the export canvas */
      [...contentLayer.children].forEach(element => {
        const x = parseFloat(element.style.left) || 0;
        const y = parseFloat(element.style.top) || 0;

        if(element.classList.contains('message')){
          const width = 620;
          const height = 132;

          outputContext.fillStyle = 'rgba(8,12,22,.92)';
          roundRect(outputContext, x, y, width, height, 22);
          outputContext.fill();

          outputContext.strokeStyle = 'rgba(255,255,255,.15)';
          outputContext.lineWidth = 2;
          roundRect(outputContext, x, y, width, height, 22);
          outputContext.stroke();

          outputContext.fillStyle = '#ffffff';
          outputContext.font = '900 46px Arial';

          wrapText(
            outputContext,
            element.textContent,
            x + 20,
            y + 40,
            width - 40,
            52
          );
        }

        if(
          element.classList.contains('sticker') &&
          element.tagName === 'IMG'
        ){
          outputContext.drawImage(element, x, y, 92, 92);
        }else if(element.classList.contains('sticker')){
          outputContext.font = '72px Arial';
          outputContext.fillText(
            element.textContent,
            x,
            y + 70
          );
        }
      });

      /* Add a branded screenshot footer and centered watermark. */
      const watermarkHeight = 82;

      outputContext.fillStyle = 'rgba(2,2,4,.88)';
      outputContext.fillRect(
        0,
        outputCanvas.height - watermarkHeight,
        outputCanvas.width,
        watermarkHeight
      );

      const watermarkGradient = outputContext.createLinearGradient(
        520,
        0,
        1080,
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
        outputCanvas.height - watermarkHeight / 2
      );

      /* Starts a browser JPG download */
      const downloadLink = document.createElement('a');

      downloadLink.download =
        'darkmode-stories-' +
        Date.now() +
        '.jpg';

      downloadLink.href =
        outputCanvas.toDataURL('image/jpeg', .92);

      downloadLink.click();

      showToast('JPG download started');
    }

    /* Helper: draws rounded rectangles on canvas */
    function roundRect(context, x, y, width, height, radius){
      context.beginPath();
      context.moveTo(x + radius, y);
      context.arcTo(x + width, y, x + width, y + height, radius);
      context.arcTo(x + width, y + height, x, y + height, radius);
      context.arcTo(x, y + height, x, y, radius);
      context.arcTo(x, y, x + width, y, radius);
      context.closePath();
    }

    /* Helper: wraps long message text across multiple lines */
    function wrapText(context, text, x, y, maxWidth, lineHeight){
      const words = text.split(' ');
      let line = '';

      for(let index = 0; index < words.length; index++){
        const testLine = line + words[index] + ' ';

        if(
          context.measureText(testLine).width > maxWidth &&
          index > 0
        ){
          context.fillText(line, x, y);
          line = words[index] + ' ';
          y += lineHeight;
        }else{
          line = testLine;
        }
      }

      context.fillText(line, x, y);
    }

    /* Shows a brief confirmation message */
    function showToast(message){
      toast.textContent = message;
      toast.classList.add('show');

      setTimeout(() => {
        toast.classList.remove('show');
      }, 2200);
    }

    document.getElementById('exportBtn').onclick = event => {
      animateButton(event.currentTarget);
      exportJPG();
    };