// js/IponeMode.js

let initial_arr = [];
let parsed_arr  = [];

const devToggle      = document.getElementById('dev-toggle');
const iphoneMode     = document.getElementById('iphone-mode');
const inputEl        = document.getElementById('csv-file');
const btnShow        = document.getElementById('show-data');
const initialEl      = document.getElementById('initial-display');
const parsedEl       = document.getElementById('parsed-display');
const groupContainer = document.getElementById('group-container');

const sticky = document.createElement('div');
sticky.id = 'sticky-wordlist';
sticky.style.display = 'none';
document.body.appendChild(sticky);

// 개발자 모드 토글
devToggle.addEventListener('click', () => {
  document.getElementById('dev-panel').classList.toggle('hidden');
  devToggle.textContent = devToggle.textContent === '개발자 모드'
    ? '일반 모드'
    : '개발자 모드';
});

// 테블릿 모드 버튼
iphoneMode.addEventListener('click', () => {
  window.location.href = 'OnlyForRandom.html';
});

// CSV → raw 2D 배열
function parseCSV(text) {
  return text.trim().split(/\r?\n/).slice(1).map(line => {
    const items = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
    const cleaned = items.map(c =>
      c.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim()
    );
    while (cleaned.length < 12) cleaned.push('');
    return cleaned;
  });
}

// rawRows → initial_arr
function restructureInitial(rawRows) {
  return rawRows.map(r => [r[0]||'', r[1]||'', r.slice(2).filter(c=>c)]);
}

// initial_arr → parsed_arr
function groupByWordStructured(arr) {
  const map = new Map();
  arr.forEach(([w,m,s]) => {
    if (!map.has(w)) map.set(w, { meanings:[m], syns:[...s] });
    else {
      const e = map.get(w);
      e.meanings.push(m);
      e.syns.push(...s);
    }
  });
  return Array.from(map.entries()).map(([w,{meanings,syns}])=>[
    w,
    Array.from(new Set(meanings)).filter(x=>x).join(', '),
    Array.from(new Set(syns))
  ]);
}

// 배열 셔플
function shuffle(a) {
  const arr = a.slice();
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]] = [arr[j],arr[i]];
  }
  return arr;
}

// CSV 파일 로드 시 initial_arr, parsed_arr 설정
inputEl.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const raw = parseCSV(reader.result);
    initial_arr = restructureInitial(raw);
    parsed_arr  = groupByWordStructured(initial_arr);
  };
  reader.readAsText(file, 'UTF-8');
});

// 데이터 표시 버튼 클릭
btnShow.addEventListener('click', () => {
  if (!parsed_arr.length) {
    alert('먼저 CSV 파일을 업로드하세요.');
    return;
  }

  const per = 5;
  const total = parsed_arr.length;
  const groupCount = Math.ceil(total / per);
  groupContainer.innerHTML = '';
  const circled = ['①','②','③','④','⑤'];

  for (let gi = 0; gi < groupCount; gi++) {
    const start = gi * per;
    const slice = parsed_arr.slice(start, Math.min(start + per, total));
    const sec = document.createElement('section');
    sec.dataset.groupIndex = gi;

    sec.innerHTML = `
      <div class="group-header">
        <h3>그룹 ${gi+1}</h3>
        <button class="wordlist-btn">그룹${gi+1} 표제어</button>
        <button class="answer-btn">정답</button>
      </div>
      <div class="columns-header">
        <span></span><span></span><span></span>
      </div>
    `;

    const pairs = [];
    slice.forEach(([word, , syns], wi) => {
      syns.forEach(syn => pairs.push({ word, syn, wi }));
    });

    const shuffledPairs = shuffle(pairs);  // 명확히 섞은 결과를 저장!

    const ul = document.createElement('ul');
    ul.className = 'columns-list';
    shuffledPairs.forEach(({ word, syn, wi }, idx) => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${idx+1}. ${syn}</span>
        <span><input type="text" placeholder="정답 입력"></span>
        <span class="answer">${circled[wi]} ${word}</span>
      `;
      ul.appendChild(li);
    });
    sec.appendChild(ul);

    sec.querySelector('.answer-btn')
       .addEventListener('click', () => sec.classList.toggle('show-answers'));

    sec.querySelector('.wordlist-btn').addEventListener('click', () => {
      sticky.innerHTML = '';
      slice.forEach(([word], idx) => {
        const sp = document.createElement('span');
        sp.textContent = `${circled[idx]} ${word}`;
        sticky.appendChild(sp);
      });
      sticky.style.display = sticky.style.display === 'none' ? 'block' : 'none';
    });

    groupContainer.appendChild(sec);
  }
});