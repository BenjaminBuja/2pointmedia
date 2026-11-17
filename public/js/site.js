// 2Point Media – gemeinsames Script für die Unterseiten (Startseite hat eigenes Script im HTML)
(function(){
  var $ = function(id){ return document.getElementById(id); };

  // Handy-Menü
  var nav = document.querySelector('.nav'), burger = $('burger');
  if (nav && burger) {
    burger.addEventListener('click', function(){ burger.setAttribute('aria-expanded', nav.classList.toggle('open')); });
    nav.querySelectorAll('nav a').forEach(function(a){ a.addEventListener('click', function(){ nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });
  }

  // Bilder (noch vom Onepage-CDN)
  var img = function(id){ return 'https://onecdn.io/media/' + id + '/preview'; };
  document.querySelectorAll('img[data-src]').forEach(function(el){ el.src = img(el.dataset.src); });

  // =====================================================================
  // VIDEOS – gleiche Liste wie auf der Startseite (index.html, VIDEOS).
  // Solange url leer ist, wird das Video (bzw. der Block mit data-needs-video) ausgeblendet.
  // =====================================================================
  var VT = 'https://onecdn.io/video-thumbnail/';
  var VIDEOS = {
    adam:   { url:'https://vimeo.com/1155500968', poster: VT + 'cd891f63-43fa-4343-ac36-adb35b75a9fa_b71f7f6b-ba7d-459f-a403-e662a4fd705f/preview', tall:true },
    mollet: { url:'https://vimeo.com/1160553589', poster: VT + '246e73ce-2562-4f85-a3c1-5a212b50b824_961045ae-2799-41de-9775-d80810998192/preview', tall:true },
    nauer:  { url:'', poster:'', tall:false },   // <- Kundenstimme Fenster Nauer (fertiger Schnitt, z. B. Vimeo-Link)
    tunc:   { url:'', poster:'', tall:false }    // <- Kundenstimme Tunc (fertiger Schnitt)
  };
  function embed(url){
    var m;
    if ((m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/))) return 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&rel=0&playsinline=1';
    if ((m = url.match(/vimeo\.com\/(?:video\/)?(\d+)(?:\/(\w+))?/))) return 'https://player.vimeo.com/video/' + m[1] + '?autoplay=1&dnt=1&title=0&byline=0&portrait=0' + (m[2] ? '&h=' + m[2] : '');
    return url;
  }
  function ytThumb(url){ var m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([\w-]{11})/); return m ? 'https://i.ytimg.com/vi/' + m[1] + '/hqdefault.jpg' : ''; }
  var modal = $('modal'), frame = $('modal-frame'), lastBtn = null;
  function closeVideo(){ modal.classList.remove('open'); frame.innerHTML = ''; document.body.style.overflow = ''; if (lastBtn) lastBtn.focus(); }
  if (modal) {
    $('modal-x').addEventListener('click', closeVideo);
    modal.addEventListener('click', function(e){ if (e.target === modal) closeVideo(); });
    addEventListener('keydown', function(e){ if (e.key === 'Escape' && modal.classList.contains('open')) closeVideo(); });
  }
  document.querySelectorAll('[data-needs-video]').forEach(function(el){
    var v = VIDEOS[el.dataset.needsVideo]; if (!v || !v.url) el.remove();
  });
  document.querySelectorAll('[data-video]').forEach(function(btn){
    var v = VIDEOS[btn.dataset.video];
    if (!v || !v.url || !modal) { btn.remove(); return; }
    var p = v.poster || ytThumb(v.url);
    if (p) btn.style.backgroundImage = 'url(' + p + ')';
    btn.addEventListener('click', function(){
      lastBtn = btn;
      frame.className = 'frame' + (v.tall ? ' tall' : '');
      frame.innerHTML = '<iframe src="' + embed(v.url) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen title="Video"></iframe>';
      modal.classList.add('open'); document.body.style.overflow = 'hidden'; $('modal-x').focus();
    });
  });

  // Rechner
  var chf = function(n){ return 'CHF ' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'"); };
  var set = function(id, t){ $(id).textContent = t; };
  function slider(ids, render){
    if (!$(ids[0])) return;
    function run(){
      render.apply(null, ids.map(function(id){ var el = $(id); el.style.setProperty('--p', ((el.value - el.min) / (el.max - el.min) * 100) + '%'); return +el.value; }));
    }
    ids.forEach(function(id){ $(id).addEventListener('input', run); });
    run();
  }
  // Vakanz-Rechner (Social Recruiting)
  slider(['r-pos','r-mon','r-rev','r-mar'], function(pos, mon, rev, mar){
    set('o-pos', pos); set('o-mon', mon); set('o-rev', chf(rev)); set('o-mar', mar + ' %');
    var month = rev / 12 * (mar / 100) * pos;
    set('res-total', chf(month * mon)); set('res-month', chf(month)); set('res-day', chf(month / 21));
    set('res-text', 'in ' + mon + (mon === 1 ? ' Monat' : ' Monaten') + ' – Geld, das in deiner Kasse fehlt.');
  });
  // Anfrage-Rechner (Kundengewinnung)
  slider(['k-val','k-req','k-rate','k-mar'], function(val, req, rate, mar){
    set('o-val', chf(val)); set('o-req', req); set('o-rate', rate + ' %'); set('o-kmar', mar + ' %');
    var perLead = val * rate / 100 * mar / 100, month = perLead * req;
    set('k-lead', chf(perLead)); set('k-month', chf(month)); set('k-year', chf(month * 12));
  });

  // Mehrstufiges Formular (gleiche Logik wie auf der Startseite)
  var f = $('leadform');
  if (!f) return;
  var step = 1, data = {}, steps = 4;
  var next = $('next'), back = $('back'), bar = $('bar'), info = $('stepinfo');
  function show(n){
    step = n;
    f.querySelectorAll('.fstep').forEach(function(s){ s.classList.toggle('on', +s.dataset.step === n); });
    bar.style.width = Math.min(n, steps) / steps * 100 + '%';
    info.textContent = n <= steps ? 'Schritt ' + n + ' von ' + steps + (n <= 2 ? ' · dauert 60 Sekunden' : '') : 'Fertig';
    back.hidden = n === 1 || n > steps;
    next.style.display = (n > steps || n < steps) ? 'none' : '';
    next.textContent = 'Analyse anfragen →';
    $('fnav').style.display = n > steps ? 'none' : '';
  }
  f.querySelectorAll('.opts').forEach(function(group){
    group.addEventListener('click', function(e){
      var b = e.target.closest('.opt'); if (!b) return;
      group.querySelectorAll('.opt').forEach(function(o){ o.classList.remove('sel'); }); b.classList.add('sel');
      data[group.dataset.name] = b.dataset.v;
      setTimeout(function(){ show(step + 1); }, 220);
    });
  });
  back.addEventListener('click', function(){ show(step - 1); });
  next.addEventListener('click', submit);
  f.addEventListener('submit', function(e){ e.preventDefault(); submit(); });
  function v(id){ return $(id).value.trim(); }
  function submit(){
    var ok = true;
    ['f-name','f-firma','f-tel','f-mail'].forEach(function(id){ var el = $(id); var bad = !el.value.trim() || (el.type === 'email' && !/^\S+@\S+\.\S+$/.test(el.value)); el.classList.toggle('err', bad); if (bad) ok = false; });
    if (!ok) return;
    var payload = Object.assign({}, data, {
      name: v('f-name'), firma: v('f-firma'), telefon: v('f-tel'), email: v('f-mail'), ort: v('f-ort'),
      website: f.elements.website.value, quelle: document.referrer || 'direkt', seite: location.href
    });
    next.disabled = true; next.textContent = 'Wird gesendet …';
    fetch('/api/lead', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
      .then(function(r){ if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function(){ show(5); if (window.fbq) fbq('track', 'Lead'); if (window.gtag) gtag('event', 'generate_lead'); })
      .catch(function(){
        // Fallback: falls der Server nicht erreichbar ist, öffnet sich eine vorbereitete E-Mail
        var body = Object.keys(payload).filter(function(k){ return k !== 'website'; }).map(function(k){ return k + ': ' + payload[k]; }).join('\n');
        location.href = 'mailto:info@2pointmedia.ch?subject=' + encodeURIComponent('Potenzial-Analyse: ' + payload.firma) + '&body=' + encodeURIComponent(body);
        $('done-text').textContent = 'Dein E-Mail-Programm hat sich geöffnet – einfach noch auf Senden drücken. Oder schreib direkt per WhatsApp.';
        show(5);
      })
      .finally(function(){ next.disabled = false; });
  }
  // Auf der Unterseite ist das Anliegen schon klar: Schritt 1 ist vorausgewählt (zurück geht trotzdem)
  var preset = f.dataset.ziel, pre = preset && f.querySelector('.opt[data-v="' + preset + '"]');
  if (pre) { pre.classList.add('sel'); data.ziel = preset; show(2); } else show(1);
})();
