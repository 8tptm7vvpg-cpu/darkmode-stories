import { createTour } from './DARKMODE-STORIES-TOUR-0001.js?v=0.18.0';

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
    const spread = document.getElementById('spread');
    const artboard = document.getElementById('artboard');
    const scratch = document.getElementById('scratch');
    const ctx = scratch.getContext('2d');
    const contentLayer = document.getElementById('contentLayer');
    const lockBtn = document.getElementById('lockBtn');
    const modeBadge = document.getElementById('modeBadge');
    const micBtn = document.getElementById('micBtn');
    const dictation = document.getElementById('dictation');
    const liveText = document.getElementById('liveText');
    const emojiLibrary = document.getElementById('emojiLibrary');
    const emojiBtn = document.getElementById('emojiBtn');
    const paintControls = document.getElementById('paintControls');
    const playbackCaption = document.getElementById('playbackCaption');
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

    const boardWidth = 1600;
    const boardHeight = 1200;
    const maximumZoom = 4;
    let zoom = null;
    const pointers = new Map();
    const itemTransforms = new WeakMap();
    let interaction = null;
    let tourActive = false;
    let wipe = null;

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
    function setPaintPanel(open){
      paintControls.classList.toggle('show', open);
      lockBtn.setAttribute('aria-expanded', String(open));
    }

    function closeLibraries(){
      emojiLibrary.classList.remove('show');
      emojiBtn.setAttribute('aria-expanded', 'false');
      setPaintPanel(false);
    }

    emojiBtn.onclick = event => {
      const open = !emojiLibrary.classList.contains('show');
      closeLibraries();
      emojiLibrary.classList.toggle('show', open);
      emojiBtn.setAttribute('aria-expanded', String(open));
      if(open){
        nativeEmojiInput.focus({ preventScroll:true });
      }
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
    const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

    function fitScale(){
      return Math.max(.01, Math.min(
        (viewport.clientWidth - 28) / (boardWidth + 56),
        (viewport.clientHeight - 28) / (boardHeight + 33),
        1
      ));
    }

    function boardScale(){
      const width = viewport.clientWidth;
      const fit = fitScale();
      const compact = width <= 720 || window.matchMedia('(pointer: coarse)').matches;
      const homeScale = compact
        ? Math.min(width <= 600 ? .52 : .72, (width - 25) / (boardWidth / 2))
        : fit;
      return zoom === null
        ? clamp(homeScale, fit, fit * maximumZoom)
        : fit * zoom;
    }

    function updateTransform(){
      const width = viewport.clientWidth;
      const height = viewport.clientHeight;
      const scale = boardScale();
      const gutter = width <= 600 || window.matchMedia('(pointer: coarse)').matches ? 25 : 0;
      const horizontalTravel = Math.max(0, (boardWidth * scale - width) / 2 + gutter);
      const verticalTravel = Math.max(0, (boardHeight * scale - height) / 2 + gutter);
      const homeX = zoom === null && boardWidth * scale > width ? horizontalTravel : 0;
      const homeY = zoom === null && boardHeight * scale > height ? verticalTravel : 0;
      const offsetX = zoom === 1 ? 0 : clamp(homeX + artX, -horizontalTravel, horizontalTravel);
      const offsetY = zoom === 1 ? 0 : clamp(homeY + artY, -verticalTravel, verticalTravel);
      artX = offsetX - homeX;
      artY = offsetY - homeY;

      spread.style.transform =
        `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${scale})`;

      document.documentElement.style.setProperty('--px', offsetX + 'px');
      document.documentElement.style.setProperty('--py', offsetY + 'px');
    }

    function setMode(nextMode){
      mode = nextMode;
      const drawModeActive = mode === 'draw';
      lockBtn.setAttribute('aria-pressed', String(drawModeActive));
      lockBtn.classList.toggle('locked', drawModeActive);
      modeBadge.textContent = drawModeActive ? 'DRAW MODE' : 'STORY MODE';
      setPaintPanel(false);
    }

    lockBtn.onclick = event => {
      const panelOpen = paintControls.classList.contains('show');
      closeLibraries();
      if(panelOpen){
        setMode('pan');
      }else{
        setMode('draw');
        setPaintPanel(true);
      }
      animateButton(event.currentTarget);
    };
    document.getElementById('finishPaintBtn').onclick = () => setMode('pan');

    const brushWidth = document.getElementById('brushWidth');
    const brushWidthValue = document.getElementById('brushWidthValue');
    const brushStyle = document.getElementById('brushStyle');
    const brushColor = document.getElementById('brushColor');
    const brushHue = document.getElementById('brushHue');

    brushWidth.oninput = () => {
      brushWidthValue.textContent = brushWidth.value + ' px';
    };

    brushHue.oninput = () => {
      const hue = Number(brushHue.value) / 60;
      const transition = Math.round(255 * (1 - Math.abs(hue % 2 - 1)));
      const colors = [
        [255, transition, 0], [transition, 255, 0], [0, 255, transition],
        [0, transition, 255], [transition, 0, 255], [255, 0, transition]
      ];
      brushColor.value = '#' + colors[Math.floor(hue)]
        .map(channel => channel.toString(16).padStart(2, '0')).join('');
    };

    function sizeScratch(){
      scratch.width = boardWidth;
      scratch.height = boardHeight;
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

    function artPoint(event){
      const rect = artboard.getBoundingClientRect();
      return {
        x:(event.clientX - rect.left) * boardWidth / rect.width,
        y:(event.clientY - rect.top) * boardHeight / rect.height
      };
    }

    function moveDrawTarget(event, width){
      const viewportRect = viewport.getBoundingClientRect();
      drawTarget.style.left = (event.clientX - viewportRect.left - viewport.clientLeft) + 'px';
      drawTarget.style.top = (event.clientY - viewportRect.top - viewport.clientTop) + 'px';
      const diameter = Math.max(18, width * boardScale() + 8) + 'px';
      drawTarget.style.width = diameter;
      drawTarget.style.height = diameter;
      drawTarget.style.setProperty('--brush-color', brushColor.value);
    }

    function paintStroke(from, to, brush){
      ctx.save();
      ctx.fillStyle = brush.color;
      ctx.strokeStyle = brush.color;
      ctx.lineWidth = brush.width;
      ctx.lineCap = brush.cap;
      ctx.lineJoin = 'round';
      ctx.globalAlpha = brush.opacity;
      ctx.beginPath();
      if(from.x === to.x && from.y === to.y){
        if(brush.cap === 'square'){
          ctx.fillRect(to.x - brush.width / 2, to.y - brush.width / 2, brush.width, brush.width);
        }else{
          ctx.arc(to.x, to.y, brush.width / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }else{
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function currentBrush(){
      const style = brushStyle.value;
      return {
        width:Number(brushWidth.value) * (style === 'bold' ? 1.35 : 1),
        color:brushColor.value,
        cap:style === 'bold' ? 'square' : 'round',
        opacity:style === 'watercolor' ? .22 : 1
      };
    }

    function itemPosition(item){
      const x = parseFloat(item.style.left) + item.offsetWidth / 2;
      const y = parseFloat(item.style.top) + item.offsetHeight / 2;
      return { x, y };
    }

    function positionItem(item, x, y){
      item.style.left = clamp(x, 0, boardWidth) - item.offsetWidth / 2 + 'px';
      item.style.top = clamp(y, 0, boardHeight) - item.offsetHeight / 2 + 'px';
    }

    function applyItemTransform(item, transform){
      itemTransforms.set(item, transform);
      item.style.scale = String(transform.scale);
      item.style.rotate = transform.angle + 'rad';
    }

    function pinchMetrics(first, second){
      return {
        center:{
          clientX:(first.clientX + second.clientX) / 2,
          clientY:(first.clientY + second.clientY) / 2
        },
        distance:Math.max(1, Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY)),
        angle:Math.atan2(second.clientY - first.clientY, second.clientX - first.clientX)
      };
    }

    function startSingle(pointer, item, allowPaint){
      if(item){
        item.classList.add('is-dragging');
        interaction = { kind:'item', item, start:artPoint(pointer), origin:itemPosition(item) };
      }else if(mode === 'draw' && allowPaint && artboard.contains(pointer.target)){
        const point = artPoint(pointer);
        interaction = { kind:'paint', last:point, brush:currentBrush(), painted:false };
        moveDrawTarget(pointer, interaction.brush.width);
        drawTarget.classList.add('show');
      }else{
        interaction = { kind:'pan', start:pointer, x:artX, y:artY };
      }
    }

    function startPinch(){
      const [first, second] = pointers.values();
      const pinch = pinchMetrics(first, second);
      const anchor = artPoint(pinch.center);
      const item = first.item && (!second.item || second.item === first.item) ? first.item : null;
      if(interaction?.item !== item){
        interaction?.item?.classList.remove('is-dragging');
      }
      drawTarget.classList.remove('show');

      if(item){
        interaction = {
          kind:'item-pinch', item, pinch, anchor,
          origin:itemPosition(item), transform:itemTransforms.get(item) ?? { scale:1, angle:0 }
        };
      }else{
        interaction = { kind:'board-pinch', pinch, anchor, scale:boardScale() };
      }
    }

    function zoomBoard(scale, anchor, point){
      const fit = fitScale();
      zoom = clamp(scale / fit, 1, maximumZoom);
      const rect = viewport.getBoundingClientRect();
      const nextScale = boardScale();
      artX = point.clientX - rect.left - viewport.clientLeft - viewport.clientWidth / 2
        - (anchor.x - boardWidth / 2) * nextScale;
      artY = point.clientY - rect.top - viewport.clientTop - viewport.clientHeight / 2
        - (anchor.y - boardHeight / 2) * nextScale;
      updateTransform();
    }

    viewport.addEventListener('pointerdown', event => {
      if(tourActive || wipe || event.button !== 0 || pointers.size >= 2 || event.target.closest('.mode-badge,.playback-caption,.tour-controls')){
        return;
      }
      if(pointers.size && event.pointerType !== 'touch'){
        return;
      }
      closeLibraries();
      const item = mode === 'pan' ? event.target.closest('.message,.sticker') : null;
      pointers.set(event.pointerId, { clientX:event.clientX, clientY:event.clientY, target:event.target, item });
      (item || viewport).setPointerCapture(event.pointerId);
      if(pointers.size === 2){
        startPinch();
      }else{
        startSingle(pointers.get(event.pointerId), item, true);
      }
    });

    viewport.addEventListener('pointermove', event => {
      const pointer = pointers.get(event.pointerId);
      if(!pointer || !interaction){
        return;
      }
      pointer.clientX = event.clientX;
      pointer.clientY = event.clientY;

      const { kind, item, origin, start } = interaction;
      if(kind === 'item-pinch' || kind === 'board-pinch'){
        const pinch = pinchMetrics(...pointers.values());
        if(kind === 'board-pinch'){
          // On the spread, fingers moving closer zoom in. Spreading them fits more paper.
          zoomBoard(interaction.scale * interaction.pinch.distance / pinch.distance, interaction.anchor, pinch.center);
        }else{
          const center = artPoint(pinch.center);
          const angle = pinch.angle - interaction.pinch.angle;
          const scale = clamp(interaction.transform.scale * pinch.distance / interaction.pinch.distance, .25, 4);
          const ratio = scale / interaction.transform.scale;
          const dx = origin.x - interaction.anchor.x;
          const dy = origin.y - interaction.anchor.y;
          positionItem(item,
            center.x + ratio * (dx * Math.cos(angle) - dy * Math.sin(angle)),
            center.y + ratio * (dx * Math.sin(angle) + dy * Math.cos(angle))
          );
          const next = { scale, angle:interaction.transform.angle + angle };
          applyItemTransform(item, next);
        }
      }else if(kind === 'pan'){
        artX = interaction.x + (pointer.clientX - start.clientX);
        artY = interaction.y + (pointer.clientY - start.clientY);
        updateTransform();
      }else if(kind === 'item'){
        const point = artPoint(pointer);
        positionItem(item, origin.x + point.x - start.x, origin.y + point.y - start.y);
      }else if(kind === 'paint'){
        const point = artPoint(pointer);
        if(!interaction.painted && Math.hypot(point.x - interaction.last.x, point.y - interaction.last.y) < 2){
          return;
        }
        paintStroke(interaction.last, point, interaction.brush);
        interaction.last = point;
        interaction.painted = true;
        moveDrawTarget(pointer, interaction.brush.width);
      }
    });

    function finishPointer(event){
      if(!pointers.delete(event.pointerId)){
        return;
      }
      if(interaction?.kind === 'paint' && !interaction.painted && event.type === 'pointerup'){
        paintStroke(interaction.last, interaction.last, interaction.brush);
      }
      const item = interaction?.item;
      item?.classList.remove('is-dragging');
      interaction = null;
      drawTarget.classList.remove('show');

      if(pointers.size){
        const [remaining] = pointers.values();
        startSingle(remaining, item, false);
      }
    }

    viewport.addEventListener('pointerup', finishPointer);
    viewport.addEventListener('pointercancel', finishPointer);
    viewport.addEventListener('lostpointercapture', finishPointer);

    viewport.addEventListener('wheel', event => {
      if(tourActive || wipe || pointers.size || event.target.closest('.playback-caption')){
        return;
      }
      event.preventDefault();
      const step = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1;
      const nextScale = boardScale() * Math.exp(-event.deltaY * step * .002);
      zoomBoard(nextScale, artPoint(event), event);
    }, { passive:false });

    /* Editorial flow: left page first, then right page.
       A cell is reserved when an item is inserted; manual dragging
       remains independent of automatic placement. */
    const layoutSlots = [];
    function placeEditorialItem(element, kind){
      const pageInset = 62, columnGap = 18, rowGap = 20;
      const cellWidth = ['text','photo','file'].includes(kind) ? 310 : kind === 'decor' ? 250 : 110;
      const cellHeight = kind === 'text' ? 138 : kind === 'photo' ? 245 : kind === 'decor' ? 95 : 120;
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

      const element = document.createElement('div');
      element.className = 'sticker';
      element.textContent = symbol;
      placeEditorialItem(element, 'emoji');

      contentLayer.appendChild(element);
      return element;
    }

    /* Adds an original image sticker from the library. */
    function addImageSticker(sticker){

      const image = document.createElement('img');
      image.className = 'sticker sticker-image';
      image.src = sticker.src;
      image.alt = sticker.name;
      image.draggable = false;

      placeEditorialItem(image, 'decor');

      contentLayer.appendChild(image);
      return image;
    }

    // Device files stay in the browser. Unsupported visual formats get a file card.
    const photoInput = document.getElementById('photoInput');
    const fileUrls = new Set();
    const uploadBtn = document.getElementById('stickerBtn');

    uploadBtn.onclick = event => {
      closeLibraries();
      photoInput.click();
      animateButton(event.currentTarget);
    };

    function makeFileCard(file, url){
      const card = document.createElement('div');
      card.className = 'sticker file-sticker';
      card.textContent = file.name;
      card.tabIndex = 0;
      card.setAttribute('role', 'link');
      card.setAttribute('aria-label', 'Download ' + file.name);
      const download = () => {
        const link = document.createElement('a');
        link.href = url;
        link.download = file.name;
        link.click();
      };
      card.ondblclick = download;
      card.onkeydown = event => {
        if(event.key === 'Enter') download();
      };
      return card;
    }

    photoInput.addEventListener('change', async () => {
      const files = Array.from(photoInput.files);
      photoInput.value = '';
      for(const file of files){
        const url = URL.createObjectURL(file);
        fileUrls.add(url);
        if((file.type === 'text/plain' || /\.txt$/i.test(file.name)) && file.size <= 4096){
          const words = (await file.text().catch(() => '')).trim();
          if(!fileUrls.has(url)) break;
          if(words){
            addMessage(words);
            URL.revokeObjectURL(url);
            fileUrls.delete(url);
            continue;
          }
        }
        const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic|heif|avif|bmp|svg)$/i.test(file.name);
        let element;
        if(isImage){
          element = document.createElement('img');
          element.src = url;
          element.alt = file.name;
          element.className = 'sticker photo-sticker';
          element.draggable = false;
          element.onerror = () => {
            if(!element.isConnected) return;
            const card = makeFileCard(file, url);
            card.style.left = element.style.left;
            card.style.top = element.style.top;
            element.replaceWith(card);
            showToast('Added as a file because this browser could not display the image.');
          };
        }else{
          element = makeFileCard(file, url);
        }
        placeEditorialItem(element, isImage ? 'photo' : 'file');
        contentLayer.appendChild(element);
      }
    });

    function clearFileUrls(){
      fileUrls.forEach(url => URL.revokeObjectURL(url));
      fileUrls.clear();
    }

    window.addEventListener('pagehide', event => {
      if(!event.persisted) clearFileUrls();
    });

    /* =========================================================
       ADD A SPEECH-TO-TEXT MESSAGE BUBBLE
       Messages are placed in a loose vertical story sequence.
       ========================================================= */
    function addMessage(text){
      const cleanText = text.trim();

      if(!cleanText){
        return;
      }


      const element = document.createElement('div');
      element.className = 'message message-arrival';
      element.textContent = cleanText;
      element.dataset.readableText = cleanText;

      placeEditorialItem(element, 'text');
      contentLayer.appendChild(element);
      return element;
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
      micBtn.setAttribute('aria-pressed', 'false');
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
        micBtn.setAttribute('aria-pressed', 'true');

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

      if(wipe && clickedButton?.closest('.topbar,.dock')){
        event.stopImmediatePropagation();
        return;
      }
      if(!clickedButton || clickedButton === micBtn || clickedButton.id === 'readBtn'
        || clickedButton.closest('.tour-controls,.erase-dialog')){
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
      micBtn.setAttribute('aria-pressed', 'true');
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
    speechEngine?.getVoices();

    let activeReading = null;

    function stopReadAloud(cancel = true){
      const reading = activeReading;
      if(!reading) return;

      activeReading = null;
      clearTimeout(reading.timer);
      reading.item?.classList.remove('is-reading');
      playbackCaption.hidden = true;
      playbackCaption.textContent = '';
      reading.button.classList.remove('dm-reading');
      reading.button.setAttribute('aria-pressed', 'false');
      reading.button.setAttribute('aria-label', 'Play story aloud');
      if(cancel && reading.utterance){
        speechEngine.cancel();
      }
      if(reading.previousAudioType !== undefined){
        try{
          navigator.audioSession.type = reading.previousAudioType;
        }catch(error){
          console.debug('Could not restore the audio session:', error);
        }
      }
    }

    function speakStory(items, button){
      const chunks = items.flatMap(({ item, words }) =>
        splitSpeechText(words).map(text => ({ item, text }))
      );
      const reading = { button, silent:!speechEngine || typeof SpeechSynthesisUtterance === 'undefined' };
      activeReading = reading;
      button.classList.add('dm-reading');
      button.setAttribute('aria-pressed', 'true');
      button.setAttribute('aria-label', 'Stop story playback');

      try{
        if(!reading.silent && navigator.audioSession){
          const previousType = navigator.audioSession.type;
          navigator.audioSession.type = 'playback';
          reading.previousAudioType = previousType;
        }
      }catch(error){
        console.debug('Could not set the playback audio session:', error);
      }

      let index = 0;

      function nextChunk(){
        if(activeReading !== reading) return;

        reading.item?.classList.remove('is-reading');
        const chunk = chunks[index++];
        if(!chunk){
          stopReadAloud(false);
          return;
        }
        reading.item = chunk.item;
        reading.item.classList.add('is-reading');
        playbackCaption.textContent = chunk.text;
        playbackCaption.hidden = false;

        const showSilently = () => {
          if(!reading.silent){
            reading.silent = true;
            reading.utterance = null;
            speechEngine.cancel();
          }
          if(!reading.reportedSilent){
            reading.reportedSilent = true;
            showToast('Voice playback is unavailable. Following the story with captions.');
          }
          reading.timer = setTimeout(nextChunk, clamp(chunk.text.length * 66, 1800, 13000));
        };

        if(reading.silent){
          showSilently();
          return;
        }

        // Start on the Play tap with the browser's default voice.
        // If it fails, try one explicitly selected English device voice.
        function submitChunk(voice = null, retry = false){
          if(activeReading !== reading) return;

          const utterance = new SpeechSynthesisUtterance(chunk.text);
          utterance.lang = voice?.lang || 'en-US';
          if(voice) utterance.voice = voice;
          utterance.rate = .9;
          reading.utterance = utterance;
          const current = () => activeReading === reading && reading.utterance === utterance;
          const fail = reason => {
            if(!current()) return;
            clearTimeout(reading.timer);
            const alternate = !retry && speechEngine.getVoices().find(candidate =>
              candidate.localService && /^en(?:-|$)/i.test(candidate.lang)
            );
            if(!alternate || reason === 'not-allowed'){
              showSilently();
              return;
            }
            reading.utterance = null;
            reading.timer = setTimeout(() => {
              if(activeReading !== reading) return;
              speechEngine.cancel();
              submitChunk(alternate, true);
            }, 0);
          };

          utterance.onstart = () => {
            if(!current()) return;
            clearTimeout(reading.timer);
            reading.timer = setTimeout(() => fail('timeout'), Math.max(12000, chunk.text.length * 150));
          };
          utterance.onerror = event => fail(event.error);
          utterance.onend = () => {
            if(!current()) return;
            clearTimeout(reading.timer);
            reading.utterance = null;
            reading.timer = setTimeout(nextChunk, 300);
          };

          reading.timer = setTimeout(() => fail('timeout'), 3500);
          try{
            if(speechEngine.paused) speechEngine.resume();
            speechEngine.speak(utterance);
          }catch(error){
            fail(error.name === 'NotAllowedError' ? 'not-allowed' : 'synthesis-failed');
          }
        }

        submitChunk();
      }

      nextChunk();
    }

    document.getElementById('readBtn').onclick = event => {
      if(activeReading){
        stopReadAloud();
        return;
      }
      if(listening || recognitionStarting){
        commitRecognitionText(liveTranscriptDraft || finalTranscript);
      }
      if(speechFallback.classList.contains('show')){
        addMessage(speechFallbackInput.value);
      }
      stopAllSpeechActivity();
      closeLibraries();

      const items = Array.from(contentLayer.children, item => ({
        item,
        words:(item.dataset.readableText || '').trim(),
        x:parseFloat(item.style.left) || 0,
        y:parseFloat(item.style.top) || 0
      })).filter(({ words }) => words);

      items.sort((first, second) =>
        Number(first.x >= boardWidth / 2) - Number(second.x >= boardWidth / 2)
        || (Math.abs(first.y - second.y) > 8 ? first.y - second.y : first.x - second.x)
      );

      const button = event.currentTarget;
      if(!items.length){
        animateButton(button, 'warning');
        showToast('Add words to your story first.');
        return;
      }
      animateButton(button);
      speakStory(items, button);
    };

    const resetBtn = document.getElementById('resetBtn');
    const eraseDialog = document.getElementById('eraseDialog');
    const eraseTrack = document.getElementById('eraseTrack');
    const eraseThumb = document.getElementById('eraseThumb');
    const eraseCancel = document.getElementById('eraseCancel');
    const wipeLight = document.getElementById('wipeLight');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let eraseProgress = 0;
    let erasePointer = null;

    function setEraseProgress(progress){
      eraseProgress = clamp(progress, 0, 1);
      eraseTrack.style.setProperty('--erase-progress', eraseProgress);
      eraseThumb.setAttribute('aria-valuenow', String(Math.round(eraseProgress * 100)));
    }

    function clearArtwork(){
      contentLayer.replaceChildren();
      layoutSlots.length = 0;
      clearFileUrls();
      sizeScratch();
    }

    function wipeArtboard(){
      if(wipe) return wipe.done;

      stopAllSpeechActivity();
      closeLibraries();
      pointers.clear();
      interaction = null;
      drawTarget.classList.remove('show');
      viewport.classList.add('is-wiping');
      const rect = artboard.getBoundingClientRect();
      const distance = Math.ceil((viewport.getBoundingClientRect().right - rect.left) / boardScale() + 140);
      const duration = reducedMotion.matches ? 0 : 730;
      const options = { duration, easing:'cubic-bezier(.45,.03,.84,.64)', fill:'both' };
      const move = [
        { transform:'translateX(0)', opacity:1 },
        { transform:`translateX(${distance}px)`, opacity:.2 }
      ];
      const animations = [
        contentLayer.animate(move, options),
        scratch.animate(move, options),
        wipeLight.animate([
          { transform:'translateX(-55%)', opacity:0 },
          { transform:'translateX(-30%)', opacity:.8, offset:.3 },
          { transform:'translateX(55%)', opacity:0 }
        ], options)
      ];
      const done = Promise.allSettled(animations.map(animation => animation.finished)).then(() => {
        clearArtwork();
        animations.forEach(animation => animation.cancel());
        viewport.classList.remove('is-wiping');
        wipe = null;
      });
      wipe = { animations, done };
      return done;
    }

    function confirmErase(){
      eraseDialog.close();
      void wipeArtboard();
    }

    resetBtn.onclick = () => {
      if(tourActive || wipe || eraseDialog.open) return;
      setEraseProgress(0);
      eraseDialog.showModal();
    };

    eraseCancel.onclick = () => eraseDialog.close();
    eraseDialog.addEventListener('close', () => {
      erasePointer = null;
      setEraseProgress(0);
    });

    eraseThumb.addEventListener('pointerdown', event => {
      if(tourActive || erasePointer || event.button !== 0) return;
      const distance = Math.max(1, eraseTrack.clientWidth - eraseThumb.offsetWidth - 8);
      erasePointer = { id:event.pointerId, start:event.clientX, progress:eraseProgress, distance };
      eraseThumb.setPointerCapture(event.pointerId);
    });
    eraseThumb.addEventListener('pointermove', event => {
      if(erasePointer?.id !== event.pointerId) return;
      setEraseProgress(erasePointer.progress + (event.clientX - erasePointer.start) / erasePointer.distance);
    });
    eraseThumb.addEventListener('pointerup', event => {
      if(erasePointer?.id !== event.pointerId) return;
      const distance = event.clientX - erasePointer.start;
      const completed = distance >= erasePointer.distance * .8;
      erasePointer = null;
      if(completed) confirmErase();
      else setEraseProgress(0);
    });
    for(const eventName of ['pointercancel', 'lostpointercapture']){
      eraseThumb.addEventListener(eventName, event => {
        if(erasePointer?.id !== event.pointerId) return;
        erasePointer = null;
        setEraseProgress(0);
      });
    }

    eraseThumb.addEventListener('keydown', event => {
      if(event.key === 'End') setEraseProgress(1);
      else if(event.key === 'Home') setEraseProgress(0);
      else if(event.key === 'ArrowRight') setEraseProgress(eraseProgress + .25);
      else if(event.key === 'ArrowLeft') setEraseProgress(eraseProgress - .25);
      else if(event.key === 'Enter' || event.key === ' '){
        if(eraseProgress === 1) confirmErase();
      }else return;
      event.preventDefault();
    });

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
      const scale = artboard.getBoundingClientRect().width / boardWidth;
      const items = Array.from(contentLayer.children, element => ({
        element,
        style:getComputedStyle(element)
      }));
      items.sort((first, second) => Number(first.style.zIndex) - Number(second.style.zIndex));
      for(const { element, style } of items){
        const transform = itemTransforms.get(element);
        const previousAnimation = element.style.animation;
        element.style.animation = 'none';
        outputContext.save();
        if(transform){
          const center = itemPosition(element);
          outputContext.translate(center.x, center.y);
          outputContext.rotate(transform.angle);
          outputContext.scale(transform.scale, transform.scale);
          outputContext.translate(-center.x, -center.y);
        }
        try{
          if(element.tagName === 'IMG'){
            drawExportImage(outputContext, element, style);
          }else{
            if(element.classList.contains('file-sticker')){
              outputContext.fillStyle = style.backgroundColor;
              outputContext.fillRect(element.offsetLeft, element.offsetTop, element.offsetWidth, element.offsetHeight);
            }
            if(transform){
              element.style.rotate = 'none';
              element.style.scale = 'none';
            }
            drawExportText(outputContext, element, style, origin, scale);
          }
        }finally{
          if(transform){
            element.style.rotate = transform.angle + 'rad';
            element.style.scale = String(transform.scale);
          }
          element.style.animation = previousAnimation;
          outputContext.restore();
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


    createTour({
      viewport, artboard, contentLayer, modeBadge, reducedMotion,
      addMessage, addSticker, addImageSticker, applyItemTransform, paintStroke,
      setPaintPanel, setMode, closeLibraries, setEraseProgress, wipeArtboard,
      pauseWipe(paused){
        wipe?.animations.forEach(animation => paused ? animation.pause() : animation.play());
      },
      setActive(active){
        tourActive = active;
      },
      camera(x, y, ratio){
        zoom = ratio;
        const scale = boardScale();
        artX = (boardWidth / 2 - x) * scale;
        artY = (boardHeight / 2 - y) * scale;
        updateTransform();
      },
      restoreEditor(){
        zoom = null;
        artX = 0;
        artY = 0;
        setMode('pan');
        updateTransform();
      }
    });
