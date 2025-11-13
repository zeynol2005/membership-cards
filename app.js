(function () {
  'use strict';

  function el(id){ return document.getElementById(id); }
  function safeText(id, txt){ var n = el(id); if (n) n.textContent = txt; else console.warn('Missing element:', id); }
  function show(id, on){ var n = el(id); if (n) n.style.display = on ? '' : 'none'; }
  function clearChildren(node){ if (!node) return; while (node.firstChild) node.removeChild(node.firstChild); }
  function renderList(nodeId, arr, emptyText){
    var node = el(nodeId);
    if (!node){ console.warn('renderList: missing', nodeId); return; }
    clearChildren(node);
    if (!Array.isArray(arr) || arr.length === 0){ var li = document.createElement('li'); li.className='empty'; li.textContent=emptyText||'هیچ موردی ثبت نشده'; node.appendChild(li); return; }
    var frag = document.createDocumentFragment();
    for (var i=0;i<arr.length;i++){ var li=document.createElement('li'); li.textContent=String(arr[i]); frag.appendChild(li); }
    node.appendChild(frag);
  }

  function normalize(s){ return s===null||s===undefined ? '' : String(s).trim(); }
  function idMatches(candidate, query){
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase(), q = normalize(query).toLowerCase();
    if (c===q) return true;
    if (c===('m'+q)) return true;
    if (('m'+c)===q) return true;
    return false;
  }

  // required element check
  var required = ['loading','error','card','name','studentId','id','role','committees','activities','certificates','debugInfo'];
  required.forEach(function(k){ if (!el(k)) console.warn('Expected element not found in DOM:', k); });

  show('loading', true); show('card', false); show('error', false);
  safeText('debugInfo', 'در حال آماده‌سازی...'); show('debugInfo', true);

  var params = new URLSearchParams(window.location.search);
  var qid = params.get('id');
  if (!qid){ show('loading', false); show('error', true); safeText('error','شناسه در URL موجود نیست. مثال: ?id=m001'); safeText('debugInfo','no-id'); return; }
  qid = normalize(qid);
  console.info('Query id:', qid);
  safeText('debugInfo', 'شناسه پرس‌وجو: ' + qid);

  fetch('./members.json', { cache: 'no-store' })
    .then(function(resp){
      if (!resp.ok) throw new Error('members.json HTTP ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      console.info('members.json content-type:', ct);
      return resp.json();
    })
    .then(function(data){
      if (!Array.isArray(data)) throw new Error('members.json root is not an array');
      console.info('members loaded:', data.length, 'items');
      safeText('debugInfo', 'اعضا بارگذاری شدند: ' + data.length);
      // build fast maps
      var byId = Object.create(null), byStudent = Object.create(null);
      for (var i=0;i<data.length;i++){ var it = data[i]; if (!it) continue; if (it.id) byId[normalize(it.id).toLowerCase()] = it; if (it.student_id) byStudent[normalize(it.student_id).toLowerCase()] = it; }
      var key = qid.toLowerCase();
      var found = byId[key] || byStudent[key];
      if (!found){
        for (var j=0;j<data.length;j++){
          var cand = data[j];
          if (!cand) continue;
          if (idMatches(cand.id, qid) || idMatches(cand.student_id, qid)){ found = cand; break; }
        }
      }
      show('loading', false);
      if (found){
        console.info('Member found:', found);
        safeText('debugInfo', 'عضو یافت شد: ' + (found.full_name || found.student_id || found.id));
        safeText('name', found.full_name || '');
        safeText('studentId', found.student_id || '');
        safeText('id', found.id || '');
        safeText('role', found.role || '');
        renderList('committees', found.committees, 'عضویتی ثبت نشده');
        renderList('activities', found.activities, 'هیچ فعالیتی ثبت نشده');
        renderList('certificates', found.certificates, 'مدرکی ثبت نشده');
        show('card', true);
        show('debugInfo', false);
      } else {
        console.warn('No matching member for id:', qid);
        show('error', true);
        safeText('error', 'عضویی با این شناسه یافت نشد: ' + qid);
        safeText('debugInfo', 'no-member');
      }
    })
    .catch(function(err){
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      safeText('error','بارگذاری اطلاعات با خطا مواجه شد.');
      safeText('debugInfo','fetch-error: ' + (err && err.message ? err.message : err));
    });
})();
