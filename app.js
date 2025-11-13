(function () {
  'use strict';

  function el(id){ return document.getElementById(id); }
  function setText(id, txt){ var n=el(id); if(n) n.textContent = txt; else console.warn('Missing element:', id); }
  function show(id, v){ var n=el(id); if(n) n.style.display = v ? '' : 'none'; }
  function clear(node){ if(!node) return; while(node.firstChild) node.removeChild(node.firstChild); }

  function renderList(listId, items, emptyText){
    var ul = el(listId);
    if(!ul){
      console.warn('List element missing:', listId);
      return;
    }
    clear(ul);
    if(!Array.isArray(items) || items.length === 0){
      var li = document.createElement('li');
      li.className = 'empty';
      li.textContent = emptyText || 'هیچ موردی ثبت نشده';
      ul.appendChild(li);
      return;
    }
    var frag = document.createDocumentFragment();
    for(var i=0;i<items.length;i++){
      var li = document.createElement('li');
      li.textContent = String(items[i]);
      frag.appendChild(li);
    }
    ul.appendChild(frag);
  }

  function normalize(s){ return s === null || s === undefined ? '' : String(s).trim(); }

  function idMatches(candidate, query){
    if(!candidate || !query) return false;
    var c = normalize(candidate).toLowerCase(), q = normalize(query).toLowerCase();
    if(c === q) return true;
    if(c === ('m' + q)) return true;
    if(('m' + c) === q) return true;
    return false;
  }

  function debug(msg){
    var d = el('debugInfo');
    if(d){ d.textContent = msg; d.style.display = ''; }
    console.info(msg);
  }

  // verify DOM
  ['loading','error','card','name','full_name','student_id','id','role','committees_list','activities_list','certificates_list','debugInfo'].forEach(function(k){
    if(!el(k)) console.warn('Expected element not found in DOM:', k);
  });

  show('loading', true); show('card', false); show('error', false);
  debug('آماده‌سازی...');

  var params = new URLSearchParams(window.location.search);
  var qid = params.get('id');
  if(!qid){
    show('loading', false);
    show('error', true);
    setText('error','شناسه در URL موجود نیست. مثال: ?id=m001 یا ?id=403270991');
    debug('no-id');
    return;
  }
  qid = normalize(qid);
  debug('شناسه پرس‌وجو: ' + qid);

  fetch('./members.json', { cache: 'no-store' })
    .then(function(resp){
      if(!resp.ok) throw new Error('members.json HTTP ' + resp.status);
      var ct = resp.headers.get('content-type') || '';
      console.info('members.json content-type:', ct);
      return resp.json();
    })
    .then(function(data){
      if(!Array.isArray(data)) throw new Error('members.json باید آرایه باشد');
      debug('اعضا بارگذاری شدند: ' + data.length);

      var mapId = Object.create(null), mapStudent = Object.create(null);
      for(var i=0;i<data.length;i++){
        var it = data[i];
        if(!it) continue;
        if(it.id) mapId[normalize(it.id).toLowerCase()] = it;
        if(it.student_id) mapStudent[normalize(it.student_id).toLowerCase()] = it;
      }

      var key = qid.toLowerCase();
      var found = mapId[key] || mapStudent[key];

      if(!found){
        for(var j=0;j<data.length;j++){
          var cand = data[j];
          if(!cand) continue;
          if(idMatches(cand.id, qid) || idMatches(cand.student_id, qid)){ found = cand; break; }
        }
      }

      show('loading', false);

      if(found){
        debug('عضو یافت شد: ' + (found.full_name || found.student_id || found.id));
        setText('name', found.full_name || '');
        setText('full_name', found.full_name || '');
        setText('student_id', found.student_id || '');
        setText('id', found.id || '');
        setText('role', found.role || '');

        renderList('committees_list', found.committees, 'عضویتی ثبت نشده');
        renderList('activities_list', found.activities, 'هیچ فعالیتی ثبت نشده');
        renderList('certificates_list', found.certificates, 'مدرکی ثبت نشده');

        show('card', true);
        debug('اطلاعات عضو نمایش داده شد');
      } else {
        console.warn('No matching member for id:', qid);
        show('error', true);
        setText('error','عضویی با این شناسه یافت نشد: ' + qid);
        debug('no-member');
      }
    })
    .catch(function(err){
      console.error('Failed to load members.json:', err && err.message ? err.message : err);
      show('loading', false);
      show('error', true);
      setText('error','بارگذاری اطلاعات با خطا مواجه شد.');
      debug('fetch-error: ' + (err && err.message ? err.message : err));
    });
})();
