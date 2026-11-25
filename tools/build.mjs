import { mkdir, writeFile } from 'node:fs/promises';

// Both routes are complete HTML documents, including their links and image descriptions.
const site = new URL('../', import.meta.url);

function render(en) {
  const t = (zh, english) => en ? english : zh;
  const lang = t('zh-CN', 'en');
  const base = en ? '../' : './';
  const asset = name => base + 'assets/' + name;
  const self = en ? '/en/' : '/';
  const pony = 'https://pony.hachile.org' + self;
  const sky = 'https://sky.hachile.org/';
  const home = 'https://home.hachile.org' + self;
  const gallery = 'https://gallery.hachile.org/';
  const title = t('云中城 | 天蓝晨风', 'Cloudsdale | Skyblue Mornbreeze');
  const description = t('我是天蓝晨风，一只住在云中城的蓝色小天马。来看看我的画册，听听我喜欢的音乐，也可以给我留言。',
    'I’m Skyblue Mornbreeze, a little blue pegasus living in Cloudsdale. Visit my sketchbook, listen to my favorite music, or leave me a note.');
  const name = t('天蓝晨风', 'Skyblue Mornbreeze');
  const welcome = t('我是天蓝晨风，一只住在云中城的蓝色小天马。', 'I’m Skyblue Mornbreeze, a little blue pegasus living in Cloudsdale.');
  const identity = t('在小马社群，我也叫 Pegasus Bluie。朋友们平常喊我天蓝、小蓝，或是 Skyblue。', 'In the Brony community I also go by Pegasus Bluie. My friends call me Tianlan, Little Blue, or just Skyblue.');
  const hobbies = t('出门时喜欢带着天琴心弦的布偶拍照。回到家，我练习画画，尝试写小马故事，也学着做电子音乐。', 'My Lyra Heartstrings plush comes along on photo walks. Back home, I practice drawing, write pony stories, and experiment with electronic music.');
  const dream = t('在人类世界，我在同济大学学习机器人。我想有一天能造出一匹像 Sweetiebot 那样的机器小马。', 'In the human world I study robotics at Tongji University. One day I’d love to build a robot pony like Sweetiebot.');
  const album = t('小马画册', 'Sketchbook');
  const mail = t('云端信箱', 'Mailbox');
  const profile = t('认识天蓝', 'Meet Skyblue');
  const close = t('关闭', 'Close');
  const closer = '<button class="close" type="button" data-close aria-label="' + close + '">×</button>';
  const open = (dialog, href, label, cls = '') => `<a class="${cls}" href="${href}" data-open="${dialog}">${label}</a>`;
  const pin = (dialog, href, label, cls) => open(dialog, href, '<span class="pin-label"><i aria-hidden="true"></i>' + label + '</span>', 'pin ' + cls);
  const images = [
    ['cloud-portrait.webp', t('趴在云端', 'Up in the clouds'), t('天蓝晨风趴在白云上，一侧翅膀从身后探出。', 'Skyblue leans on a white cloud with one wing peeking out.')],
    ['studio.webp', t('星星眼', 'Stars in my eyes'), t('粉色背景里，天蓝晨风抬起前蹄，眼睛里闪着星星。', 'Against a pink backdrop, Skyblue raises one forehoof with a starry-eyed look.')],
    ['sketchbook.webp', t('戴上圆墨镜', 'Round sunglasses'), t('一只戴着圆墨镜的小天马，金色鬃毛垂在镜框旁。', 'A little pegasus in round sunglasses with a lock of golden mane beside the frame.')],
    ['skyblue.webp', t('展翅', 'Wings out'), t('天蓝晨风抱着前蹄，侧身展开翅膀。', 'Skyblue spreads both wings, forehooves tucked together.')]
  ];
  const links = [
    ['Sky', t('我的小马国地图', 'My map of Equestria'), sky],
    ['Pony', t('我的小马手帐和歌单', 'My pony scrapbook and playlist'), pony],
    ['Ponylonia', t('机器小马的梦想', 'My robot pony project'), 'https://ponylonia.hachile.org/'],
    ['Gunpowder Central', t('在人类世界的我', 'My home in the human world'), home]
  ];
  return `<!doctype html>
<html lang="${lang}" data-view="scene" data-light="day">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f6f5ed">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="https://cloud.hachile.org${self}">
  <link rel="alternate" hreflang="zh-CN" href="https://cloud.hachile.org/">
  <link rel="alternate" hreflang="en" href="https://cloud.hachile.org/en/">
  <link rel="icon" type="image/png" href="${asset('mark.png')}">
  <meta property="og:image" content="https://cloud.hachile.org/assets/cloudsdale.webp">
  <link rel="stylesheet" href="${base}style.css">
  <script defer src="${base}cloud.js"></script>
  <noscript><style>.view-switch,.scene-tools{display:none!important}.journal{display:grid!important}</style></noscript>
</head>
<body>
  <a class="skip" href="#main">${t('跳到正文', 'Skip to content')}</a>
  <header class="masthead">
    <a class="brand" href="${en ? './' : base}" aria-label="${title}"><img src="${asset('mark.png')}" alt="" width="36" height="36"><span>Cloudsdale</span></a>
    <nav class="nav" aria-label="${t('主导航','Navigation')}">
      <a href="#main">${t('云中城','Home')}</a>
      ${open('album', gallery, album)}
      ${open('mail', home + '#discussion', t('来信','Contact'))}
    </nav>
    <div class="utility">
      <div class="view-switch" role="group" aria-label="${t('浏览方式','View mode')}">
        <button type="button" data-view-choice="scene" aria-pressed="true">${t('场景','Scene')}</button>
        <button type="button" data-view-choice="journal" aria-pressed="false">${t('手记','Journal')}</button>
      </div>
      <a class="lang" href="${en ? '../' : 'en/'}" hreflang="${t('en','zh-CN')}" lang="${t('en','zh-CN')}" aria-label="${t('English','切换至中文')}">${t('EN','中文')}</a>
    </div>
  </header>
  <main id="main" class="wrap">
    <section class="scene" aria-labelledby="scene-title">
      <img class="scene-backdrop" src="${asset('cloudsdale.webp')}" width="2041" height="770" alt="" fetchpriority="high">
      <div class="scene-copy">
        <p class="location">${t('小马国　/　云中城', 'Equestria　/　Cloudsdale')}</p>
        <h1 id="scene-title">Cloudsdale</h1>
        <p class="lede">${welcome}</p>
        ${open('profile', pony + '#about', profile + ' <span aria-hidden="true">↗</span>', 'action')}
      </div>
      <a class="pony-pin" href="${pony}#about" data-open="profile" aria-label="${profile}">
        <img src="${asset('skyblue.webp')}" alt="" width="900" height="852">
        <span class="pin-label"><i aria-hidden="true"></i>${name}</span>
      </a>
      ${pin('album', gallery, album, 'art-pin')}
      ${pin('mail', home + '#discussion', mail, 'mail-pin')}
      <div class="scene-tools"><button class="light-switch" type="button" data-light-switch aria-pressed="false" aria-label="${t('开启夜景','Switch to night')}"><span aria-hidden="true">☾</span> <span data-light-text>${t('夜景','Night')}</span></button></div>
    </section>
    <section class="journal" id="journal" aria-labelledby="journal-title">
      <div class="journal-copy"><p class="location">${t('云中城手记','From the journal')}</p><h1 id="journal-title">${t('叫我天蓝就好','Call me Skyblue')}</h1>
      <p class="lede">${welcome}</p><p>${identity}</p><p>${hobbies}</p><p>${dream}</p>
      <a class="action" href="${pony}#music">${t('听我的歌单','Listen to my playlist')} <span aria-hidden="true">↗</span></a></div>
      <img class="journal-art" src="${asset('cloud-portrait.webp')}" alt="${images[0][2]}" width="1100" height="825">
    </section>
    <section class="shelf" aria-labelledby="shelf-title">
      <div class="section-head"><h2 id="shelf-title">${t('在云上逛逛','Around the clouds')}</h2><a href="#places">${t('更多站点','More places')} <span aria-hidden="true">↘</span></a></div>
      <div class="feature-grid">
        <a href="${gallery}" class="feature feature-gallery" data-open="album">
          <div class="feature-copy"><small>Sketchbook</small><h3>${t('天蓝的画册','Skyblue’s sketchbook')}</h3><p>${t('云上的我，还有画里的我。','A few portraits from my life in the clouds.')}</p><span aria-hidden="true">↗</span></div>
          <img class="feature-art" src="${asset('studio.webp')}" alt="" width="900" height="900" loading="lazy">
        </a>
        <a href="${sky}" class="feature feature-world">
          <div class="feature-copy"><small>Equestria</small><h3>${t('我的小马国','My Equestria')}</h3><p>${t('从云中城出发，去地图上走走。','Set out from Cloudsdale and explore the map.')}</p><span aria-hidden="true">↗</span></div>
          <img class="feature-art" src="${asset('cloudsdale.webp')}" alt="" width="2041" height="770" loading="lazy">
        </a>
      </div>
    </section>
    <section class="places" id="places" aria-labelledby="places-title"><div class="section-head"><h2 id="places-title">${t('我常去的地方','Places I call home')}</h2></div><div class="place-list">
      ${links.map(([label, desc, href]) => `<a href="${href}"><strong>${label}</strong><span>${desc}</span><b aria-hidden="true">↗</b></a>`).join('\n      ')}
    </div></section>
  </main>
  <footer class="foot"><span>© Skyblue Mornbreeze</span>${open('mail', home + '#discussion', mail + ' ↗')}</footer>
  <dialog id="profile" class="modal" aria-labelledby="profile-title">${closer}<div class="profile-layout">
    <img src="${asset('skyblue.webp')}" alt="${images[3][2]}" width="900" height="852" loading="lazy">
    <div><p class="location">Pegasus Bluie</p><h2 id="profile-title">${name}</h2><p>${identity}</p><p>${hobbies}</p><p>${dream}</p><a class="action" href="${pony}">${t('翻开我的手帐','Open my scrapbook')} ↗</a></div>
  </div></dialog>
  <dialog id="album" class="modal" aria-labelledby="album-title">${closer}<div class="gallery-layout">
    <div class="gallery-photo">${images.map(([src, title, alt], i) => `<figure data-slide ${i ? 'hidden' : ''}><img src="${asset(src)}" alt="${alt}" loading="lazy"><figcaption>${title}</figcaption></figure>`).join('')}</div>
    <div class="gallery-info"><h2 id="album-title">${album}</h2><div class="gallery-controls"><button type="button" data-step="-1" aria-label="${t('上一张','Previous image')}">←</button><output aria-live="polite">1 / ${images.length}</output><button type="button" data-step="1" aria-label="${t('下一张','Next image')}">→</button></div><a href="${gallery}">${t('前往画廊','Visit the gallery')} ↗</a></div>
  </div></dialog>
  <dialog id="mail" class="modal" aria-labelledby="mail-title">${closer}<div class="mail-content">
    <p class="location">Cloudsdale Post</p><h2 id="mail-title">${mail}</h2>
    <p>${t('想聊聊小马、画画，或者你最近听的一首歌？可以在我的主页留言，我会在那里读到。','Tell me about your pony, a drawing you’re working on, or a song you’ve had on repeat. I read notes in the discussion section of my homepage.')}</p>
    <a class="action" href="${home}#discussion">${t('给天蓝留言','Leave me a note')} ↗</a>
  </div></dialog>
</body></html>
`;
}

await mkdir(new URL('en/', site), { recursive: true });
await Promise.all([['index.html', false], ['en/index.html', true]].map(([path, en]) =>
  writeFile(new URL(path, site), render(en))));
