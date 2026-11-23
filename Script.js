(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const pad2 = (n) => String(n).padStart(2, '0');
  const hasIO = 'IntersectionObserver' in window;

  // =========================================
  // MENÚ RESPONSIVO
  // =========================================
  const toggle = $('menuToggle');
  const nav = $('navLinks');

  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // =========================================
  // NAVEGACIÓN ACTIVA AL DESPLAZARSE
  // =========================================
  if (hasIO && nav) {
    const navAnchors = nav.querySelectorAll('a');

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          navAnchors.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    );

    document.querySelectorAll('section[id]').forEach((s) => activeObserver.observe(s));
  }

  // =========================================
  // SELECTOR DE IDIOMAS
  // (sin onclick en el HTML: los eventos se registran aquí)
  // =========================================
  const IDIOMA_ORIGINAL = 'es';
  const IDIOMAS = ['es', 'en', 'pt', 'fr', 'tr', 'zh-CN', 'ar'];
  const COOKIE_ATTRS = '; path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');

  function borrarCookieTraduccion() {
    const vencida = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC' + COOKIE_ATTRS;
    document.cookie = vencida;
    document.cookie = vencida + '; domain=' + location.hostname;
  }

  // Solo se aceptan idiomas de la lista: una cookie manipulada no carga nada raro
  function idiomaActual() {
    const m = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/;]+\/([A-Za-z-]+)/);
    const lang = m ? m[1] : IDIOMA_ORIGINAL;
    return IDIOMAS.includes(lang) ? lang : IDIOMA_ORIGINAL;
  }

  // Google Translate necesita esta función global como callback
  window.googleTranslateElementInit = function () {
    new google.translate.TranslateElement(
      { pageLanguage: IDIOMA_ORIGINAL, includedLanguages: IDIOMAS.join(','), autoDisplay: false },
      'google_translate_element'
    );
  };

  // Se descarga solo cuando hace falta: si la página ya está traducida, o la primera
  // vez que la persona toca el selector de idiomas (así no se carga para todos)
  let gtCargado = false;

  function cargarGoogleTranslate() {
    if (gtCargado) return;
    gtCargado = true;

    const gt = document.createElement('script');
    gt.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    gt.async = true;
    gt.onerror = () => console.warn('[Idioma] No se pudo descargar Google Translate (bloqueado por CSP, red o extensión).');
    document.body.appendChild(gt);

    setTimeout(() => {
      if (!(window.google && google.translate && google.translate.TranslateElement)) {
        console.warn('[Idioma] Google Translate no cargó. Revisa los mensajes "Refused to..." de la consola.');
      } else if (!document.querySelector('select.goog-te-combo')) {
        console.warn('[Idioma] El widget cargó pero no creó el selector interno. Probable bloqueo de CSP o de una extensión.');
      }
    }, 6000);
  }

  if (location.protocol === 'file:') {
    console.warn('[Idioma] Abriste la página como file://. Las cookies no funcionan así: usa un servidor (Live Server, hosting).');
  }

  if (idiomaActual() !== IDIOMA_ORIGINAL) cargarGoogleTranslate();

  document.querySelectorAll('.language-menu').forEach((menu) => {
    ['pointerenter', 'focusin', 'touchstart'].forEach((ev) => {
      menu.addEventListener(ev, cargarGoogleTranslate, { once: true, passive: true });
    });
  });

  function changeLanguage(language) {
    if (!IDIOMAS.includes(language)) return;
    if (language === idiomaActual()) return;

    borrarCookieTraduccion();

    // Volver al español: se quita la cookie y se recarga
    if (language === IDIOMA_ORIGINAL) {
      window.location.reload();
      return;
    }

    const valor = '/' + IDIOMA_ORIGINAL + '/' + language;
    document.cookie = 'googtrans=' + valor + COOKIE_ATTRS;
    document.cookie = 'googtrans=' + valor + COOKIE_ATTRS + '; domain=' + location.hostname;

    // Si el widget ya está listo, se cambia directo; si no, se recarga con la cookie puesta
    const combo = document.querySelector('select.goog-te-combo');
    if (combo) {
      combo.value = language;
      combo.dispatchEvent(new Event('change'));
    } else {
      window.location.reload();
    }
  }

  function setLanguageMenu(menu, open) {
    menu.classList.toggle('open', open);
    const button = menu.querySelector('.language-button');
    if (button) button.setAttribute('aria-expanded', String(open));
  }

  document.querySelectorAll('.language-menu').forEach((menu) => {
    const button = menu.querySelector('.language-button');
    if (button) {
      button.addEventListener('click', () => setLanguageMenu(menu, !menu.classList.contains('open')));
    }

    menu.querySelectorAll('[data-lang]').forEach((opt) => {
      opt.addEventListener('click', () => changeLanguage(opt.dataset.lang));
    });

    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        setLanguageMenu(menu, false);
        if (button) button.focus();
      }
    });
  });

  document.addEventListener('click', (event) => {
    document.querySelectorAll('.language-menu.open').forEach((menu) => {
      if (!menu.contains(event.target)) setLanguageMenu(menu, false);
    });
  });

  // =========================================
  // ANIMACIÓN DE ELEMENTOS AL BAJAR
  // =========================================
  const revealEls = document.querySelectorAll('.reveal');

  if (hasIO) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('in');
          revealObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    // Navegadores sin IntersectionObserver: mostrar todo
    revealEls.forEach((el) => el.classList.add('in'));
  }

  // =========================================
  // HERO - FONDO AUTOMÁTICO
  // =========================================
  const heroSlides = document.querySelectorAll('.hero-bg-slide');

  if (heroSlides.length > 1) {
    let heroIndex = 0;

    setInterval(() => {
      heroSlides[heroIndex].classList.remove('is-active');
      heroIndex = (heroIndex + 1) % heroSlides.length;
      heroSlides[heroIndex].classList.add('is-active');
    }, 3000);
  }

  // =========================================
  // CARRUSEL GENÉRICO (figuras y premios)
  // =========================================
  function createCarousel(items, ids, dotClass, dotLabel) {
    const img = $(ids.img);
    const title = $(ids.title);
    const desc = $(ids.desc);
    const num = $(ids.num);
    const dots = $(ids.dots);
    const prev = $(ids.prev);
    const next = $(ids.next);

    if (!items.length || !prev || !next || !img || !title || !desc || !num) return;

    let index = 0;
    const dotEls = [];

    function buildDots() {
      if (!dots) return;
      dots.innerHTML = '';

      items.forEach((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = dotClass;
        dot.setAttribute('aria-label', dotLabel + (i + 1));
        dot.addEventListener('click', () => go(i, i > index ? 1 : -1));
        dots.appendChild(dot);
        dotEls.push(dot);
      });
    }

    function renderDots() {
      dotEls.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function render() {
      const item = items[index];
      img.src = item.imagen;
      img.alt = item.titulo;
      title.textContent = item.titulo;
      desc.textContent = item.descripcion;
      num.textContent = pad2(index + 1) + ' / ' + pad2(items.length);
      renderDots();
    }

    // Transición suave: sale el contenido actual, se cambia y entra el nuevo
    const reducirMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animables = [img, title, desc, num];
    let animando = false;

    function go(nuevo, dir) {
      if (animando || nuevo === index) return;

      if (reducirMovimiento.matches || !img.animate) {
        index = nuevo;
        render();
        return;
      }

      animando = true;
      const salida = dir > 0 ? -36 : 36;

      // Precarga la imagen nueva para que no parpadee al cambiarla
      const pre = new Image();
      pre.src = items[nuevo].imagen;
      const lista = new Promise((resolve) => {
        pre.onload = pre.onerror = resolve;
        if (pre.complete) resolve();
      });

      const saliendo = animables.map((el) =>
        el.animate(
          [
            { opacity: 1, transform: 'translateX(0)' },
            { opacity: 0, transform: 'translateX(' + salida + 'px)' }
          ],
          { duration: 240, easing: 'ease-in', fill: 'forwards' }
        )
      );

      Promise.all([Promise.all(saliendo.map((a) => a.finished)), lista])
        .then(() => {
          index = nuevo;
          render();

          animables.forEach((el, n) => {
            el.animate(
              [
                { opacity: 0, transform: 'translateX(' + (-salida) + 'px)' },
                { opacity: 1, transform: 'translateX(0)' }
              ],
              { duration: 380, easing: 'cubic-bezier(.22,.61,.36,1)', delay: n * 40, fill: 'backwards' }
            );
          });
          saliendo.forEach((a) => a.cancel());

          setTimeout(() => { animando = false; }, 380);
        })
        .catch(() => {
          saliendo.forEach((a) => a.cancel());
          animando = false;
        });
    }

    prev.addEventListener('click', () => go((index - 1 + items.length) % items.length, -1));
    next.addEventListener('click', () => go((index + 1) % items.length, 1));

    buildDots();
    render();
  }

  // =========================================
  // FIGURAS IMPORTANTES
  // =========================================
  const figuras = [
    {
      imagen: 'EMBAJADORA DE LOS ESTADOS UNIDOS Y EL MINISTRO LUIS MIGUE DE CAMPS.jpg',
      titulo: 'Embajadora de los Estados Unidos en República Dominicana',
      descripcion:
        'El viernes 18 de septiembre de 2026, en el marco de la ' +
        'visita oficial de la embajadora de los Estados Unidos ' +
        'al Ministerio de Educación, el Departamento de Informática ' +
        'Educativa realizó una exhibición de los recursos de ' +
        'robótica presentes en las escuelas públicas. En esta ' +
        'actividad tuvimos el honor de compartir con la embajadora ' +
        'y mostrarle nuestros proyectos.'
    },
    {
      imagen: 'abraham1.jpg',
      titulo: 'Abraham Dauhajre',
      descripcion:
        'Tuvimos el honor y el placer de contar con el apoyo constante de Abraham Dauhajre, ' +
        'una figura fundamental para el desarrollo de la robótica educativa y el programa FIRST ' +
        'en República Dominicana. A lo largo de nuestra trayectoria, hemos contado con su orientación, ' +
        'respaldo y acompañamiento, contribuyendo al crecimiento de nuestro equipo y a nuestra participación ' +
        'en competencias de robótica. Su compromiso con los jóvenes y con el desarrollo de la ciencia, la tecnología ' +
        'y la innovación ha sido un apoyo invaluable para nosotros.'
    },
    {
      imagen: 'Ancell.jpg',
      titulo: 'Ancell Scheker',
      descripcion:
        'Tuvimos el honor y el placer de contar con la visita ' +
        'a nuestras instalaciones de la Viceministra de Asuntos Técnicos y Pedagógicos ' +
        'del Ministerio de Educación de República Dominicana Ancell Scheker, ' +
        'la cual estuvo viendo nuestros proyectos y conociendo más del equipo.'
    },
    {
      imagen: 'Aileed decamps.jpg',
      titulo: 'Aileen Decamps',
      descripcion:
        'Como equipo tuvimos el honor de tener la visita de la Regidora de Santo Domingo Este ' +
        'Aileen Decamps, la cual es nuestra madrina y siempre podemos contar con su apoyo.'
    },
    {
      imagen: 'regidora2.jpg',
      titulo: 'Jehimy Esthefany Núñez Pérez',
      descripcion:
        'Tuvimos el honor de contar con su visita en nuestras instalaciones, ' +
        'y de poder encontrárnosla el día de la competencia en Miami y contar con su apoyo.'
    }
  ];

  createCarousel(
    figuras,
    {
      img: 'figuraImagen',
      title: 'figuraNombre',
      desc: 'figuraDescripcion',
      num: 'figuraNumero',
      dots: 'figuraPuntos',
      prev: 'figuraPrev',
      next: 'figuraNext'
    },
    'figura-punto',
    'Ir a la figura '
  );

  // =========================================
  // PREMIOS OBTENIDOS
  // =========================================
  const premios = [
    {
      imagen: 'LOGROS.jpg',
      titulo: 'Nuestros reconocimientos',
      descripcion:
        'Nuestros reconocimientos son una muestra del esfuerzo, la dedicación y el ' +
        'compromiso de todo el equipo. Cada logro refleja nuestras capacidades, el trabajo en ' +
        'conjunto y nuestras ganas de seguir creciendo, superando desafíos y alcanzando nuevas metas.'
    },
    {
      imagen: 'Stem For Everyone 2025.jpg',
      titulo: 'Stem For Everyone',
      descripcion:
        'En nuestro primer año 2025 tuvimos el honor de poder obtener el Stem For Everyone, un reconocimiento ' +
        'que representa nuestro compromiso con la educación STEM y con la creación de ' +
        'oportunidades para que más jóvenes puedan descubrir, aprender y crecer a través de la ciencia, ' +
        'la tecnología, la ingeniería y las matemáticas.'
    },
    {
      imagen: 'Spirit Award 2026.jpg',
      titulo: 'Team Spirit Award',
      descripcion:
        'En nuestro segundo año 2026, tuvimos el honor de poder obtener el Spirit Award, ' +
        'un reconocimiento que premia el entusiasmo, la unión, la energía y el espíritu de ' +
        'colaboración demostrado por un equipo durante la competencia. ' +
        'Este premio destacó nuestra pasión por la robótica, el compañerismo y la manera ' +
        'en que representamos los valores de FIRST, tanto dentro como fuera de la cancha.'
    },
    {
      imagen: 'Stem For Everyone 2026.jpg',
      titulo: 'Stem For Everyone',
      descripcion:
        'En nuestro segundo año 2026 pudimos obtener nuevamente el Stem For Everyone, un reconocimiento que ' +
        'reafirma nuestro compromiso con la educación STEM, la inclusión y ' +
        'el desarrollo de nuevas oportunidades para los jóvenes. Este logro refleja nuestro esfuerzo ' +
        'por inspirar, compartir conocimientos y demostrar que el talento y la innovación pueden ' +
        'transformar nuestro futuro.'
    }
  ];

  createCarousel(
    premios,
    {
      img: 'premioImagen',
      title: 'premioTitulo',
      desc: 'premioDescripcion',
      num: 'premioNumero',
      dots: 'premioPuntos',
      prev: 'premioPrev',
      next: 'premioNext'
    },
    'premio-punto',
    'Ir al premio '
  );

  // =========================================
  // SEGURIDAD: saneado y validación (formularios)
  // Todo esto es una primera barrera en el navegador; el servidor
  // (Web3Forms) sigue siendo la barrera real.
  // =========================================
  const MAX_CHARS = 500;
  const MAX_SENDS = 3;
  const WINDOW_MS = 60 * 1000;
  const MIN_FILL_MS = 3000;          // un humano tarda más que esto en llenar el formulario
  const SEND_TIMEOUT_MS = 15000;
  const STORAGE_KEY = 'tm_envios';
  const PAGE_LOADED_AT = Date.now();

  const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
  const ACCESS_KEY = '2a3180ba-1748-4878-b2bc-6585d93ec0a7'; // clave pública de Web3Forms (no es secreta)
  const TIPOS_VALIDOS = ['Donación', 'Patrocinio', 'Voluntariado'];

  // Caracteres de control, de ancho cero y de dirección (U+202E "RLO" se usa para falsear texto)
  const CTRL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g;

  function clean(value, max, multiline) {
    let s = String(value == null ? '' : value).normalize('NFKC').replace(CTRL, '');
    s = multiline
      ? s.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n')
      : s.replace(/[\r\n\t]+/g, ' ');
    s = s.replace(/[<>]/g, '').trim();      // sin etiquetas HTML en los correos que recibe el equipo
    return s.slice(0, max);
  }

  // Los campos cortos no admiten etiquetas HTML: se rechaza en vez de "arreglar" en silencio
  const hasTags = (el) => !!el && /[<>]/.test(el.value);

  // Evita "inyección de fórmulas" si alguien abre las respuestas en Excel/Sheets
  const neutralizeFormula = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);

  const NOMBRE_RE  = /^\p{L}[\p{L}\p{M}' .\-’]*$/u;
  const EMPRESA_RE = /^[\p{L}\p{N}][\p{L}\p{M}\p{N} .,&'’()\-\/#+]*$/u;
  const EMAIL_RE   = /^[A-Za-z0-9][A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]{0,63}@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

  function isEmail(v) {
    if (v.length > 254 || !EMAIL_RE.test(v)) return false;
    const [local, domain] = v.split('@');
    return !/\.\./.test(v) && !local.endsWith('.') && /[A-Za-z]{2,}$/.test(domain);
  }

  // Marca/desmarca un campo y devuelve si es válido
  function check(wrapperId, valid) {
    const el = $(wrapperId);
    if (!el) return valid;
    el.classList.toggle('invalid', !valid);
    el.querySelectorAll('input:not([type="hidden"]):not([type="search"]), textarea').forEach((f) => {
      f.setAttribute('aria-invalid', valid ? 'false' : 'true');
    });
    return valid;
  }

  function showStatus(el, type, text) {
    if (!el) return;
    el.className = type === 'ok' ? 'ok' : 'bad';
    el.textContent = text;           // textContent: nunca se interpreta como HTML
  }

  // Envía solo los campos permitidos (lista blanca), no el DOM completo:
  // así un campo oculto agregado desde las herramientas del navegador no viaja.
  function sendForm(fields) {
    const data = new FormData();
    data.append('access_key', ACCESS_KEY);
    Object.keys(fields).forEach((k) => data.append(k, fields[k]));

    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);

    return fetch(WEB3FORMS_URL, {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: data,
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'strict-origin-when-cross-origin',
      signal: ctrl.signal
    })
      .then((response) =>
        response.json().then(
          (json) => ({ ok: response.ok, status: response.status, json }),
          () => ({ ok: response.ok, status: response.status, json: {} })
        )
      )
      .then(({ ok, status, json }) => {
        if (ok && json && json.success === true) return json;
        if (status === 429) throw new Error('Has enviado demasiados mensajes. Espera un minuto e inténtalo de nuevo.');
        if (status === 400 || status === 422) throw new Error('Revisa los datos del formulario.');
        throw new Error('No pudimos enviar el mensaje. Inténtalo nuevamente.');
      })
      .catch((err) => {
        if (err && err.name === 'AbortError') throw new Error('El envío tardó demasiado. Inténtalo nuevamente.');
        if (err instanceof TypeError) throw new Error('No hay conexión. Revisa tu internet e inténtalo de nuevo.');
        throw err;
      })
      .finally(() => clearTimeout(timer));
  }

  // Contador de caracteres bajo el textarea
  function addCounter(textarea) {
    if (!textarea) return;
    textarea.maxLength = MAX_CHARS;

    const counter = document.createElement('div');
    counter.style.cssText = 'margin-top:6px;text-align:right;font-size:.78rem;color:#565B68;';
    textarea.insertAdjacentElement('afterend', counter);

    const update = () => { counter.textContent = textarea.value.length + ' / ' + MAX_CHARS; };
    textarea.addEventListener('input', update);
    textarea.form.addEventListener('reset', () => setTimeout(update, 0));
    update();
  }

  addCounter($('s-mensaje'));
  addCounter($('c-msg'));

  // Límite de envíos por minuto (solo ayuda al usuario honesto: el almacenamiento
  // local se puede borrar, el límite real debe estar en el servidor)
  function rateLimited(statusEl) {
    const now = Date.now();
    let sends = [];

    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      sends = (Array.isArray(saved) ? saved : [])
        .filter((t) => typeof t === 'number' && t <= now && now - t < WINDOW_MS);
    } catch (err) {
      sends = [];
    }

    if (sends.length >= MAX_SENDS) {
      const wait = Math.ceil((WINDOW_MS - (now - sends[0])) / 1000);
      showStatus(statusEl, 'bad', 'Has enviado demasiados mensajes. Espera ' + wait + ' segundos e inténtalo de nuevo.');
      return true;
    }

    sends.push(now);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sends)); } catch (err) { /* sin storage */ }
    return false;
  }

  // Bloqueos anti-bot comunes a los dos formularios. Devuelve true si debe detenerse.
  function looksLikeBot(form, statusEl) {
    const trap = form.elements.botcheck;
    if (trap && trap.checked) return true;                        // trampa para bots
    if (Date.now() - PAGE_LOADED_AT < MIN_FILL_MS) {              // formulario enviado demasiado rápido
      showStatus(statusEl, 'bad', 'Espera unos segundos e inténtalo de nuevo.');
      return true;
    }
    return false;
  }

  // =========================================
  // TELÉFONO: selector de país con bandera y código
  // =========================================
  // ISO | nombre | código de marcación
  const PAISES_RAW = [
    'AF|Afganistán|93','AL|Albania|355','DE|Alemania|49','AD|Andorra|376','AO|Angola|244','AI|Anguila|1',
    'AG|Antigua y Barbuda|1','SA|Arabia Saudita|966','DZ|Argelia|213','AR|Argentina|54','AM|Armenia|374',
    'AW|Aruba|297','AU|Australia|61','AT|Austria|43','AZ|Azerbaiyán|994','BS|Bahamas|1','BD|Bangladés|880',
    'BB|Barbados|1','BH|Baréin|973','BE|Bélgica|32','BZ|Belice|501','BJ|Benín|229','BY|Bielorrusia|375',
    'BM|Bermudas|1','BO|Bolivia|591','BA|Bosnia y Herzegovina|387','BW|Botsuana|267','BR|Brasil|55',
    'BN|Brunéi|673','BG|Bulgaria|359','BF|Burkina Faso|226','BI|Burundi|257','BT|Bután|975','CV|Cabo Verde|238',
    'KH|Camboya|855','CM|Camerún|237','CA|Canadá|1','QA|Catar|974','TD|Chad|235','CL|Chile|56','CN|China|86',
    'CY|Chipre|357','VA|Ciudad del Vaticano|379','CO|Colombia|57','KM|Comoras|269','CG|Congo|242',
    'CD|Congo (RD)|243','KP|Corea del Norte|850','KR|Corea del Sur|82','CI|Costa de Marfil|225',
    'CR|Costa Rica|506','HR|Croacia|385','CU|Cuba|53','CW|Curazao|599','DK|Dinamarca|45','DM|Dominica|1',
    'EC|Ecuador|593','EG|Egipto|20','SV|El Salvador|503','AE|Emiratos Árabes Unidos|971','ER|Eritrea|291',
    'SK|Eslovaquia|421','SI|Eslovenia|386','ES|España|34','US|Estados Unidos|1','EE|Estonia|372',
    'SZ|Esuatini|268','ET|Etiopía|251','PH|Filipinas|63','FI|Finlandia|358','FJ|Fiyi|679','FR|Francia|33',
    'GA|Gabón|241','GM|Gambia|220','GE|Georgia|995','GH|Ghana|233','GI|Gibraltar|350','GD|Granada|1',
    'GR|Grecia|30','GL|Groenlandia|299','GP|Guadalupe|590','GU|Guam|1','GT|Guatemala|502',
    'GF|Guayana Francesa|594','GG|Guernsey|44','GN|Guinea|224','GQ|Guinea Ecuatorial|240',
    'GW|Guinea-Bisáu|245','GY|Guyana|592','HT|Haití|509','HN|Honduras|504','HK|Hong Kong|852',
    'HU|Hungría|36','IN|India|91','ID|Indonesia|62','IQ|Irak|964','IR|Irán|98','IE|Irlanda|353',
    'IS|Islandia|354','KY|Islas Caimán|1','CK|Islas Cook|682','FO|Islas Feroe|298','FK|Islas Malvinas|500',
    'MP|Islas Marianas del Norte|1','MH|Islas Marshall|692','SB|Islas Salomón|677',
    'TC|Islas Turcas y Caicos|1','VG|Islas Vírgenes Británicas|1','VI|Islas Vírgenes de EE. UU.|1',
    'IL|Israel|972','IT|Italia|39','JM|Jamaica|1','JP|Japón|81','JE|Jersey|44','JO|Jordania|962',
    'KZ|Kazajistán|7','KE|Kenia|254','KG|Kirguistán|996','KI|Kiribati|686','XK|Kosovo|383','KW|Kuwait|965',
    'LA|Laos|856','LS|Lesoto|266','LV|Letonia|371','LB|Líbano|961','LR|Liberia|231','LY|Libia|218',
    'LI|Liechtenstein|423','LT|Lituania|370','LU|Luxemburgo|352','MO|Macao|853','MK|Macedonia del Norte|389',
    'MG|Madagascar|261','MY|Malasia|60','MW|Malaui|265','MV|Maldivas|960','ML|Malí|223','MT|Malta|356',
    'MA|Marruecos|212','MQ|Martinica|596','MU|Mauricio|230','MR|Mauritania|222','MX|México|52',
    'FM|Micronesia|691','MD|Moldavia|373','MC|Mónaco|377','MN|Mongolia|976','ME|Montenegro|382',
    'MS|Montserrat|1','MZ|Mozambique|258','MM|Myanmar|95','NA|Namibia|264','NR|Nauru|674','NP|Nepal|977',
    'NI|Nicaragua|505','NE|Níger|227','NG|Nigeria|234','NO|Noruega|47','NC|Nueva Caledonia|687',
    'NZ|Nueva Zelanda|64','OM|Omán|968','NL|Países Bajos|31','PK|Pakistán|92','PW|Palaos|680',
    'PS|Palestina|970','PA|Panamá|507','PG|Papúa Nueva Guinea|675','PY|Paraguay|595','PE|Perú|51',
    'PF|Polinesia Francesa|689','PL|Polonia|48','PT|Portugal|351','PR|Puerto Rico|1','GB|Reino Unido|44',
    'CF|República Centroafricana|236','CZ|República Checa|420','DO|República Dominicana|1','RE|Reunión|262',
    'RW|Ruanda|250','RO|Rumania|40','RU|Rusia|7','WS|Samoa|685','AS|Samoa Americana|1','BL|San Bartolomé|590',
    'KN|San Cristóbal y Nieves|1','SM|San Marino|378','MF|San Martín (Francia)|590',
    'PM|San Pedro y Miquelón|508','VC|San Vicente y las Granadinas|1','SH|Santa Elena|290',
    'LC|Santa Lucía|1','ST|Santo Tomé y Príncipe|239','SN|Senegal|221','RS|Serbia|381','SC|Seychelles|248',
    'SL|Sierra Leona|232','SG|Singapur|65','SX|Sint Maarten|1','SY|Siria|963','SO|Somalia|252',
    'LK|Sri Lanka|94','ZA|Sudáfrica|27','SD|Sudán|249','SS|Sudán del Sur|211','SE|Suecia|46','CH|Suiza|41',
    'SR|Surinam|597','TH|Tailandia|66','TW|Taiwán|886','TZ|Tanzania|255','TJ|Tayikistán|992',
    'TL|Timor Oriental|670','TG|Togo|228','TO|Tonga|676','TT|Trinidad y Tobago|1','TN|Túnez|216',
    'TM|Turkmenistán|993','TR|Turquía|90','TV|Tuvalu|688','UA|Ucrania|380','UG|Uganda|256','UY|Uruguay|598',
    'UZ|Uzbekistán|998','VU|Vanuatu|678','VE|Venezuela|58','VN|Vietnam|84','YE|Yemen|967','DJ|Yibuti|253',
    'ZM|Zambia|260','ZW|Zimbabue|263'
  ];

  const PAISES_FRECUENTES = ['DO', 'US', 'PR', 'ES', 'MX', 'CO', 'VE', 'PA', 'CA', 'HT'];
  // Cuando varios países comparten código (+1, +7, +44...) se elige este al pegar un número con "+"
  const PAIS_POR_CODIGO = { '1': 'US', '7': 'RU', '44': 'GB', '590': 'GP', '262': 'RE', '599': 'CW' };
  // Largo del número nacional (sin el código de país) para los códigos más usados
  const LARGO_NACIONAL = {
    '1': [10, 10], '7': [10, 10], '52': [10, 10], '34': [9, 9], '57': [8, 10], '58': [10, 10],
    '55': [10, 11], '56': [9, 9], '51': [8, 9], '33': [9, 9], '44': [9, 10], '54': [10, 11],
    '53': [8, 8], '502': [8, 8], '503': [8, 8], '504': [8, 8], '505': [8, 8], '506': [8, 8],
    '507': [7, 8], '509': [8, 8], '591': [8, 8], '593': [8, 9], '598': [8, 9]
  };

  const phoneApi = (function phoneField() {
    const btn = $('countryBtn');
    const panel = $('countryPanel');
    const search = $('countrySearch');
    const list = $('countryList');
    const flagSlot = $('countryFlag');
    const dialEl = $('countryDial');
    const input = $('s-telefono');
    const fullEl = $('s-telefono-full');
    const paisEl = $('s-telefono-pais');
    const root = $('countrySelect');

    if (!btn || !panel || !search || !list || !flagSlot || !dialEl || !input || !root) return null;

    const norm = (t) => String(t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const emoji = (iso) => String.fromCodePoint(...iso.split('').map((c) => 0x1F1E6 + c.charCodeAt(0) - 65));

    const todos = PAISES_RAW.map((row) => {
      const [iso, nombre, dial] = row.split('|');
      return { iso, nombre, dial, key: norm(nombre) };
    });
    const porIso = {};
    todos.forEach((p) => { porIso[p.iso] = p; });

    // Frecuentes primero, luego el resto en orden alfabético (español)
    const frecuentes = PAISES_FRECUENTES.map((iso) => porIso[iso]).filter(Boolean);
    const resto = todos
      .filter((p) => !PAISES_FRECUENTES.includes(p.iso))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
    const ordenados = frecuentes.concat(resto);
    const codigos = new Set(todos.map((p) => p.dial));

    const rango = (dial) => LARGO_NACIONAL[dial] || [6, Math.max(6, 14 - dial.length)];

    // Agrupa los dígitos según el país: (809) 555-1234, 55 1234 5678, 612 34 56 78...
    function formatear(dig, dial) {
      if (dial === '1') {
        const a = dig.slice(0, 3), b = dig.slice(3, 6), c = dig.slice(6, 10);
        let out = a.length < 3 ? a : '(' + a + ')';
        if (b) out += ' ' + b;
        if (c) out += '-' + c;
        return out;
      }
      const grupos = { '52': [2, 4, 4], '34': [3, 2, 2, 2], '57': [3, 3, 4], '58': [3, 3, 4], '33': [1, 2, 2, 2, 2] }[dial] || [3, 3, 4, 4];
      const partes = [];
      let i = 0;
      for (const g of grupos) {
        if (i >= dig.length) break;
        partes.push(dig.slice(i, i + g));
        i += g;
      }
      if (i < dig.length) partes.push(dig.slice(i));
      return partes.join(' ');
    }

    function soloDigitos(v, dial) {
      let d = v.replace(/\D/g, '');
      if (dial === '1' && d.length === 11 && d[0] === '1') d = d.slice(1);   // escribió "1 809..."
      return d.slice(0, rango(dial)[1]);                                    // tope según el país
    }

    // Reescribe el campo con formato y deja el cursor donde estaba
    function aplicarFormato(v) {
      const antes = input.selectionStart == null ? v.length : input.selectionStart;
      const digitosAntes = v.slice(0, antes).replace(/\D/g, '').length;
      const dig = soloDigitos(v, actual.dial);
      const txt = formatear(dig, actual.dial);
      input.value = txt;

      if (document.activeElement === input) {
        let pos = 0, cont = 0;
        while (pos < txt.length && cont < Math.min(digitosAntes, dig.length)) {
          if (/\d/.test(txt[pos])) cont++;
          pos++;
        }
        input.setSelectionRange(pos, pos);
      }
    }

    let actual = porIso.DO;
    let visibles = [];
    let activo = -1;

    // Bandera: imagen (se ve igual en Windows, que no dibuja banderas emoji); si falla, emoji
    function flagNode(p) {
      const wrap = document.createElement('span');
      wrap.className = 'flag';
      wrap.setAttribute('aria-hidden', 'true');

      const img = document.createElement('img');
      img.width = 20;
      img.height = 15;
      img.alt = '';
      img.decoding = 'async';
      img.referrerPolicy = 'no-referrer';
      img.src = 'https://flagcdn.com/w20/' + p.iso.toLowerCase() + '.png';
      img.srcset = 'https://flagcdn.com/w40/' + p.iso.toLowerCase() + '.png 2x';
      img.addEventListener('error', () => { wrap.textContent = emoji(p.iso); });

      wrap.appendChild(img);
      return wrap;
    }

    function pintarBoton() {
      flagSlot.replaceChildren(flagNode(actual));
      dialEl.textContent = '+' + actual.dial;
      btn.setAttribute('aria-label', 'País del teléfono: ' + actual.nombre + ', +' + actual.dial);
      input.placeholder = 'Ej. ' + (actual.dial === '1' ? '(809) 555-1234' : formatear('612345678901234'.slice(0, rango(actual.dial)[0]), actual.dial));
      if (input.value) aplicarFormato(input.value);
    }

    function elegir(p, enfocar) {
      actual = p;
      pintarBoton();
      cerrar(false);
      const f = $('f-telefono');
      if (f) f.classList.remove('invalid');
      if (enfocar !== false) input.focus();
    }

    function pintarLista(consulta) {
      const q = norm(consulta).trim();
      const qDigitos = q.replace(/\D/g, '');

      visibles = ordenados.filter((p) => {
        if (!q) return true;
        if (qDigitos && /^[+\d\s]+$/.test(q)) return p.dial.startsWith(qDigitos);
        return p.key.includes(q) || p.iso.toLowerCase() === q;
      });

      list.replaceChildren();
      activo = -1;

      if (!visibles.length) {
        const vacio = document.createElement('li');
        vacio.className = 'country-empty';
        vacio.setAttribute('role', 'presentation');
        vacio.textContent = 'No encontramos ese país.';
        list.appendChild(vacio);
        search.removeAttribute('aria-activedescendant');
        return;
      }

      visibles.forEach((p, i) => {
        const li = document.createElement('li');
        li.id = 'country-opt-' + i;
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', p.iso === actual.iso ? 'true' : 'false');
        if (!q && i === frecuentes.length) li.classList.add('group-start');

        const nombre = document.createElement('span');
        nombre.className = 'name';
        nombre.textContent = p.nombre;

        const code = document.createElement('span');
        code.className = 'code';
        code.textContent = '+' + p.dial;

        li.append(flagNode(p), nombre, code);
        li.addEventListener('click', () => elegir(p));
        list.appendChild(li);
      });

      // Posiciona en el país actual
      const idx = visibles.findIndex((p) => p.iso === actual.iso);
      marcar(idx >= 0 ? idx : 0);
    }

    function marcar(i) {
      const items = list.querySelectorAll('[role="option"]');
      if (!items.length) return;
      activo = (i + items.length) % items.length;
      items.forEach((el, n) => el.classList.toggle('active', n === activo));
      search.setAttribute('aria-activedescendant', items[activo].id);
      items[activo].scrollIntoView({ block: 'nearest' });
    }

    function abrir() {
      panel.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      search.value = '';
      pintarLista('');
      search.focus();
    }

    function cerrar(devolverFoco) {
      if (panel.hidden) return;
      panel.hidden = true;
      btn.setAttribute('aria-expanded', 'false');
      search.removeAttribute('aria-activedescendant');
      if (devolverFoco) btn.focus();
    }

    btn.addEventListener('click', () => (panel.hidden ? abrir() : cerrar(true)));

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (panel.hidden) abrir();
      }
    });

    search.addEventListener('input', () => {
      search.value = search.value.replace(CTRL, '').slice(0, 30);
      pintarLista(search.value);
    });

    search.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); marcar(activo + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); marcar(activo - 1); }
      else if (e.key === 'Home') { e.preventDefault(); marcar(0); }
      else if (e.key === 'End') { e.preventDefault(); marcar(visibles.length - 1); }
      else if (e.key === 'Enter') {
        e.preventDefault();                       // sin esto, Enter enviaría el formulario
        if (visibles[activo]) elegir(visibles[activo]);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cerrar(true);
      } else if (e.key === 'Tab') {
        cerrar(false);
      }
    });

    // Mantiene el foco en el buscador al hacer clic en la lista
    list.addEventListener('mousedown', (e) => e.preventDefault());

    document.addEventListener('click', (e) => { if (!root.contains(e.target)) cerrar(false); });
    root.addEventListener('focusout', (e) => {
      if (e.relatedTarget && !root.contains(e.relatedTarget)) cerrar(false);
    });

    // Escribir o pegar "+52 55 1234 5678" cambia el país solo
    function detectarPais(valor) {
      const dig = valor.replace(/\D/g, '');
      const dial = [dig.slice(0, 1), dig.slice(0, 2), dig.slice(0, 3)].find((d) => d && codigos.has(d));
      if (!dial) return null;

      const resto = dig.slice(dial.length);
      let pais = null;

      if (dial === '1') {
        if (/^(809|829|849)/.test(resto)) pais = porIso.DO;
        else if (actual.dial === '1') pais = actual;
        else pais = porIso.US;
      } else if (actual.dial === dial) {
        pais = actual;
      } else {
        pais = porIso[PAIS_POR_CODIGO[dial]] || todos.find((p) => p.dial === dial);
      }
      return pais ? { pais, resto } : null;
    }

    input.addEventListener('input', () => {
      // Solo dígitos y separadores habituales
      let v = input.value.replace(/[^\d\s().+\-]/g, '');

      if (/^\s*\+/.test(v)) {
        const r = detectarPais(v);
        if (r) {
          actual = r.pais;
          pintarBoton();
          v = r.resto;
        }
      } else {
        v = v.replace(/\+/g, '');      // el "+" solo vale al inicio
      }

      aplicarFormato(v);
      const f = $('f-telefono');
      if (f) f.classList.remove('invalid');
    });

    // Al salir del campo avisa de inmediato si el número no es válido
    input.addEventListener('blur', () => {
      if (input.value.trim() === '') return;
      check('f-telefono', validate().ok);
    });

    // Valida y deja el número final en formato internacional (E.164)
    function validate() {
      const dial = actual.dial;
      const dig = soloDigitos(input.value, dial);
      const [min, max] = rango(dial);
      const errEl = $('s-telefono-error');
      let msg = '';

      if (dig.length < min || dig.length > max) {
        msg = min === max
          ? 'El número de ' + actual.nombre + ' debe tener ' + min + ' dígitos.'
          : 'El número de ' + actual.nombre + ' debe tener entre ' + min + ' y ' + max + ' dígitos.';
      } else if (dial.length + dig.length > 15 || /^(\d)\1+$/.test(dig)) {
        msg = 'Ese número no parece válido.';
      } else if (dial === '1') {
        if (actual.iso === 'DO' && !/^(809|829|849)[2-9]\d{6}$/.test(dig)) {
          msg = 'Un número dominicano empieza con 809, 829 o 849 y tiene 10 dígitos.';
        } else if (actual.iso !== 'DO' && !/^[2-9]\d{2}[2-9]\d{6}$/.test(dig)) {
          msg = 'Ese número no parece válido para ' + actual.nombre + '.';
        }
      }

      if (errEl) errEl.textContent = msg || 'Ingresa un teléfono válido.';
      const ok = msg === '';
      return { ok, e164: ok ? '+' + dial + dig : '', pais: actual.nombre };
    }

    function reset() {
      actual = porIso.DO;
      pintarBoton();
      cerrar(false);
      if (fullEl) fullEl.value = '';
      if (paisEl) paisEl.value = '';
    }

    pintarBoton();
    if (input.form) input.form.addEventListener('reset', () => setTimeout(reset, 0));

    return { validate };
  })();

  // =========================================
  // FORMULARIO DE PATROCINIO
  // =========================================
  const sponsorForm = $('sponsorForm');

  if (sponsorForm) {
    const pills = () => document.querySelectorAll('#tipoGroup .radio-pill');

    // Selección visual del tipo
    document.querySelectorAll('.radio-pill input').forEach((input) => {
      input.addEventListener('change', () => {
        pills().forEach((p) => p.classList.remove('checked'));
        const pill = input.closest('.radio-pill');
        if (pill) pill.classList.add('checked');
        const tipo = $('f-tipo');
        if (tipo) tipo.classList.remove('invalid');
      });
    });

    sponsorForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (sponsorForm.dataset.sending === '1') return;      // evita envíos dobles

      const status = $('formStatus');
      const tipoEl = sponsorForm.querySelector('input[name="tipo"]:checked');

      const nombre  = clean($('s-nombre').value, 80, false);
      const empresa = clean($('s-empresa').value, 100, false);
      const correo  = clean($('s-correo').value, 254, false);
      const tipo    = tipoEl && TIPOS_VALIDOS.includes(tipoEl.value) ? tipoEl.value : '';
      const mensaje = neutralizeFormula(clean($('s-mensaje').value, MAX_CHARS, true));
      const tel     = phoneApi ? phoneApi.validate() : { ok: false };

      const results = [
        check('f-nombre',   nombre.length >= 2 && NOMBRE_RE.test(nombre) && !hasTags($('s-nombre'))),
        check('f-empresa',  empresa.length >= 2 && EMPRESA_RE.test(empresa) && !hasTags($('s-empresa'))),
        check('f-correo',   isEmail(correo)),
        check('f-telefono', tel.ok),
        check('f-tipo',     !!tipo),
        check('f-mensaje',  mensaje.length > 0 && $('s-mensaje').value.length <= MAX_CHARS)
      ];

      if (results.includes(false)) {
        showStatus(status, 'bad', 'Revisa los campos marcados en rojo antes de enviar.');
        return;
      }

      if (looksLikeBot(sponsorForm, status)) return;
      if (rateLimited(status)) return;

      if ($('s-telefono-full')) $('s-telefono-full').value = tel.e164;
      if ($('s-telefono-pais')) $('s-telefono-pais').value = tel.pais;

      const btn = sponsorForm.querySelector('.submit-btn');
      sponsorForm.dataset.sending = '1';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

      sendForm({
        subject: 'Nueva solicitud de patrocinio / donación - Team Merengue',
        from_name: 'Web Team Merengue - Patrocinios',
        name: nombre,
        empresa: empresa,
        email: correo,
        telefono: tel.e164,
        pais_telefono: tel.pais,
        tipo: tipo,
        message: mensaje
      })
        .then(() => {
          showStatus(
            status,
            'ok',
            '¡Gracias, ' + nombre + '! Recibimos tu solicitud de ' + tipo.toLowerCase() +
              ' y te contactaremos pronto a ' + correo + '.'
          );
          sponsorForm.reset();
          pills().forEach((p) => p.classList.remove('checked'));
        })
        .catch((err) => showStatus(status, 'bad', err.message))
        .finally(() => {
          sponsorForm.dataset.sending = '0';
          if (btn) { btn.disabled = false; btn.textContent = 'Enviar solicitud'; }
        });
    });
  }

  // =========================================
  // FORMULARIO DE CONTACTO
  // =========================================
  const contactForm = $('contactForm');

  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (contactForm.dataset.sending === '1') return;

      const status = $('contactStatus');

      const nombre  = clean($('c-name').value, 80, false);
      const correo  = clean($('c-mail').value, 254, false);
      const mensaje = neutralizeFormula(clean($('c-msg').value, MAX_CHARS, true));

      const results = [
        check('c-nombre',  nombre.length >= 2 && NOMBRE_RE.test(nombre) && !hasTags($('c-name'))),
        check('c-correo',  isEmail(correo)),
        check('c-mensaje', mensaje.length > 0 && $('c-msg').value.length <= MAX_CHARS)
      ];

      if (results.includes(false)) {
        showStatus(status, 'bad', 'Completa los campos marcados en rojo.');
        return;
      }

      if (looksLikeBot(contactForm, status)) return;
      if (rateLimited(status)) return;

      const btn = contactForm.querySelector('.submit-btn');
      contactForm.dataset.sending = '1';
      if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

      sendForm({
        subject: 'Nuevo mensaje de contacto - Team Merengue',
        from_name: 'Web Team Merengue - Contacto',
        name: nombre,
        email: correo,
        message: mensaje
      })
        .then(() => {
          showStatus(status, 'ok', '¡Mensaje enviado! Te responderemos pronto a ' + correo + '.');
          contactForm.reset();
        })
        .catch((err) => showStatus(status, 'bad', err.message))
        .finally(() => {
          contactForm.dataset.sending = '0';
          if (btn) { btn.disabled = false; btn.textContent = 'Enviar mensaje'; }
        });
    });
  }

  // =========================================
  // SUBMENÚS: hover en PC, toque en celular
  // =========================================
  const esPC = window.matchMedia('(min-width: 901px) and (hover: hover)');

  document.querySelectorAll('details.has-sub').forEach((menu) => {
    const open = () => { if (esPC.matches) menu.open = true; };
    const close = () => { if (esPC.matches) menu.open = false; };

    menu.addEventListener('mouseenter', open);
    menu.addEventListener('mouseleave', close);
    menu.addEventListener('focusin', open);

    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') menu.open = false;
    });

    const resumen = menu.querySelector('summary');
    if (resumen) {
      resumen.addEventListener('click', (e) => {
        if (esPC.matches) e.preventDefault();
      });
    }
  });

  // =========================================
  // CARRUSEL DE PATROCINADORES
  // =========================================
  (function sponsorsMarquee() {
    const marquee = document.querySelector('.sponsors-marquee');
    const track = marquee && marquee.querySelector('.sponsors-track');
    if (!track) return;

    const SPEED = 30; // píxeles por segundo (más alto = más rápido)
    const originals = Array.from(track.children);
    let setWidth = 0;
    let x = 0;
    let last = 0;
    let paused = false;

    // Duplica los logos hasta cubrir el ancho visible + un ciclo completo
    function build() {
      track.querySelectorAll('[data-clone]').forEach((n) => n.remove());
      x = 0;
      setWidth = track.offsetWidth;
      if (!setWidth) return;

      while (track.offsetWidth < marquee.offsetWidth + setWidth) {
        originals.forEach((img) => {
          const copy = img.cloneNode();
          copy.alt = '';
          copy.setAttribute('aria-hidden', 'true');
          copy.setAttribute('data-clone', '');
          track.appendChild(copy);
        });
      }
    }

    function tick(t) {
      const dt = Math.min((t - (last || t)) / 1000, 0.1);
      last = t;

      if (!paused && setWidth) {
        x -= SPEED * dt;
        if (-x >= setWidth) x += setWidth;
        track.style.transform = 'translateX(' + x + 'px)';
      }
      requestAnimationFrame(tick);
    }

    marquee.addEventListener('mouseenter', () => { paused = true; });
    marquee.addEventListener('mouseleave', () => { paused = false; });
    marquee.addEventListener('touchstart', () => { paused = true; }, { passive: true });
    marquee.addEventListener('touchend', () => { paused = false; });

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(build, 150);
    });

    const start = () => {
      build();
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        requestAnimationFrame(tick);
      }
    };

    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start);
  })();

})();