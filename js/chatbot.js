/* Business Automation — on-site assistant (rule-based, business knowledge) */
(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };

  var site = { brandName: 'Business Automation', contact: { email: '', phone: '', address: '' }, signupEnabled: true };
  try {
    fetch('/api/site-info').then(function (r) { return r.json(); }).then(function (d) {
      if (d && d.site) site = d.site;
      if (d && typeof d.signupEnabled === 'boolean') site.signupEnabled = d.signupEnabled;
    }).catch(function () {});
  } catch (e) {}

  function signupOpen() { return site.signupEnabled !== false; }
  function signupReply(lang) {
    if (signupOpen()) {
      if (lang === 'n') return 'मिल्छ! यो site मा \u201cGet Started\u201d थिच्नुहोस्, अनि \u201cCreate account\u201d — Full Name, Username, Email र Password भर्नुहोस्। हामी 6-digit code email गर्छौं, त्यो हाल्नुहोस्, अनि login गर्नुहोस्।';
      if (lang === 'r') return 'Milcha! Yo site ma \u201cGet Started\u201d thichnus, ani \u201cCreate account\u201d — Full Name, Username, Email ra Password bharnus. Hami 6-digit code email garchau, tyo halnus, ani login garnus.';
      return 'Yes! Click \u201cGet Started\u201d on this site, then \u201cCreate account\u201d — fill in your Full Name, Username, Email and Password. We\u2019ll email you a 6-digit code, enter it, and then you can log in.';
    }
    if (lang === 'n') return 'अहिले signup बन्द छ \u2014 नयाँ account हाम्रो admin ले बनाइदिन्छ। Account को लागि सम्पर्क गर्नुहोस्: ' + contactLine() + '\u0964';
    if (lang === 'r') return 'Ahile signup banda cha \u2014 naya account hamro admin le banaidincha. Account ko lagi samparka garnus: ' + contactLine() + '.';
    return 'Self-signup is currently closed \u2014 new accounts are created by our admin. To get an account, please contact us: ' + contactLine() + '.';
  }

  function contactLine() {
    var c = site.contact || {}, parts = [];
    if (c.email) parts.push('Email: ' + c.email);
    if (c.phone) parts.push('Phone: ' + c.phone);
    return parts.length ? parts.join(' · ') : 'the contact details in our website footer';
  }

  /* ---------------- knowledge base ----------------
     k: match keywords (whole-word, padded) | a: english reply | n: nepali reply (optional, string or fn) */
  var KB = [
    { k: ['hello', 'hi', 'hey', 'namaste', 'namaskar', 'hallo', 'helo', 'नमस्ते', 'नमस्कार', 'good morning', 'good afternoon', 'good evening'],
      a: 'Hello! Welcome to Business Automation. I can help with our services, pricing, how it works, or connecting your Facebook Page. What would you like to know?',
      n: 'नमस्ते! Business Automation मा स्वागत छ। हाम्रा services, pricing, कसरी काम गर्छ, वा Facebook Page कसरी connect गर्ने — जे सोध्नुहोस्।',
      r: 'Namaste! Business Automation ma swagat cha. Hamra services, pricing, kasari kaam garcha, wa Facebook Page kasari connect garne — je sodhnus.' },
    { k: ['who are you', 'your name', 'tapai ko naam', 'timro naam', 'tapai ko name', 'what is your name'],
      a: 'I\u2019m the Business Automation assistant — here to answer questions about our Facebook automation services, anytime.',
      n: 'म Business Automation assistant हुँ — हाम्रा Facebook automation services बारे जे पनि सोध्न सक्नुहुन्छ।',
      r: 'Ma Business Automation assistant hun — hamra Facebook automation services bare je pani sodhna saknuhuncha.' },
    { k: ['comment automation', 'auto reply', 'auto-reply', 'comment reply', 'comment bot', 'कमेन्ट', 'comments', 'reply to comments', 'auto comment', 'comment section'],
      a: 'Our Comment Automation replies to every comment on your Facebook Page posts in about 30 seconds. Each Page gets its own custom message with the commenter\u2019s name, plus an on/off switch and daily safety limits. It\u2019s live right now — open the dashboard to connect a Page.',
      r: 'Hamro Comment Automation le tapai ko Facebook Page ko post haru ma aune harek comment ma lagbhag 30 second ma reply garcha. Harek Page ko afnai custom message huncha (comment garne ko naam sahit), on/off switch ra daily safety limit sahit. Ahile nai live cha \u2014 Page connect garna dashboard kholnuss.' },
    { k: ['video automation', 'video post automation', 'video post', 'videos'],
      a: 'Video Post Automation will schedule and auto-publish video posts to your Pages at the best time. It\u2019s under construction and coming soon — Comment Automation is already live.',
      r: 'Video Post Automation le tapai ka Page haru ma video post haru schedule garera best time ma auto-publish garnecha. Yo ahile ban dai cha, chaandai aaundaicha \u2014 Comment Automation chai ahile nai live cha.' },
    { k: ['post automation', 'schedule posts', 'auto post', 'auto-post'],
      a: 'Post Automation will let you plan weeks of text & image posts in one sitting and auto-publish them across all your Pages. It\u2019s under construction and coming soon.',
      r: 'Post Automation le haptaau ka text ra image post haru ekai choti plan garera sabai Page ma auto-publish garna milnecha. Yo ahile ban dai cha, chaandai aaundaicha.' },
    { k: ['our services', 'services', 'what services', 'your services', 'services offer', 'what do you do', 'what do you offer', 'sewa haru', 'ke ke service', 'सेवा', 'सेवाहरु', 'सेवाहरू', 'offerings', 'what can you do', 'company do', 'business do', 'products'],
      a: 'We offer 3 automation services:\n1. Facebook Comment Automation — live now, instant auto-replies to Page comments.\n2. Facebook Video Post Automation — coming soon.\n3. Facebook Post Automation — coming soon.\nWhich one interests you?',
      n: 'हाम्रा 3 वटा automation services छन्:\n1. Facebook Comment Automation — अहिले live छ, comment मा instant auto-reply।\n2. Video Post Automation — चाँडै आउँदैछ।\n3. Post Automation — चाँडै आउँदैछ।',
      r: 'Hamra 3 wata automation services chan:\n1. Facebook Comment Automation — ahile live cha, comment ma instant auto-reply.\n2. Video Post Automation — chaandai aaundaicha.\n3. Post Automation — chaandai aaundaicha.' },
    { k: ['how it works', 'how does it work', 'kasari kaam', 'kasto kaam', 'process', 'कसरी', 'how to start', 'get started', 'how start', 'how do i begin', 'setup', 'set up', 'how to use', 'procedure', 'steps'],
      a: 'It\u2019s simple:\n1. Log in to your dashboard and add your Facebook Page (ID + access token).\n2. Write your custom reply message — use {name} to personalize it.\n3. Turn the Page ON. Our bot then watches your posts and replies to every new comment in ~30 seconds, 24/7.',
      r: 'Ekdam sajilo:\n1. Dashboard ma login garera afno Facebook Page add garnus (ID + access token).\n2. Afno custom reply message lekhnus \u2014 naam ko lagi {name} use garnus.\n3. Page ON garnus. Hamro bot le tapai ka post herirahancha ra harek naya comment ma ~30 second ma, 24/7 reply garcha.' },
    { k: ['price', 'pricing', 'cost', 'charge', 'fee', 'paisa lagcha', 'kati paisa', 'rate', 'मूल्य', 'पैसा', 'how much', 'much cost', 'charges', 'subscription', 'plan', 'plans', 'expensive', 'cheap'],
      a: function () { return 'For current pricing and plans, please reach out to us directly — ' + contactLine() + '. We\u2019ll get back to you quickly.'; },
      n: function () { return 'Pricing र plans का लागि सिधै सम्पर्क गर्नुहोस् — ' + contactLine() + '। हामी छिट्टै reply गर्छौं।'; },
      r: function () { return 'Pricing ra plans ka lagi sidhai samparka garnus — ' + contactLine() + '. Hami chittai reply garchau.'; } },
    { k: ['connect', 'connect page', 'connect my page', 'connect a page', 'add page', 'link page', 'page kasari', 'token kasari', 'get token', 'page id', 'integrate', 'integration', 'setup page'],
      a: 'To connect a Page:\n1. Open your dashboard and click \u201cAdd Page\u201d.\n2. Enter your Facebook Page ID and a Page access token (we verify the token instantly).\n3. Write your reply message and switch the Page ON. That\u2019s it — replies start within ~30 seconds.',
      r: 'Page connect garna:\n1. Dashboard kholera \u201cAdd Page\u201d thichnus.\n2. Afno Facebook Page ID ra Page access token halnus (token turuntai verify huncha).\n3. Reply message lekhnus ra Page ON garnus. Basyo \u2014 ~30 second bhitra reply suru huncha.' },
    { k: ['dashboard', 'log in', 'login', 'sign in', 'password', 'username', 'account', 'log into', 'my account'],
      a: 'Click \u201cGet Started\u201d at the top of this site, then log in with your username or email and password. Inside you\u2019ll find Comment Automation, Settings, and your connected Pages.',
      n: 'Yo site ko mathi \u201cGet Started\u201d थिच्नुहोस्, अनि आफ्नो username वा email र password ले login गर्नुहोस्। भित्र Comment Automation, Settings, र connected Pages पाउनुहुन्छ।',
      r: 'Yo site ko mathi \u201cGet Started\u201d thichnus, ani afno username wa email ra password le login garnus. Bhitra Comment Automation, Settings, ra connected Pages paunuhuncha.' },
    { k: ['create account', 'create an account', 'open an account', 'open account', 'sign up', 'signup', 'register', 'new account', 'i want an account', 'account banaune', 'account kasari banaune', 'account kholne', 'खाता खोल्ने', 'account create garne'],
      a: function () { return signupReply('a'); },
      n: function () { return signupReply('n'); },
      r: function () { return signupReply('r'); } },
    { k: ['contact', 'phone number', 'email address', 'call you', 'samparka', 'number dinus', 'phone dinus', 'सम्पर्क', 'reach you', 'talk to you', 'speak to', 'get in touch'],
      a: function () { return 'You can reach us here: ' + contactLine() + '. We usually reply fast.'; },
      n: function () { return 'हामीलाई यहाँ सम्पर्क गर्नुहोस्: ' + contactLine() + '। हामी छिट्टै reply गर्छौं।'; },
      r: function () { return 'Hamilai yaha samparka garnus: ' + contactLine() + '. Hami chittai reply garchau.'; } },
    { k: ['human', 'real person', 'manche sanga', 'support team', 'help me', 'customer support', 'someone real', 'talk to someone', 'real human'],
      a: function () { return 'Of course — for anything I can\u2019t answer, our team is happy to help: ' + contactLine() + '.'; },
      r: function () { return 'Bilkul \u2014 maile answer garna nasakne kura ko lagi hamro team khushi sath sahayog garcha: ' + contactLine() + '.'; } },
    { k: ['free trial', 'trial', 'demo', 'test it', 'try it'],
      a: 'Want to see it in action? Open the dashboard and connect a Page — you\u2019ll see replies working on your own comments within a minute.',
      r: 'Chaliraheko herna chahanuhuncha? Dashboard kholera Page connect garnus \u2014 ek minute bhitra afnai comment ma reply kaam gareko dekhnuhuncha.' },
    { k: ['safe', 'secure', 'token safe', 'is it safe', 'trust', 'trustworthy', 'privacy', 'data safe', 'सुरक्षित'],
      a: 'Yes. Page tokens are verified before saving, masked in the dashboard, and never shown publicly. You can disconnect any Page anytime with one switch.',
      r: 'Cha. Page token save garnu aghi verify huncha, dashboard ma masked dekhincha, ra kahile public dekhaudaina. Junsukai Page lai pani euta switch le jati bela pani disconnect garna saknuhuncha.' },
    { k: ['how fast', 'how long', 'reply time', 'kati chado', 'speed', 'quick', 'quickly', 'reply speed'],
      a: 'New comments are detected and replied to in about 30 seconds, day and night — even while you sleep.',
      r: 'Naya comment aeko lagbhag 30 second ma detect garera reply huncha, din raat \u2014 tapai sutirahanda pani.' },
    { k: ['multiple pages', 'many pages', 'several pages', 'dherai page', 'more than one page'],
      a: 'Yes — connect unlimited Pages. Each Page has its own token, custom message, on/off switch, and daily reply limits.',
      r: 'Cha \u2014 jati pani Page connect garna saknuhuncha. Harek Page ko afnai token, custom message, on/off switch, ra daily reply limit huncha.' },
    { k: ['privacy policy', 'privacy'],
      a: 'You can read our Privacy Policy here: /privacy — it explains what data we collect and how we protect it.',
      r: 'Hamro Privacy Policy yaha padhna saknuhuncha: /privacy \u2014 k data collect garchau ra kasari protect garchau bhanne cha.' },
    { k: ['terms', 'conditions'],
      a: 'Our Terms & Conditions are here: /terms — worth a quick read before using the automation.',
      r: 'Hamra Terms & Conditions yaha chan: /terms \u2014 automation use garnu aghi ek choti padhnu hola.' },
    { k: ['open', 'working hours', 'office hours', 'kati baje', 'when are you open', 'timing'],
      a: 'The automation itself runs 24/7. For talking to our team, use the contact details in the footer — we reply as fast as we can.',
      r: 'Automation afai 24/7 chalcha. Hamro team sanga kura garna footer ko contact details use garnus \u2014 jati sakdo chado reply garchau.' },
    { k: ['thank', 'dhanyabad', 'shukriya', 'धन्यवाद'],
      a: 'You\u2019re welcome! Anything else I can help with?',
      n: 'मेरो खुशी! अरू केही सहयोग चाहिएको छ?',
      r: 'Mero khushi! Aru kehi sahayog chahieko cha?' },
    { k: ['bye', 'goodbye', 'see you', 'good night'],
      a: 'Goodbye! We\u2019re here whenever you need automation help.',
      n: 'नमस्ते, फेरि भेटौंला! Automation सहयोग चाहिएमा हामी यहीं छौं।',
      r: 'Namaste, feri bhetdaula! Automation sahayog chahiema hami yahin chau.' },
    { k: ['what is business automation', 'about business automation', 'about you', 'ke ho business', 'company', 'about the company', 'who runs this'],
      a: 'Business Automation helps businesses run their Facebook presence on autopilot — starting with instant auto-replies to Page comments, and soon scheduled video & post publishing. Less manual work, faster customer response.',
      r: 'Business Automation le business haru ko Facebook presence autopilot ma chalauna sahayog garcha \u2014 suru ma Page comment ma instant auto-reply, ra chaandai scheduled video ra post publishing. Kam manual kaam, chado customer response.' },
  ];

  var FALLBACK = {
    a: 'I\u2019m not sure about that yet — I answer questions about our services, pricing, how it works, and support. Try one of the topics below, or contact our team: ',
    n: 'माफ गर्नुहोस्, यो बुझिनँ — म हाम्रा services, pricing, कसरी काम गर्छ, र support बारे answer दिन्छु। तलको topic थिच्नुहोस् वा हाम्रो team लाई सम्पर्क गर्नुहोस्: ',
    r: 'Maaf garnus, yo bujhina — ma hamra services, pricing, kasari kaam garcha, ra support bare answer dinchu. Talko topic thichnus wa hamro team lai samparka garnus: '
  };

  /* language detect: 'ne' = Devanagari Nepali, 'ro' = Romanized Nepali, 'en' = English/other */
  var RO_MARKERS = ('cha,chha,chhan,xa,xaina,xain,ho,haina,hunxa,huncha,kasari,kasto,kati,ke,ko,ki,ka,kina,' +
    'pani,hola,diyoss,dinus,dinuhos,garnus,garerw,huna,sodhnu,sodh,tapai,tapain,timi,malai,chahiyo,chahieko,' +
    'milcha,garcha,garne,aaundaicha,bhetdaula,sahayog,prashna,ramro,kura,thaha,bhanne,sanga,lagi,bare,je,namaste,namaskar,dhanyabad,dhanyabaad,hajur,tapailai').split(',');
  function detectLang(t) {
    if (/[\u0900-\u097F]/.test(t)) return 'ne';
    var ws = cleanText(t).split(' ');
    for (var i = 0; i < ws.length; i++) if (RO_MARKERS.indexOf(ws[i]) !== -1) return 'ro';
    return 'en';
  }
  function isNepali(t) { return detectLang(t) === 'ne'; }

  /* ---- smart matching: phrase hits score high, word overlap catches natural phrasing ---- */
  var STOPWORDS = ('what,how,do,does,did,you,your,yours,i,me,my,we,our,the,a,an,is,are,was,were,be,been,' +
    'to,for,of,and,or,in,on,at,it,its,this,that,these,those,there,here,can,could,will,would,should,' +
    'please,tell,about,give,want,wants,need,know,knows,with,from,by,as,have,has,had,not,no,yes,' +
    'ke,ko,ki,ka,kina,kasto,kasari,kati,cha,chha,xa,xaina,ho,huna,hunxa,pani,jasto,hola,diyoss,dinus,' +
    'dinuhos,garnus,garerw,type,normally,matra,tw,question,sodhyo,sodhnu').split(',').reduce(function (o, w) { o[w] = 1; return o; }, {});

  var DOMAIN = ('facebook,page,pages,automation,automate,automated,business,bot,comment,comments,post,posts,' +
    'video,videos,reply,replies,service,services,company,dashboard,token,message,messages,customer,' +
    'customers,marketing,social,media,schedule,scheduling,publish,publishing,account,accounts,\u0915\u092e\u0947\u0928\u094d\u091f,\u0938\u0947\u0935\u093e').split(',');

  function cleanText(text) { return ' ' + text.toLowerCase().replace(/[?!.,;:()"'\-\u2013\u2014]/g, ' ').replace(/\s+/g, ' ') + ' '; }

  function contentWords(text) {
    return cleanText(text).split(' ').filter(function (w) { return w && !STOPWORDS[w]; });
  }

  function intentWords(intent) {
    var set = {};
    intent.k.forEach(function (kw) {
      kw.toLowerCase().split(/\s+/).forEach(function (w) { if (w && !STOPWORDS[w]) set[w] = 1; });
    });
    return set;
  }

  function matchIntent(text) {
    var t = cleanText(text);
    var ws = contentWords(text);
    var best = null, bestScore = 0;
    for (var i = 0; i < KB.length; i++) {
      var it = KB[i], score = 0;
      for (var j = 0; j < it.k.length; j++) {
        var kw = it.k[j].toLowerCase();
        if (t.indexOf(' ' + kw + ' ') !== -1) score += 12 + kw.length;   /* exact phrase: strong */
      }
      var iw = intentWords(it);
      for (var w = 0; w < ws.length; w++) if (iw[ws[w]]) score += 4;      /* word overlap: natural phrasing */
      if (score > bestScore) { bestScore = score; best = it; }
    }
    return bestScore >= 4 ? best : null;
  }

  function hasDomainWord(text) {
    var t = cleanText(text);
    for (var i = 0; i < DOMAIN.length; i++) {
      if (t.indexOf(' ' + DOMAIN[i] + ' ') !== -1) return true;
    }
    return false;
  }

  function guidedReply(text) {
    var lang = detectLang(text);
    if (lang === 'ne')
      return '\u0930\u093e\u092e\u094d\u0930\u094b \u092a\u094d\u0930\u0936\u094d\u0928! \u092f\u094b \u0939\u093e\u092e\u094d\u0930\u094b \u0915\u093e\u092e\u0938\u0901\u0917 \u0938\u092e\u094d\u092c\u0928\u094d\u0927\u093f\u0924 \u091b \u2014 \u0924\u092a\u093e\u0907\u0902 services, pricing, \u0935\u093e \u0915\u0938\u0930\u0940 \u0938\u0941\u0930\u0941 \u0917\u0930\u094d\u0928\u0947 \u092d\u0928\u094d\u0928\u0947 \u092c\u093e\u0930\u0947 \u0938\u094b\u0927\u094d\u0926\u0948 \u0939\u0941\u0928\u0941\u0939\u0941\u0928\u094d\u091b? \u0924\u0932\u0915\u094b option \u0925\u093f\u091a\u094d\u0928\u0941\u0939\u094b\u0938\u094d \u0935\u093e \u0906\u092b\u094d\u0928\u0948 \u0936\u092c\u094d\u0926\u092e\u093e \u092b\u0947\u0930\u093f \u0938\u094b\u0927\u094d\u0928\u0941\u0939\u094b\u0938\u094d\u0964';
    if (lang === 'ro')
      return 'Ramro prashna! Yo hamro kaam sanga sambandhit cha \u2014 tapai services, pricing, wa kasari suru garne bhanne bare sodhdai hunuhuncha? Talko option thichnus wa afnai shabdama feri sodhnus.';
    return 'Good question \u2014 that\u2019s related to what we do! Are you asking about our services, pricing, or how to get started? Tap an option below or ask again in your own words.';
  }

  function replyFor(intent, text) {
    var lang = detectLang(text);
    var r = intent.a;
    if (lang === 'ne' && intent.n) r = intent.n;
    else if (lang === 'ro' && intent.r) r = intent.r;
    return typeof r === 'function' ? r() : r;
  }

  /* ---------------- widget ---------------- */
  var fab, win, body, chips, input, sendBtn, opened = false, greeted = false;

  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstChild;
  }

  function scrollDown() { body.scrollTop = body.scrollHeight; }

  function addMsg(who, text) {
    var m = el('<div class="msg ' + who + '">' +
      (who === 'bot' ? '<span class="m-av"><img src="img/logo.svg" alt=""></span>' : '') +
      '<div class="bubble"></div></div>');
    m.querySelector('.bubble').textContent = text;
    body.appendChild(m);
    scrollDown();
    return m;
  }

  /* botSay(text) shows the reply after a typing pause; botSay() with no text
     shows typing now and returns a setter for async replies */
  function botSay(text) {
    var t = el('<div class="msg bot"><span class="m-av"><img src="img/logo.svg" alt=""></span><div class="bubble typing"><i></i><i></i><i></i></div></div>');
    body.appendChild(t);
    scrollDown();
    function reveal(reply) {
      var b = t.querySelector('.bubble');
      if (b) { b.classList.remove('typing'); b.textContent = reply; }
      scrollDown();
    }
    if (text === undefined) return reveal;
    setTimeout(function () { reveal(text); }, 700 + Math.random() * 500);
  }

  /* local (offline) reply — sync, used as fallback and by the debug hook */
  function answerLocal(text) {
    var intent = matchIntent(text);
    if (intent) return replyFor(intent, text);
    if (hasDomainWord(text)) return guidedReply(text);
    var lang = detectLang(text);
    return (lang === 'ne' ? FALLBACK.n : lang === 'ro' ? FALLBACK.r : FALLBACK.a) + contactLine() + '.';
  }

  /* AI-first reply: Gemini via server proxy, local fallback on any failure */
  function answer(text) {
    var reveal = botSay(); /* typing indicator shows immediately */
    var done = false;
    function finish(reply) { if (!done) { done = true; reveal(reply); } }
    try {
      var ctrl = new AbortController();
      var to = setTimeout(function () { try { ctrl.abort(); } catch (e) {} }, 12000);
      fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
        signal: ctrl.signal
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) {
        clearTimeout(to);
        finish(d && d.reply ? d.reply : answerLocal(text));
      }).catch(function () { clearTimeout(to); finish(answerLocal(text)); });
    } catch (e) { finish(answerLocal(text)); }
    /* hard safety net: never leave the typing indicator hanging */
    setTimeout(function () { finish(answerLocal(text)); }, 15000);
  }

  var QUICK = ['Our services', 'How it works', 'Pricing', 'Contact us'];
  function renderChips() {
    chips.innerHTML = '';
    QUICK.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = q;
      b.onclick = function () { userSay(q); };
      chips.appendChild(b);
    });
  }

  function userSay(text) {
    text = (text || '').trim();
    if (!text) return;
    addMsg('user', text);
    input.value = '';
    answer(text);
  }

  function toggle(open) {
    opened = typeof open === 'boolean' ? open : !opened;
    win.classList.toggle('open', opened);
    var dot = document.getElementById('chatDot');
    if (dot) dot.style.display = 'none';
    if (opened && !greeted) {
      greeted = true;
      renderChips();
      setTimeout(function () {
        botSay('Hi! I\u2019m the Business Automation assistant. Ask me about our services, pricing, or how the automation works.');
      }, 400);
    }
    if (opened) setTimeout(function () { input.focus(); }, 350);
  }

  function init() {
    if ($('#chatFab')) return;
    var tmp = document.createElement('div');
    tmp.innerHTML =
      '<button class="chat-fab" id="chatFab" aria-label="Chat with Business Automation">' +
      '<span class="ping"></span><svg class="ic"><use href="img/icons.svg#chat"/></svg>' +
      '<span class="chat-dot" id="chatDot" style="display:none"></span></button>' +
      '<div class="chat-win" id="chatWin" role="dialog" aria-label="Business Automation chat">' +
      '<div class="chat-head"><img src="img/logo.svg" alt=""><div class="ch-t"><b>Business Automation</b>' +
      '<span><i class="on"></i>Online · replies instantly</span></div>' +
      '<button id="chatClose" aria-label="Close chat"><svg class="ic"><use href="img/icons.svg#x"/></svg></button></div>' +
      '<div class="chat-body" id="chatBody"></div>' +
      '<div class="chips" id="chatChips"></div>' +
      '<div class="chat-input"><input id="chatText" placeholder="Type your question…" autocomplete="off" aria-label="Type your question">' +
      '<button id="chatSend" aria-label="Send"><svg class="ic"><use href="img/icons.svg#send"/></svg></button></div></div>';
    while (tmp.firstChild) document.body.appendChild(tmp.firstChild);
    fab = $('#chatFab'); win = $('#chatWin'); body = $('#chatBody');
    chips = $('#chatChips'); input = $('#chatText'); sendBtn = $('#chatSend');
    fab.addEventListener('click', function () { toggle(); });
    $('#chatClose').addEventListener('click', function () { toggle(false); });
    sendBtn.addEventListener('click', function () { userSay(input.value); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') userSay(input.value); });
    setTimeout(function () {
      if (!opened) { var d = $('#chatDot'); if (d) d.style.display = 'block'; }
    }, 6000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  /* debug hook: window.BAChat.answer("...") previews the bot reply */
  try { window.BAChat = { answer: function (t) { return answerLocal(t); }, ask: function (t) { answer(t); } }; } catch (e) {}
})();
