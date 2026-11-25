// A hand-built cutaway. Furniture, joinery and window openings have real depth.
export function buildRoom(THREE, scene, { assetURL }) {
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const group = (parent, x = 0, y = 0, z = 0) => {
    const result = new THREE.Group();
    result.position.set(x, y, z);
    parent.add(result);
    return result;
  };
  const room = group(scene);
  const palette = new Map();
  function paint(color) {
    if (!palette.has(color)) palette.set(color, new THREE.MeshStandardMaterial({ color, roughness: .84 }));
    return palette.get(color);
  }
  const geometry = {
    block: new THREE.BoxGeometry(1, 1, 1),
    ball: new THREE.SphereGeometry(1, 18, 12),
    tube: new THREE.CylinderGeometry(.5, .5, 1, 18),
    plane: new THREE.PlaneGeometry(1, 1),
  };
  function mesh(parent, shape, material, x, y, z, w = 1, h = 1, d = 1) {
    const m = new THREE.Mesh(shape, typeof material === 'string' ? paint(material) : material);
    m.position.set(x, y, z);
    m.scale.set(w, h, d);
    parent.add(m);
    return m;
  }
  const box = (p, mat, x, y, z, w, h, d) => mesh(p, geometry.block, mat, x, y, z, w, h, d);
  const oval = (p, mat, x, y, z, w, h, d) => mesh(p, geometry.ball, mat, x, y, z, w, h, d);
  const tube = (p, mat, x, y, z, w, h, d = w) => mesh(p, geometry.tube, mat, x, y, z, w, h, d);
  function taper(p, mat, x, y, z, topRadius, bottomRadius, height, sides = 20) {
    return mesh(p, new THREE.CylinderGeometry(topRadius, bottomRadius, height, sides), mat, x, y, z);
  }
  function strut(p, mat, a, b, width, depth = width) {
    const delta = b.clone().sub(a);
    const middle = a.clone().lerp(b, .5);
    const beam = box(p, mat, middle.x, middle.y, middle.z, width, delta.length(), depth);
    beam.quaternion.setFromUnitVectors(V(0, 1, 0), delta.normalize());
    return beam;
  }
  function canvasTexture(width, height, draw) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    draw(canvas.getContext('2d'), width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }
  let seed = 61013;
  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }
  const loader = new THREE.TextureLoader();
  function picture(filename, unlit = false, cutout = false) {
    const material = unlit ? new THREE.MeshBasicMaterial() : new THREE.MeshStandardMaterial({ roughness: .87 });
    const texture = loader.load(assetURL(filename));
    material.map = texture;
    texture.colorSpace = THREE.SRGBColorSpace;
    material.side = THREE.DoubleSide;
    if (cutout) {
      material.transparent = true;
      material.alphaTest = .08;
    }
    return material;
  }
  // One request and one readiness signal per source, even when WebGL reuses the texture.
  const loadingManager = new THREE.LoadingManager();
  loader.manager = loadingManager;
  let finish, fail;
  const ready = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  loadingManager.onLoad = finish;
  loadingManager.onError = url => fail(new Error('Could not load room artwork: ' + url));
  const panorama = picture('cloudsdale.webp', true);
  const ponyArt = picture('skyblue.webp', true, true);
  const easelArt = picture('studio.webp', true);
  const portraitArt = picture('cloud-portrait.webp', true);
  const markArt = picture('mark.png', true);
  const walnut = '#725142', oak = '#b5845b', maple = '#ddba87';
  const trim = '#f5dfb9', sage = '#759c99', darkSage = '#426e73';
  const brass = '#d1a15b', plaster = '#f3dfbc';

  // Outside the apertures, the cloud city continues past the ends of the cutaway.
  scene.background = new THREE.Color('#c4dded');
  mesh(room, geometry.plane, panorama, 0, 2.98, -6.4, 20, 7.55);
  const starsTexture = canvasTexture(512, 256, (c, w, h) => {
    for (let i = 0; i < 95; i++) {
      const x = random() * w, y = random() * h;
      c.globalAlpha = .4 + random() * .55;
      c.fillStyle = '#fff1c5';
      c.fillRect(x, y, 1.1 + random(), 1.1 + random());
    }
    c.globalAlpha = 1;
  });
  const stars = mesh(room, geometry.plane, new THREE.MeshBasicMaterial({
    map: starsTexture, transparent: true, depthWrite: false,
  }), 0, 3.15, -6.34, 19.8, 7.2);
  stars.visible = false;

  // Staggered boards, thin grain lines and occasional knots keep the floor legible in perspective.
  const flooring = canvasTexture(1024, 640, (c, w, h) => {
    const tones = ['#d7b189', '#d2a97f', '#e3bd94', '#dfb68d', '#d6ad83', '#e2bd99'];
    c.fillStyle = '#9c795f'; c.fillRect(0, 0, w, h);
    for (let row = 0; row < 16; row++) {
      const y = row * 40;
      let x = -(row % 3) * 87;
      while (x < w) {
        const span = 175 + Math.floor(random() * 160);
        c.fillStyle = tones[Math.floor(random() * tones.length)];
        c.fillRect(x + 1, y + 1, span - 2, 38);
        c.strokeStyle = '#7d584730'; c.lineWidth = .8;
        for (let i = 0; i < 9; i++) {
          const yy = y + 3 + random() * 33;
          c.beginPath(); c.moveTo(x + 4, yy);
          c.bezierCurveTo(x + span * .32, yy - 4, x + span * .61, yy + 5, x + span - 4, yy);
          c.stroke();
        }
        if (random() > .5) {
          c.beginPath(); c.ellipse(x + span * .4, y + 23, 10, 2, 0, 0, Math.PI * 2); c.stroke();
        }
        x += span;
      }
    }
  });
  const floor = mesh(room, geometry.plane, new THREE.MeshStandardMaterial({ map: flooring, roughness: .91 }), 0, .005, .35, 10.7, 7.25);
  floor.rotation.x = -Math.PI / 2;
  box(room, walnut, 0, -.105, .35, 10.74, .20, 7.28);
  box(room, maple, 0, -.09, 4.00, 10.8, .11, .09);

  // Actual holes and double architraves, rather than a sky picture on a flat wall.
  function arch(path, cx, bottom, radius, spring) {
    path.moveTo(cx - radius, bottom);
    path.lineTo(cx + radius, bottom);
    path.lineTo(cx + radius, spring);
    path.absarc(cx, spring, radius, 0, Math.PI, false);
    path.lineTo(cx - radius, bottom);
    return path;
  }
  const openings = [[-1.91, .76, 3.64], [0, .95, 3.95], [1.91, .76, 3.64]];
  const wall = new THREE.Shape();
  wall.moveTo(-5.35, 0); wall.lineTo(5.35, 0); wall.lineTo(5.35, 5.05);
  wall.lineTo(0, 6.35); wall.lineTo(-5.35, 5.05); wall.closePath();
  for (const [cx, r, sy] of openings) wall.holes.push(arch(new THREE.Path(), cx, 1.44, r, sy));
  const molded = (s, depth) => new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 20 });
  mesh(room, molded(wall, .18), plaster, 0, 0, -3.42);
  function molding(cx, radius, spring, thickness, depth, mat, z) {
    const shape = arch(new THREE.Shape(), cx, 1.44 - thickness, radius + thickness, spring);
    shape.holes.push(arch(new THREE.Path(), cx, 1.44, radius, spring));
    mesh(room, molded(shape, depth), mat, 0, 0, z);
  }
  for (const [cx, r, sy] of openings) {
    molding(cx, r, sy, .115, .14, maple, -3.25);
    molding(cx, r, sy, .07, .10, trim, -3.11);
    // Slim cross-bars leave a generous view onto the city.
    box(room, trim, cx, sy, -3.22, 2*r, .049, .065);
    for (const dir of [-1, 1]) {
      const xx = cx + dir * r * .57;
      const ymax = sy + r * .82;
      box(room, trim, xx, (1.44+ymax)/2, -3.22, .029, ymax-1.44, .045);
    }
    box(room, walnut, cx, 1.40, -3.14, r*2+.34, .085, .44);
    box(room, maple, cx, 1.47, -3.11, r*2+.4, .105, .54);
  }
  // Low painted wall panels and stout framing under the roof.
  box(room, sage, 0, .59, -3.19, 10.68, 1.18, .12);
  box(room, darkSage, 0, .10, -3.08, 10.68, .20, .19);
  box(room, trim, 0, 1.18, -3.10, 10.68, .098, .21);
  for (let i = 0; i < 16; i++) box(room, darkSage, -5.26+i*.71, .62, -3.10, .045, 1.02, .055);
  for (const sign of [-1, 1]) {
    const x = sign * 5.36;
    // The attic is closed above even when the visitor looks up from a side.
    // Both pitches extend behind the gable and slightly beyond the front rafters.
    const slope = Math.atan2(1.31, 5.36);
    const roof = box(room, '#ecddc2', sign * 2.74, 5.78, .24, 5.74, .18, 7.7);
    roof.rotation.z = -sign * slope;
    for (let seam = 1; seam <= 7; seam++) {
      const distance = seam * .70;
      box(room, '#d1bb9d', sign * distance, 6.34 - distance * Math.tan(slope), .24, .022, .024, 7.7);
    }
    box(room, plaster, x, 2.50, -.02, .19, 5, 6.76);
    box(room, sage, x-sign*.12, .58, -.02, .11, 1.16, 6.76);
    box(room, trim, x-sign*.17, 1.18, -.02, .15, .095, 6.76);
    box(room, darkSage, x-sign*.16, .09, -.02, .17, .18, 6.76);
    for (const z of [-3.08,-.70,1.65,3.28]) {
      box(room, oak, x-sign*.08, 2.52, z, .22, 5.04, .22);
      strut(room, oak, V(x-sign*.08,4.22,z), V(x-sign*.88,5.03,z), .15);
      strut(room, walnut, V(x,5.01,z), V(0,6.32,z), .23, .20);
    }
    box(room, walnut, x, 4.98, -.02, .27, .24, 6.8);
  }
  box(room, walnut, 0, 6.24, -.02, .25, .28, 6.8);
  strut(room, maple, V(-5.25,5.08,-3.17), V(0,6.32,-3.17), .18, .20);
  strut(room, maple, V(5.25,5.08,-3.17), V(0,6.32,-3.17), .18, .20);

  // Soft painted contact shadows make small objects sit on the floor even without shadow maps.
  const shadeTexture = canvasTexture(128, 128, (c) => {
    const grad = c.createRadialGradient(64,64,2,64,64,64);
    grad.addColorStop(0,'#503d49a0'); grad.addColorStop(.55,'#57404450'); grad.addColorStop(1,'#57404400');
    c.fillStyle = grad; c.fillRect(0,0,128,128);
  });
  const shadeMaterial = new THREE.MeshBasicMaterial({ map: shadeTexture, transparent: true, depthWrite: false });
  function shadow(x, z, w, d, level = .02) {
    const obj = mesh(room,geometry.plane,shadeMaterial,x,level,z,w,d);
    obj.rotation.x = -Math.PI / 2;
    return obj;
  }
  // A flat-woven, scalloped rug with an inset compass medallion.
  const rugTexture = canvasTexture(768, 448, (c, w, h) => {
    c.translate(w/2,h/2); c.scale(1, h/w);
    const ring = (r,col,thickness) => { c.strokeStyle=col; c.lineWidth=thickness; c.beginPath(); c.arc(0,0,r,0,2*Math.PI); c.stroke(); };
    c.fillStyle='#719b9c'; c.beginPath(); c.arc(0,0,350,0,Math.PI*2); c.fill();
    ring(348,'#e0c697',10); ring(337,'#476f75',6); ring(324,'#e1cd9b',3); ring(292,'#a4beb1',4);
    for(let i=0;i<64;i++){c.save(); c.rotate(i*Math.PI/32); c.fillStyle=i%2?'#e0cfaa':'#d0b486';
      c.beginPath();c.moveTo(0,315);c.lineTo(4,308);c.lineTo(0,301);c.lineTo(-4,308);c.fill();c.restore();}
    for(let i=0;i<16;i++){c.save();c.rotate(i*Math.PI/8);c.strokeStyle='#c1ceaf';c.lineWidth=2;
      c.beginPath();c.moveTo(0,240);c.quadraticCurveTo(18,256,0,274);c.quadraticCurveTo(-18,256,0,240);c.stroke();c.restore();}
    ring(85,'#cbd2b8',3); ring(76,'#cbd2b8',2);
    for(let i=0;i<8;i++){c.save();c.rotate(i*Math.PI/4);c.fillStyle='#d9d6b5';
      c.beginPath();c.moveTo(0,66);c.lineTo(8,4);c.lineTo(0,13);c.lineTo(-8,4);c.fill();c.restore();}
  });
  const rug = mesh(room,geometry.plane,new THREE.MeshStandardMaterial({map:rugTexture,transparent:true,roughness:1,depthWrite:false}),-.25,.035,1.03,6.5,3.35);
  rug.rotation.x = -Math.PI/2;
  shadow(-.41,.36,2.15,1.12,.043);
  shadow(-3.23,-.35,2.25,1.35);
  shadow(3.14,-.30,3.25,1.74);
  shadow(-3.93,-2.36,2,1.2);

  // Small studio furniture uses the same wood, paint and hardware throughout.
  function panel(p,x,y,z,w,h) {
    box(p,darkSage,x,y,z,w,h,.09);
    box(p,sage,x,y,z+.05,w-.10,h-.10,.07);
    box(p,brass,x,y+h*.15,z+.11,.16,.035,.055);
  }
  function book(p,x,y,z,w,h,d,cover,tilt=0) {
    const b=group(p,x,y,z); b.rotation.z=tilt;
    box(b,cover,0,h/2,0,w,h,d);
    box(b,'#e4c983',0,h*.78,d*.505,w*.73,.028,.008);
    box(b,'#e4c983',0,h*.14,d*.505,w*.76,.018,.008);
    return b;
  }
  function stack(p,x,y,z,colors) {
    for (let i=0;i<colors.length;i++) {
      const b=group(p,x,y+i*.088,z); b.rotation.y=(i%2?.14:-.08);
      box(b,colors[i],0,.043,0,.57,.086,.38);
      box(b,'#eee1bf',0,.043,.012,.545,.055,.365);
    }
  }
  function plant(p,x,y,z,s=1) {
    const g=group(p,x,y,z); g.scale.setScalar(s);
    taper(g,'#b27b5d',0,.19,0,.23,.162,.38);
    tube(g,'#d99876',0,.36,0,.49,.08);
    tube(g,'#645442',0,.404,0,.40,.018);
    for (let i=0;i<9;i++) {
      const angle=i*2.37, length=.21+random()*.25, height=.58+random()*.42;
      const to=V(Math.cos(angle)*length,height,Math.sin(angle)*length);
      strut(g,'#5b775e',V(0,.39,0),to,.023);
      const leaf=oval(g,i%2?'#659277':'#8eaf80',to.x,to.y,to.z,.097,.208,.055);
      leaf.rotation.set(Math.sin(angle)*.60,angle,Math.cos(angle)*-.75);
    }
  }
  function frame(p,x,y,z,w,h,art,frameMat=walnut) {
    box(p,frameMat,x,y,z,w,h,.11);
    box(p,trim,x,y,z+.061,w-.075,h-.075,.017);
    return mesh(p,geometry.plane,art,x,y,z+.074,w-.15,h-.15);
  }
  const bookColors=['#597b84','#a96252','#bfa66c','#758770','#9b7a86','#537285','#b07855'];
  const cabinet=group(room,-4.08,0,-2.38);
  box(cabinet,darkSage,0,.64,0,1.58,1.16,.70);
  box(cabinet,maple,0,1.25,0,1.70,.14,.80);
  for(const x of [-.38,.38])panel(cabinet,x,.67,.37,.69,.98);
  plant(cabinet,-.42,1.33,-.03,.96);
  stack(cabinet,.35,1.34,.04,['#7c9e94','#a76c5d','#6b8193']);
  // A framed second portrait on the plaster near the easel.
  frame(room,-3.97,3.42,-3.12,1.27,.99,portraitArt,maple);
  const rightShelf=group(room,3.95,2.58,-3.03);
  box(rightShelf,walnut,0,0,0,2.15,.12,.48);
  for(const x of [-.75,.75])strut(rightShelf,brass,V(x,-.46,-.1),V(x,-.045,.19),.065);
  let bx=-.93;
  for(let i=0;i<7;i++){const w=.12+random()*.07;book(rightShelf,bx+w/2,.061,.02,w,.35+random()*.26,.29,bookColors[i],i===6?-.15:0);bx+=w+.018;}
  plant(rightShelf,.70,.062,.005,.59);

  // A substantial A-frame easel, inset original painting and stained paint tray.
  const easel=group(room,-3.12,0,-.29); easel.rotation.y=.14;
  strut(easel,oak,V(-.76,.015,.29),V(-.26,2.81,-.075),.105);
  strut(easel,oak,V(.76,.015,.29),V(.26,2.81,-.075),.105);
  strut(easel,walnut,V(0,.015,-.75),V(0,2.98,-.11),.11);
  box(easel,maple,0,1.10,.08,1.51,.15,.22);
  box(easel,oak,0,1.45,-.09,.105,2.85,.185);
  box(easel,walnut,0,.68,.14,1.18,.082,.09);
  frame(easel,0,1.94,.075,1.46,1.48,easelArt,walnut);
  box(easel,maple,0,2.76,.01,.46,.12,.26);
  box(easel,maple,0,1.12,.22,1.72,.08,.36);
  for(const [i,col] of ['#ba6c5c','#819fad','#debb61'].entries()){
    tube(easel,col,.36+i*.15,1.23,.25,.105,.13);
    tube(easel,trim,.36+i*.15,1.30,.25,.11,.02);
  }
  const stool=group(room,-4.27,0,.91);
  tube(stool,maple,0,.66,0,.72,.14);
  for(const [x,z] of [[-.22,.14],[.22,.14],[0,-.23]])strut(stool,walnut,V(x*1.23,.02,z*1.23),V(x,.63,z),.077);
  taper(stool,'#7b9f9b',0,.90,0,.15,.12,.31);
  for(let i=0;i<4;i++) {
    const x=(i-1.5)*.049;
    strut(stool,oak,V(x*.3,.94,0),V(x*1.9,1.32+i*.039,0),.019);
    oval(stool,i%2?'#614f4b':'#a67554',x*1.9,1.34+i*.039,0,.027,.062,.025);
  }

  // Plush cloud cushion and the owner's original flying pony.
  const cushions=group(room,-.40,.22,.26);
  for(const [x,y,z,w,h,d] of [[0,.04,0,.78,.22,.47],[-.52,.01,.05,.38,.21,.33],[.52,.07,0,.42,.24,.33],[-.25,.14,-.09,.37,.26,.30],[.20,.16,-.08,.39,.26,.30]]) {
    oval(cushions,'#f7efdf',x,y,z,w,h,d);
  }
  const pony=group(room,-.40,1.97,.29);
  mesh(pony,geometry.plane,ponyArt,0,0,0,2.31,2.19);
  pony.rotation.z=-.048; pony.rotation.y=.055;

  // A letter-writing desk, complete with drawer bank, envelopes, lamp and red mailbox.
  const desk=group(room,3.11,0,-.54); desk.rotation.y=-.085;
  box(desk,walnut,0,1.19,0,3.05,.16,1.22);
  box(desk,maple,0,1.286,0,3.10,.095,1.26);
  for(const x of [-1.28,1.28])for(const z of [-.44,.44]){
    taper(desk,oak,x,.56,z,.087,.055,1.12,8);
    tube(desk,brass,x,.085,z,.135,.12);
  }
  box(desk,darkSage,0,1.02,0,2.70,.28,1.04);
  for(const x of [-.66,.66])panel(desk,x,1.025,.515,1.24,.23);
  stack(desk,-1.04,1.341,-.22,['#668791','#ba795e']);
  // Passing a letter to the red enamel postal box opens the mailbox hotspot.
  const mailbox=group(desk,.18,1.34,.03);
  const post='#ad645b',postDark='#844f4b';
  const postShape=new THREE.Shape();
  postShape.moveTo(-.41,0);postShape.lineTo(.41,0);postShape.lineTo(.41,.62);
  postShape.absarc(0,.62,.41,0,Math.PI,false);postShape.lineTo(-.41,0);
  mesh(mailbox,molded(postShape,.49),post,0,.07,-.28);
  box(mailbox,postDark,0,.065,0,.94,.13,.65);
  box(mailbox,brass,0,.60,.23,.55,.10,.045);
  box(mailbox,'#554940',0,.596,.26,.45,.046,.02);
  box(mailbox,brass,0,.31,.235,.30,.17,.025);
  const letterTexture = canvasTexture(256,144,(c,w,h)=>{
    c.fillStyle='#fff1cf';c.fillRect(0,0,w,h);c.strokeStyle='#aa8461';c.lineWidth=4;
    c.strokeRect(4,4,w-8,h-8);c.beginPath();c.moveTo(5,5);c.lineTo(w*.5,h*.59);c.lineTo(w-5,5);c.stroke();
    c.fillStyle='#ac6a58';c.beginPath();c.arc(w*.5,h*.58,10,0,Math.PI*2);c.fill();
  });
  const letterMat=new THREE.MeshStandardMaterial({map:letterTexture});
  mesh(mailbox,geometry.plane,letterMat,0,.31,.255,.25,.136);
  const note=mesh(desk,geometry.plane,letterMat,-.57,1.345,.30,.53,.31);note.rotation.set(-Math.PI/2,0,-.20);
  const note2=mesh(desk,geometry.plane,letterMat,-.84,1.35,.18,.39,.23);note2.rotation.set(-Math.PI/2,0,.14);
  const lamp=group(desk,1.07,1.34,-.14);
  tube(lamp,darkSage,0,.059,0,.48,.118);
  tube(lamp,brass,0,.42,0,.068,.72);
  oval(lamp,brass,0,.81,0,.083,.081,.083);
  const lampShade=paint('#688e88').clone();
  taper(lamp,lampShade,0,.92,0,.16,.38,.38);
  const bulb=new THREE.MeshBasicMaterial({color:'#ffe6ae'});
  tube(lamp,bulb,0,.726,0,.708,.017);
  const lamplight=new THREE.PointLight('#ffd393',2.5,4.2,2);
  lamplight.position.set(0,.66,.08);lamp.add(lamplight);

  // A small rosette identifies the home without covering the windows with text.
  tube(room,brass,0,5.48,-3.08,.56,.10).rotation.x=Math.PI/2;
  const medallion=mesh(room,new THREE.CircleGeometry(.24,32),markArt,0,5.48,-3.01);
  medallion.rotation.z=.03;

  const fill=new THREE.HemisphereLight('#fff0d9','#bda58a',1.85);
  const daylight=new THREE.DirectionalLight('#ffe6c0',2.0);
  daylight.position.set(-4.1,7.3,3.8);
  daylight.castShadow=true;
  Object.assign(daylight.shadow.camera,{left:-6.8,right:6.8,top:6.5,bottom:-5,near:.2,far:20});
  daylight.shadow.camera.updateProjectionMatrix();
  daylight.shadow.mapSize.set(1024,1024);
  daylight.shadow.bias=-.00055;
  daylight.shadow.normalBias=.015;
  // Furniture is fixed. Reuse a single shadow map while the camera or pony moves.
  daylight.shadow.autoUpdate=false;
  daylight.shadow.needsUpdate=true;
  const edge=new THREE.DirectionalLight('#d9efff',.95);
  edge.position.set(1.5,4.4,-2.8);
  scene.add(fill,daylight,edge);

  // Batch identical opaque parts within each furnishing. Keep the three interactive
  // groups intact so raycasts still distinguish the pony, easel and mailbox.
  function batchParts(parent) {
    const batches=new Map();
    for(const child of [...parent.children]){
      if(child.isGroup){batchParts(child);continue;}
      if(!child.isMesh || child.material.transparent || child.isInstancedMesh)continue;
      const key=child.geometry.uuid+child.material.uuid;
      if(!batches.has(key))batches.set(key,[]);
      batches.get(key).push(child);
    }
    for(const batch of batches.values()){
      if(batch.length<2)continue;
      const first=batch[0], instances=new THREE.InstancedMesh(first.geometry,first.material,batch.length);
      batch.forEach((item,index)=>{item.updateMatrix();instances.setMatrixAt(index,item.matrix);parent.remove(item);});
      instances.computeBoundingSphere();parent.add(instances);
    }
  }
  batchParts(room);
  room.traverse(part=>{
    if(part.isMesh && part.material.isMeshStandardMaterial && !part.material.transparent)part.receiveShadow=true;
  });
  for(const furnishing of [easel,desk,cabinet,stool,rightShelf]){
    furnishing.traverse(part=>{if(part.isMesh)part.castShadow=true;});
  }
  // Anchor labels near, but outside, faces and the painted subjects.
  scene.updateMatrixWorld(true);
  const targets={
    profile:pony.localToWorld(V(.34,-.83,.09)),
    album:easel.localToWorld(V(-.30,1.09,.38)),
    mail:mailbox.localToWorld(V(.14,.13,.46)),
  };
  function setNight(night) {
    scene.background.set(night?'#384967':'#c4dded');
    fill.color.set(night?'#b3c9ec':'#fff0d9');
    fill.groundColor.set(night?'#95715e':'#bda58a');
    fill.intensity=night?1.12:1.85;
    daylight.color.set(night?'#c0d3ff':'#ffe6c0'); daylight.intensity=night?.58:2;
    edge.color.set(night?'#a4b5ff':'#d9efff'); edge.intensity=night?.7:.95;
    panorama.color.set(night?'#6b76ae':'#ffffff');
    ponyArt.color.set(night?'#d1d2e3':'#ffffff');
    easelArt.color.set(night?'#c7bbbd':'#ffffff');
    portraitArt.color.set(night?'#a6b1cc':'#ffffff');
    lamplight.intensity=night?8:1.1; stars.visible=night;
  }
  setNight(false);
  return {targets,pickables:{profile:pony,album:easel,mail:mailbox},ready,setNight,
    update(seconds){pony.position.y=1.97+Math.sin(seconds*1.25)*.033;}
  };
}
