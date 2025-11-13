(function () {
  'use strict';

  function el(id){ return document.getElementById(id); }

  function safeText(id, txt){
    var n = el(id);
    if (n) n.textContent = txt;
    else console.warn('Missing element:', id, 'text:', txt);
  }

  function getQ(idName){
    var p = new URLSearchParams(window.location.search);
    var v = p.get(idName);
    return v === null ? null : String(v).trim();
  }

  function show(id, on){
    var n = el(id);
    if (!n) return;
    n.style.display = on ? '' : 'none';
  }

  function clearChildren(node){
    if (!node) return;
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function renderList(nodeId, arr, emptyText){
    var node = el(nodeId);
    if (!node) { console.warn('renderList: missing', nodeId); return; }
    clearChildren(node);
    if (!Array.isArray(arr) || arr.length === 0){
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      node.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < arr.length; i++){
      var li = document.createElement('li');
      li.textContent = String(arr[i]);
      frag.appendChild(li);
    }
    node.appendChild(frag);
  }

  function renderMember(m){
    safeText('name', m.full_name || '');
    safeText('studentId', m.student_id || '');
    safeText('id', m.id || '');
    safeText('role', m.role || '');
    renderList('committees', m.committees, 'عضویتی ثبت نشده');
    renderList('activities', m.activities, 'هیچ فعالیتی ثبت نشده');
    renderList('certificates', m.certificates, 'مدرکی ثبت نشده');
  }

  function normalize(s){ return s === null || s === undefined ? '' : String(s).trim(); }

  function matches(candidate, query){
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase();
    var q = normalize(query).toLowerCase();
    if (c === q) return true;
    if (c === ('m' + q)) return true;
    if (('m' + c) === q) return true;
    return false;
  }

  // ensure required UI parts exist (log missing)
  ['loading','error','card','name','studentId','id','role','committees','activities','certificates'].forEach(function(k){
    if (!el(k)) console.warn('Expected element not found in DOM:', k);
  });

  // initial UI state
  show('loading', true);
  show('card', false);
  show('error', false);

  var qid = getQ('id');
  if (!qid){
    show('loading', false);
    show('error', true);
    safeText('error', 'شناسه در URL موجود نیست. نمونه: ?id=m001 یا ?id=403270991');
    return;
  }

  fetch('./members.json', { cache: 'no-store' })
    .then(function(resp){
      if (!resp.ok) throw new Error('Network response not ok: ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) console.warn('members.json content-type:', ct);
      return resp.json();
    })
    .then(function(data){
      if (!Array.isArray(data)) throw new Error('members.json باید آرایه باشد');
      // build quick lookup maps
      var byId = Object.create(null);
      var byStudent = Object.create(null);
      for (var i = 0; i < data.length; i++){
        var it = data[i];
        if (!it) continue;
        if (it.id) byId[normalize(it.id).toLowerCase()] = it;
        if (it.student_id) byStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var key = normalize(qid).toLowerCase();
      var found = byId[key] || byStudent[key];

      if (!found){
        for (var j = 0; j < data.length; j++){
          var cand = data[j];
          if (!cand) continue;
          if (matches(cand.id, qid) || matches(cand.student_id, qid)){
            found = cand;
            break;
          }
        }
      }

      show('loading', false);
      if (found){
        renderMember(found);
        show('card', true);
      } else {
        show('error', true);
        safeText('error', 'عضویی با این شناسه یافت نشد: ' + qid);
      }
    })
    .catch(function(err){
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      safeText('error', 'بارگذاری اطلاعات با خطا مواجه شد.');
    });
})();
