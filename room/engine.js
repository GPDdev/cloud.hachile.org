import * as THREE from './vendor/three.module.min.js';
import { buildRoom } from './model.js';

const clamp = THREE.MathUtils.clamp;
const assetURL = name => new URL('../assets/' + name, import.meta.url).href;
const home = { yaw: 0.055, pitch: 0.04, zoom: 1 };
const minZoom = 0.83;
const maxZoom = 1.28;

async function startRoom(room) {
  const canvas = room.querySelector('[data-room-canvas]');
  const pins = [...room.querySelectorAll('[data-room-pin]')];
  const zoomButtons = [...document.querySelectorAll('[data-room-zoom]')];
  const resetButton = document.querySelector('[data-room-reset]');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'low-power'
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(41, 1, 0.12, 100);
  const model = buildRoom(THREE, scene, { assetURL });
  await model.ready;
  const wanted = { ...home };
  const current = { ...home };
  const projected = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const objects = new Map(Object.entries(model.pickables || {}).map(([name, obj]) => [obj, name]));
  const pickables = [...objects.keys()];
  const locations = pins.map(pin => ({
    pin, position: model.targets[pin.dataset.roomPin], width: pin.offsetWidth, height: pin.offsetHeight,
    x: NaN, y: NaN
  }));
  let pointer = null;
  let hoverX = 0;
  let hoverY = 0;
  let hoveredObject = null;
  let width = 0;
  let height = 0;
  let distance = 8.1;
  let inView = false;
  let contextLost = false;
  let frame = 0;
  let lastTime = 0;
  let elapsed = 0;
  let cameraDirty = true;
  let pinsAnchored = false;

  function shouldDraw() {
    return inView && width > 0 && height > 0 && !contextLost && !document.hidden &&
      document.documentElement.dataset.view !== 'journal' && !document.querySelector('dialog[open]');
  }

  function schedule() {
    if (shouldDraw()) {
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
  }

  function resize({ contentRect }) {
    width = contentRect.width;
    height = contentRect.height;
    if (width && height) {
      const aspect = width / height;
      camera.aspect = aspect;
      camera.fov = clamp(42 + (1.5 - aspect) * 11, 41, 62);
      distance = Math.max(8.1, 4.38 / (aspect * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))));
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.6, Math.sqrt(2000000 / (width * height))));
      renderer.setSize(width, height, false);
      cameraDirty = true;
    }
    schedule();
  }

  function positionCamera() {
    const { yaw, pitch, zoom } = current;
    const radius = distance / zoom;
    camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * radius,
      2.24 + Math.sin(pitch) * radius,
      -0.8 + Math.cos(yaw) * Math.cos(pitch) * radius
    );
    camera.lookAt(yaw * 1.05, 2.24 + (pitch - home.pitch) * 0.68, -0.8);
    camera.updateMatrixWorld();
    const placed = [];
    for (const location of locations) {
      const { position, pin } = location;
      projected.copy(position).project(camera);
      const outOfFrame = Math.abs(projected.x) > 1 || Math.abs(projected.y) > 1 || Math.abs(projected.z) > 1;
      pin.style.visibility = outOfFrame ? 'hidden' : '';
      if (outOfFrame) continue;
      const halfW = location.width / 2;
      const halfH = location.height / 2;
      const x = clamp(Math.round((projected.x + 1) * width * 5) / 10, halfW + 5, width - halfW - 5);
      const preferredY = clamp(Math.round((1 - projected.y) * height * 5) / 10, halfH + 5, height - halfH - 5);
      // Long translated labels can meet at portrait widths. Try the closest free row.
      const neighbors = placed.filter(p => Math.abs(p.x - x) < halfW + p.width / 2 + 3);
      const rows = [preferredY];
      for (const p of neighbors) {
        const separation = halfH + p.height / 2 + 3;
        rows.push(p.y - separation, p.y + separation);
      }
      const y = rows.sort((a, b) => Math.abs(a - preferredY) - Math.abs(b - preferredY))
        .find(row => row >= halfH + 5 && row <= height - halfH - 5 &&
          neighbors.every(p => Math.abs(p.y - row) >= halfH + p.height / 2 + 3)) ?? preferredY;
      if (x !== location.x || y !== location.y) {
        // Compositor-only movement; the label's CSS transform centers its own box.
        pin.style.translate = x + 'px ' + y + 'px';
        location.x = x;
        location.y = y;
      }
      placed.push(location);
    }
  }

  function draw(time) {
    frame = 0;
    if (!shouldDraw()) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.1) : 1 / 60;
    const smoothing = reducedMotion.matches ? 1 : 1 - Math.exp(-13 * dt);
    const yaw = wanted.yaw + (reducedMotion.matches ? 0 : hoverX);
    const pitch = wanted.pitch + (reducedMotion.matches ? 0 : hoverY);
    const moving = Math.abs(current.yaw - yaw) + Math.abs(current.pitch - pitch) +
      Math.abs(current.zoom - wanted.zoom) > 0.00012;
    if (!cameraDirty && !moving && model.update && lastTime && time - lastTime < 32) {
      frame = requestAnimationFrame(draw);
      return;
    }
    lastTime = time;
    if (!pinsAnchored) {
      for (const { pin } of locations) {
        pin.style.left = '0';
        pin.style.top = '0';
      }
      pinsAnchored = true;
    }
    if (moving || cameraDirty) {
      current.yaw += (yaw - current.yaw) * smoothing;
      current.pitch += (pitch - current.pitch) * smoothing;
      current.zoom += (wanted.zoom - current.zoom) * smoothing;
      positionCamera();
      cameraDirty = false;
    }
    if (model.update && !reducedMotion.matches) {
      elapsed += dt;
      model.update(elapsed);
    }
    renderer.render(scene, camera);
    if (room.dataset.roomReady !== 'true') room.dataset.roomReady = 'true';
    if (moving || (model.update && !reducedMotion.matches)) frame = requestAnimationFrame(draw);
    else lastTime = 0;
  }

  function zoomTo(value) {
    wanted.zoom = clamp(value, minZoom, maxZoom);
    for (const button of zoomButtons) {
      button.disabled = button.dataset.roomZoom === 'in' ? wanted.zoom >= maxZoom : wanted.zoom <= minZoom;
    }
    schedule();
  }

  function orbit(yaw, pitch) {
    wanted.yaw = clamp(yaw, home.yaw - 0.44, home.yaw + 0.44);
    wanted.pitch = clamp(pitch, -0.105, 0.18);
    schedule();
  }

  function reset() {
    hoverX = hoverY = 0;
    orbit(home.yaw, home.pitch);
    zoomTo(home.zoom);
  }

  function pick(event) {
    if (!pickables.length) return;
    const rect = canvas.getBoundingClientRect();
    mouse.set(((event.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((event.clientY - rect.top) / rect.height) * 2);
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(pickables, true)[0];
    for (let obj = hit?.object; obj; obj = obj.parent) {
      if (objects.has(obj)) return objects.get(obj);
    }
  }

  function highlight(name) {
    if (hoveredObject === name) return;
    hoveredObject = name;
    for (const pin of pins) pin.toggleAttribute('data-object-hover', pin.dataset.roomPin === name);
  }

  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0 || !event.isPrimary || pointer) return;
    highlight(null);
    hoverX = hoverY = 0;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY,
      yaw: wanted.yaw, pitch: wanted.pitch, dragging: false, object: pick(event) };
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener('pointermove', event => {
    if (!event.isPrimary) return;
    if (!pointer) {
      if (event.pointerType === 'mouse') {
        const rect = canvas.getBoundingClientRect();
        hoverX = ((event.clientX - rect.left) / rect.width - 0.5) * 0.052;
        hoverY = ((event.clientY - rect.top) / rect.height - 0.5) * -0.018;
        const name = pick(event);
        highlight(name);
        canvas.style.cursor = name ? 'pointer' : 'grab';
        schedule();
      }
      return;
    }
    if (event.pointerId !== pointer.id) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.dragging) {
      if (Math.hypot(dx, dy) <= 8) return;
      if (event.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx)) {
        releasePointer(event);
        return;
      }
      pointer.dragging = true;
      canvas.style.cursor = 'grabbing';
    }
    const strength = 1.02 / Math.min(width, 860);
    orbit(pointer.yaw - dx * strength,
      pointer.pitch + (event.pointerType === 'touch' ? 0 : dy * 0.57 / Math.max(height, 300)));
  });

  function releasePointer(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    pointer = null;
    canvas.style.cursor = 'grab';
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
  }

  canvas.addEventListener('pointerup', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const tapped = !pointer.dragging && Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) <= 8;
    const name = tapped && pointer.object && pick(event) === pointer.object ? pointer.object : null;
    releasePointer(event);
    if (name) pins.find(pin => pin.dataset.roomPin === name)?.click();
  });
  canvas.addEventListener('pointercancel', releasePointer);
  canvas.addEventListener('lostpointercapture', releasePointer);
  canvas.addEventListener('pointerleave', () => {
    highlight(null);
    if (pointer) return;
    hoverX = hoverY = 0;
    schedule();
  });
  canvas.style.touchAction = 'pan-y pinch-zoom';
  canvas.addEventListener('keydown', event => {
    if (event.metaKey || event.altKey || event.ctrlKey) return;
    switch (event.key) {
      case 'ArrowLeft': orbit(wanted.yaw - 0.095, wanted.pitch); break;
      case 'ArrowRight': orbit(wanted.yaw + 0.095, wanted.pitch); break;
      case 'ArrowUp': orbit(wanted.yaw, wanted.pitch + 0.04); break;
      case 'ArrowDown': orbit(wanted.yaw, wanted.pitch - 0.04); break;
      case '+': case '=': zoomTo(wanted.zoom + 0.1); break;
      case '-': zoomTo(wanted.zoom - 0.1); break;
      case 'Home': reset(); break;
      default: return;
    }
    event.preventDefault();
  });
  canvas.addEventListener('wheel', event => {
    if (document.activeElement !== canvas || event.ctrlKey || event.metaKey || !event.deltaY) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    const next = clamp(wanted.zoom * Math.exp(-delta * 0.0014), minZoom, maxZoom);
    if (next === wanted.zoom) return;
    event.preventDefault();
    zoomTo(next);
  }, { passive: false });
  resetButton?.addEventListener('click', reset);
  for (const button of zoomButtons) {
    button.addEventListener('click', () => zoomTo(wanted.zoom + (button.dataset.roomZoom === 'in' ? 0.1 : -0.1)));
  }

  function applyEnvironment() {
    model.setNight?.(document.documentElement.dataset.light === 'night');
    cameraDirty = true;
    schedule();
  }
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    contextLost = true;
    pinsAnchored = false;
    highlight(null);
    delete room.dataset.roomReady;
    for (const location of locations) {
      for (const property of ['left', 'top', 'translate', 'visibility']) location.pin.style.removeProperty(property);
      location.x = location.y = NaN;
    }
    schedule();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    contextLost = false;
    scene.traverse(obj => { if (obj.isLight && obj.castShadow) obj.shadow.needsUpdate = true; });
    applyEnvironment();
  });
  new ResizeObserver(([entry]) => resize(entry)).observe(room);
  const pinObserver = new ResizeObserver(entries => {
    for (const entry of entries) {
      const location = locations.find(item => item.pin === entry.target);
      location.width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.target.offsetWidth;
      location.height = entry.borderBoxSize?.[0]?.blockSize ?? entry.target.offsetHeight;
    }
    cameraDirty = true;
    schedule();
  });
  for (const pin of pins) pinObserver.observe(pin);
  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    schedule();
  }).observe(room);
  new MutationObserver(applyEnvironment).observe(document.documentElement,
    { attributes: true, attributeFilter: ['data-light', 'data-view'] });
  const dialogObserver = new MutationObserver(schedule);
  for (const dialog of document.querySelectorAll('dialog')) {
    dialogObserver.observe(dialog, { attributes: true, attributeFilter: ['open'] });
  }
  document.addEventListener('visibilitychange', schedule);
  reducedMotion.addEventListener('change', schedule);
  applyEnvironment();
}

const room = document.querySelector('[data-room]');
if (room) startRoom(room).catch(error => {
  // Keep the illustrated page and native links usable if WebGL or a texture is unavailable.
  console.warn('Cloudsdale is showing the illustrated view.', error);
});
