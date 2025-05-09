// js/onlyForRandom.js

// 1) 전역 변수 & DOM 요소 캐싱
let initial_arr = [];
let parsed_arr  = [];

const devToggle      = document.getElementById('dev-toggle');
const iphoneMode  = document.getElementById('iphone-mode');
const devPanel       = document.getElementById('dev-panel');
const inputEl        = document.getElementById('csv-file');
const btnShow        = document.getElementById('show-data');
const initialEl      = document.getElementById('initial-display');
const parsedEl       = document.getElementById('parsed-display');
const groupContainer = document.getElementById('group-container');

// 개발자 모드 토글
devToggle.addEventListener('click', () => {
  devPanel.classList.toggle('hidden');
  devToggle.textContent = devPanel.classList.contains('hidden')
    ? '개발자 모드'
    : '일반 모드';
});

// 아이폰 모드 버튼 클릭 시 페이지 이동
iphoneMode.addEventListener('click', () => {
  window.location.href = 'IponeMode.html';
});

// 2) CSV → raw 2D 배열
function parseCSV(text) {
  return text
    .trim()
    .split(/\r?\n/)
    .map(line => {
      const items = line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/);
      const cleaned = items.map(c =>
        c.replace(/^"(.*)"$/, '$1').replace(/""/g, '"').trim()
      );
      while (cleaned.length < 12) cleaned.push('');
      return cleaned;
    })
    .slice(1);
}

// 3) rawRows → initial_arr
function restructureInitial(rawRows) {
  return rawRows.map(r => [r[0] || '', r[1] || '', r.slice(2).filter(c => c)]);
}

// 4) initial_arr → parsed_arr
function groupByWordStructured(arr) {
  const m = new Map();
  arr.forEach(([word, meaning, syns]) => {
    if (!m.has(word)) {
      m.set(word, { meanings: [meaning], syns: syns.slice() });
    } else {
      const entry = m.get(word);
      entry.meanings.push(meaning);
      entry.syns.push(...syns);
    }
  });
  return Array.from(m.entries()).map(([word, { meanings, syns }]) => {
    const uniqMean = Array.from(new Set(meanings)).filter(x => x);
    const uniqSyns = Array.from(new Set(syns));
    return [word, uniqMean.join(', '), uniqSyns];
  });
}

// 5) 배열 셔플 함수
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 6) CSV 파일 로드
inputEl.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    initial_arr = restructureInitial(parseCSV(reader.result));
    parsed_arr  = groupByWordStructured(initial_arr);
  };
  reader.readAsText(file, 'UTF-8');
});

// 7) 버튼 클릭 시 그룹 렌더링 (정답 버튼 포함)
btnShow.addEventListener('click', () => {
  if (!parsed_arr.length) {
    alert('먼저 CSV 파일을 업로드하세요.');
    return;
  }

  // 개발자 패널 갱신
  initialEl.textContent = JSON.stringify(initial_arr, null, 2);
  parsedEl .textContent = JSON.stringify(parsed_arr,  null, 2);

  // 그룹 설정: 5단어씩
  const perGroup = 5;
  const total    = parsed_arr.length;
  const groupCount = Math.ceil(total / perGroup);
  groupContainer.innerHTML = '';

  // 원형 숫자 기호 배열
  const circled = ['①','②','③','④','⑤'];

  for (let i = 0; i < groupCount; i++) {
    const start = i * perGroup;
    const end   = Math.min(start + perGroup, total);
    const slice = parsed_arr.slice(start, end);

    const section = document.createElement('section');

    // 그룹 헤더 (제목 + 범위 + 정답 버튼)
    const headerDiv = document.createElement('div');
    headerDiv.className = 'group-header';
    const h3 = document.createElement('h3');
    h3.textContent = `그룹 ${i + 1} (${start + 1}~${end})`;
    headerDiv.appendChild(h3);

    const answerBtn = document.createElement('button');
    answerBtn.textContent = '정답';
    answerBtn.className = 'answer-btn';
    headerDiv.appendChild(answerBtn);

    section.appendChild(headerDiv);

    // 표제어 번호 리스트
    const wordList = document.createElement('div');
    wordList.className = 'word-list';
    slice.forEach((item, idx) => {
      const span = document.createElement('span');
      span.textContent = `${circled[idx] || idx + 1} ${item[0]}`;
      wordList.appendChild(span);
    });
    section.appendChild(wordList);

    // 정답 버튼 클릭 시 표제어 열 보이기/숨기기
    answerBtn.addEventListener('click', () => {
      section.classList.toggle('show-answers');
    });

    // 컬럼 헤더
    const colHeader = document.createElement('div');
    colHeader.className = 'columns-header';
    colHeader.innerHTML = '<span></span><span></span>';
    section.appendChild(colHeader);

    // 동의어-표제어 쌍 수집 및 렌더링
    const pairs = [];
    slice.forEach(([word, , syns], idx) => {
      shuffle(syns).forEach(syn => {
        pairs.push({ word, syn, wordNum: idx });
      });
    });
    const randomized = shuffle(pairs);

    const ul = document.createElement('ul');
    ul.className = 'columns-list';
    randomized.forEach((item, idx) => {
      const synNum  = idx + 1;
      const wordSym = circled[item.wordNum] || (item.wordNum + 1);
      const li = document.createElement('li');
      li.innerHTML = `<span>${synNum}. ${item.syn}</span><span>${wordSym} ${item.word}</span>`;
      ul.appendChild(li);
    });
    section.appendChild(ul);

    groupContainer.appendChild(section);
  }
});