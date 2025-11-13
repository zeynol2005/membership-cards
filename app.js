(function () {
  'use strict';

  function el(id){ return document.getElementById(id); }

  function getQueryId(){
    var p = new URLSearchParams(window.location.search);
    var v = p.get('id');
    return v === null ? null : String(v).trim();
  }

  function show(id, visible){
    var n = el(id);
    if (!n) return;
    n.style.display = visible ? '' : 'none';
  }

  function clearChildren(node){
    while(node.firstChild) node.removeChild(node.firstChild);
  }

  function renderList(node, items, emptyText){
    clearChildren(node);
    if (!Array.isArray(items) || items.length === 0){
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      node.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    for (var i = 0; i < items.length; i++){
      var li = document.createElement('li');
      li.textContent = String(items[i]);
      frag.appendChild(li);
    }
    node.appendChild(frag);
  }

  function renderMember(m){
    el('name').textContent = m.full_name || '';
    el('studentId').textContent = m.student_id || '';
    el('id').textContent = m.id || '';
    el('role').textContent = m.role || '';

    renderList(el('committees'), m.committees, 'عضویتی ثبت نشده');
    renderList(el('activities'), m.activities, 'هیچ فعالیتی ثبت نشده');
    renderList(el('certificates'), m.certificates, 'مدرکی ثبت نشده');
  }

  function normalize(s){ return s === null || s === undefined ? '' : String(s).trim(); }

  function idMatches(candidate, query){
    if (!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase();
    var q = normalize(query).toLowerCase();
    if (c === q) return true;
    if (c === ('m' + q)) return true;
    if (('m' + c) === q) return true;
    return false;
  }

  // init
  show('loading', true);
  show('card', false);
  show('error', false);

  var memberId = getQueryId();
  if (!memberId){
    show('loading', false);
    show('error', true);
    el('error').textContent = 'شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991';
    return;
  }

  fetch('./members.json', { cache: 'no-store' })
    .then(function(resp){
      if (!resp.ok) throw new Error('Network response was not ok: ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('application/json') === -1) console.warn('Expected JSON, got:', ct);
      return resp.json();
    })
    .then(function(data){
      if (!Array.isArray(data)) throw new Error('members.json باید یک آرایه باشد');
      // ساخت نقشه سریع برای id و student_id برای جستجوی سریع‌تر
      var mapId = Object.create(null);
      var mapStudent = Object.create(null);
      for (var i = 0; i < data.length; i++){
        var it = data[i];
        if (!it) continue;
        if (it.id) mapId[normalize(it.id).toLowerCase()] = it;
        if (it.student_id) mapStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var q = normalize(memberId).toLowerCase();
      var found = mapId[q] || mapStudent[q];

      if (!found){
        for (var j = 0; j < data.length; j++){
          var cand = data[j];
          if (!cand) continue;
          if (idMatches(cand.student_id, memberId) || idMatches(cand.id, memberId)){
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
        el('error').textContent = 'عضویی با این شناسه یافت نشد: ' + memberId;
      }
    })
    .catch(function(err){
      console.error('خطا در بارگذاری members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      el('error').textContent = 'بارگذاری داده‌ها با خطا مواجه شد.';
    });
})();
