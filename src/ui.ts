import type { CompositionResult } from './game/alignment';

const successResultImageUrl = '/assets/results/public-toilet-sign-removed-success.png';
const successResultTitle = '路牌已成功拆除';
const resultTitleTypingInterval = 95;

const cameraIcon = `
  <svg viewBox="0 0 32 32" aria-hidden="true">
    <path d="M4.5 10.5h5l1.8-3h9.4l1.8 3h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-23a2 2 0 0 1-2-2v-12a2 2 0 0 1 2-2Z" />
    <circle cx="16" cy="18" r="5.3" />
  </svg>
`;

const audioIcon = `
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <path class="audio-speaker" d="M4 11h4l5-4v14l-5-4H4Z" />
    <path class="audio-waves" d="M17 10.2c1.1 1 1.7 2.2 1.7 3.8s-.6 2.8-1.7 3.8M20.2 7.4c2 1.8 3.1 4 3.1 6.6s-1.1 4.8-3.1 6.6" />
    <path class="audio-muted-mark" d="m17.3 10.3 6.4 6.4m0-6.4-6.4 6.4" />
  </svg>
`;

const arrowIcon = (direction: 'up' | 'down' | 'left' | 'right'): string => `
  <svg viewBox="0 0 24 24" aria-hidden="true" class="move-icon move-icon--${direction}">
    <path d="M12 4 5.5 10.5 7.6 12.6 10.5 9.7V20h3V9.7l2.9 2.9 2.1-2.1Z" />
  </svg>
`;

function requiredElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing UI element: ${selector}`);
  return element;
}

export interface GameUI {
  startButton: HTMLButtonElement;
  shutterButton: HTMLButtonElement;
  audioButton: HTMLButtonElement;
  judgementRetakeButton: HTMLButtonElement;
  judgementContinueButton: HTMLButtonElement;
  resultContinueButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  judgementOverlay: HTMLElement;
  resultOverlay: HTMLElement;
  mobileMoveButtons: HTMLButtonElement[];
  setLoading: (ratio: number, label?: string) => void;
  setReady: () => void;
  setError: (message: string) => void;
  enterGame: () => void;
  setPointerLocked: (locked: boolean) => void;
  setMuted: (muted: boolean) => void;
  showJudgement: (imageDataUrl: string, result: CompositionResult) => void;
  hideJudgement: () => void;
  showSettlement: (result: CompositionResult) => void;
  hideSettlement: () => void;
}

export function createGameUI(root: HTMLElement): GameUI {
  root.innerHTML = `
    <main class="game-shell">
      <section class="loading-screen" aria-live="polite">
        <div class="loading-brand">
          <span class="loading-title">拍哇哇</span>
        </div>
        <div class="loading-track" aria-hidden="true"><span class="loading-fill"></span></div>
        <p class="loading-label">正在搭建街景 · 0%</p>
      </section>

      <section class="intro" aria-labelledby="intro-title">
        <div class="intro-copy">
          <h1 id="intro-title">拍哇<br />哇</h1>
          <p class="intro-lead">找到那个刚刚好的位置，让厕所路牌的箭头指向楼顶的 <strong>WAWA</strong>。</p>
          <div class="brief-line" aria-label="任务目标">
            <span>两块牌都要入镜<br />WAWA 要落在箭头下方</span>
          </div>
          <button class="start-button" type="button" disabled>
            <span>开始取景</span>
            <svg viewBox="0 0 28 18" aria-hidden="true"><path d="M1 9h23M17 2l7 7-7 7" /></svg>
          </button>
          <p class="start-note">桌面：WASD 移动 · 鼠标转向 · 空格拍照</p>
        </div>
        <div class="intro-rule" aria-hidden="true"><span>FRAME</span></div>
      </section>

      <section class="hud" aria-label="拍照界面">
        <div class="objective">
          <span class="objective-text">让箭头指向 WAWA</span>
        </div>
        <button class="audio-toggle" type="button" aria-label="关闭声音" aria-pressed="false">
          ${audioIcon}
          <span class="audio-toggle-label">声音</span>
        </button>
        <div class="lock-hint" aria-live="polite">
          <span class="lock-dot"></span>
          <span class="lock-copy">点击锁定 · 拖动转向</span>
        </div>
        <div class="viewfinder" aria-hidden="true">
          <span class="viewfinder-corner viewfinder-corner--tl"></span>
          <span class="viewfinder-corner viewfinder-corner--tr"></span>
          <span class="viewfinder-corner viewfinder-corner--bl"></span>
          <span class="viewfinder-corner viewfinder-corner--br"></span>
          <span class="viewfinder-center"></span>
          <span class="viewfinder-readout">FRAME · 16:9</span>
        </div>
        <div class="desktop-controls" aria-hidden="true">
          <span><kbd>WASD</kbd> 移动</span>
          <span><kbd>鼠标</kbd> 转向</span>
          <span><kbd>Space</kbd> 拍照</span>
        </div>
        <div class="touch-controls" aria-label="移动控制">
          <div class="touch-pad">
            <button type="button" data-move-x="0" data-move-z="1" aria-label="向前">${arrowIcon('up')}</button>
            <button type="button" data-move-x="-1" data-move-z="0" aria-label="向左">${arrowIcon('left')}</button>
            <button type="button" data-move-x="0" data-move-z="-1" aria-label="向后">${arrowIcon('down')}</button>
            <button type="button" data-move-x="1" data-move-z="0" aria-label="向右">${arrowIcon('right')}</button>
          </div>
          <span class="touch-look-label">拖动画面转向</span>
        </div>
        <button class="shutter" type="button" aria-label="拍照">
          <span class="shutter-ring">${cameraIcon}</span>
          <span class="shutter-label">拍照</span>
        </button>
      </section>

      <div class="flash" aria-hidden="true"></div>

      <section class="judgement-overlay" aria-live="polite" aria-label="构图判定" aria-hidden="true">
        <article class="judgement-card">
          <div class="judgement-photo-frame">
            <img class="judgement-image" src="/assets/signs/public-toilet-450m-front-texture.png" alt="本次拍摄的街景" />
          </div>
          <div class="judgement-copy">
            <span class="judgement-kicker">本次照片判定</span>
            <h2 class="judgement-title">正在判定</h2>
            <p class="judgement-hint"></p>
            <div class="judgement-meter" aria-hidden="true"><span></span></div>
            <div class="judgement-actions">
              <button class="judgement-retake" type="button">重拍</button>
              <button class="judgement-continue" type="button">继续</button>
            </div>
          </div>
        </article>
      </section>

      <section class="result-overlay" aria-live="polite" aria-label="拍照结果" aria-hidden="true">
        <article class="contact-sheet">
          <div class="photo-frame"><img class="result-image" src="${successResultImageUrl}" alt="工作人员正在拆除公共厕所路牌" /></div>
          <div class="result-copy">
            <h2 class="result-title">${successResultTitle}</h2>
            <p class="result-hint"></p>
            <div class="result-meter" aria-hidden="true"><span></span></div>
            <div class="result-actions">
              <button class="result-continue" type="button">继续取景</button>
              <button class="reset-button" type="button">回到起点</button>
            </div>
          </div>
        </article>
      </section>
    </main>
  `;

  const loading = requiredElement<HTMLElement>(root, '.loading-screen');
  const loadingFill = requiredElement<HTMLElement>(root, '.loading-fill');
  const loadingLabel = requiredElement<HTMLElement>(root, '.loading-label');
  const intro = requiredElement<HTMLElement>(root, '.intro');
  const hud = requiredElement<HTMLElement>(root, '.hud');
  const startButton = requiredElement<HTMLButtonElement>(root, '.start-button');
  const shutterButton = requiredElement<HTMLButtonElement>(root, '.shutter');
  const audioButton = requiredElement<HTMLButtonElement>(root, '.audio-toggle');
  const judgementOverlay = requiredElement<HTMLElement>(root, '.judgement-overlay');
  const judgementImage = requiredElement<HTMLImageElement>(root, '.judgement-image');
  const judgementTitle = requiredElement<HTMLElement>(root, '.judgement-title');
  const judgementHint = requiredElement<HTMLElement>(root, '.judgement-hint');
  const judgementMeter = requiredElement<HTMLElement>(root, '.judgement-meter span');
  const judgementRetakeButton = requiredElement<HTMLButtonElement>(root, '.judgement-retake');
  const judgementContinueButton = requiredElement<HTMLButtonElement>(root, '.judgement-continue');
  const resultOverlay = requiredElement<HTMLElement>(root, '.result-overlay');
  const resultImage = requiredElement<HTMLImageElement>(root, '.result-image');
  const resultTitle = requiredElement<HTMLElement>(root, '.result-title');
  const resultHint = requiredElement<HTMLElement>(root, '.result-hint');
  const resultMeter = requiredElement<HTMLElement>(root, '.result-meter span');
  const resultContinueButton = requiredElement<HTMLButtonElement>(root, '.result-continue');
  const resetButton = requiredElement<HTMLButtonElement>(root, '.reset-button');
  const lockHint = requiredElement<HTMLElement>(root, '.lock-hint');
  const flash = requiredElement<HTMLElement>(root, '.flash');
  const mobileMoveButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-move-x]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let resultTitleTypingTimer: number | null = null;

  const stopResultTitleTyping = (): void => {
    if (resultTitleTypingTimer !== null) {
      window.clearTimeout(resultTitleTypingTimer);
      resultTitleTypingTimer = null;
    }
    resultTitle.classList.remove('is-typing');
  };

  const setResultTitle = (text: string, typeText: boolean): void => {
    stopResultTitleTyping();
    resultTitle.setAttribute('aria-label', text);

    if (!typeText || reducedMotion.matches) {
      resultTitle.textContent = text;
      return;
    }

    let visibleCharacters = 1;
    resultTitle.textContent = text.slice(0, visibleCharacters);
    resultTitle.classList.add('is-typing');

    const typeNextCharacter = (): void => {
      visibleCharacters += 1;
      resultTitle.textContent = text.slice(0, visibleCharacters);

      if (visibleCharacters < text.length) {
        resultTitleTypingTimer = window.setTimeout(typeNextCharacter, resultTitleTypingInterval);
      } else {
        resultTitleTypingTimer = null;
        resultTitle.classList.remove('is-typing');
      }
    };

    resultTitleTypingTimer = window.setTimeout(typeNextCharacter, resultTitleTypingInterval);
  };

  return {
    startButton,
    shutterButton,
    audioButton,
    judgementRetakeButton,
    judgementContinueButton,
    resultContinueButton,
    resetButton,
    judgementOverlay,
    resultOverlay,
    mobileMoveButtons,
    setLoading: (ratio, label) => {
      const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
      loadingFill.style.transform = `scaleX(${percent / 100})`;
      loadingLabel.textContent = `${label ? `正在载入 ${label}` : '正在搭建街景'} · ${percent}%`;
    },
    setReady: () => {
      loadingFill.style.transform = 'scaleX(1)';
      loadingLabel.textContent = '街景就绪 · 100%';
      startButton.disabled = false;
      window.setTimeout(() => loading.classList.add('is-hidden'), 320);
    },
    setError: (message) => {
      loading.classList.remove('is-hidden');
      loading.classList.add('has-error');
      loadingLabel.textContent = message;
    },
    enterGame: () => {
      intro.classList.add('is-hidden');
      hud.classList.add('is-visible');
    },
    setPointerLocked: (locked) => {
      lockHint.classList.toggle('is-locked', locked);
      requiredElement<HTMLElement>(lockHint, '.lock-copy').textContent = locked
        ? '镜头控制中 · Esc 释放'
        : '点击锁定 · 拖动转向';
    },
    setMuted: (muted) => {
      audioButton.classList.toggle('is-muted', muted);
      audioButton.setAttribute('aria-pressed', String(muted));
      audioButton.setAttribute('aria-label', muted ? '打开声音' : '关闭声音');
      requiredElement<HTMLElement>(audioButton, '.audio-toggle-label').textContent = muted ? '静音' : '声音';
    },
    showJudgement: (imageDataUrl, result) => {
      stopResultTitleTyping();
      resultOverlay.classList.remove('is-visible', 'is-success');
      resultOverlay.setAttribute('aria-hidden', 'true');
      judgementImage.src = imageDataUrl;
      judgementTitle.textContent = result.success ? '拍照成功' : '拍照未成功';
      judgementHint.textContent = result.hint;
      judgementMeter.style.transform = `scaleX(${Math.max(0.08, result.score)})`;
      judgementOverlay.classList.toggle('is-success', result.success);
      judgementOverlay.classList.add('is-visible');
      judgementOverlay.setAttribute('aria-hidden', 'false');
      flash.classList.remove('is-firing');
      void flash.offsetWidth;
      flash.classList.add('is-firing');
      window.requestAnimationFrame(() => judgementContinueButton.focus());
    },
    hideJudgement: () => {
      judgementOverlay.classList.remove('is-visible', 'is-success');
      judgementOverlay.setAttribute('aria-hidden', 'true');
    },
    showSettlement: (result) => {
      judgementOverlay.classList.remove('is-visible', 'is-success');
      judgementOverlay.setAttribute('aria-hidden', 'true');
      resultImage.src = successResultImageUrl;
      resultImage.alt = '工作人员正在拆除公共厕所路牌';
      setResultTitle(successResultTitle, true);
      resultHint.textContent = result.hint;
      resultMeter.style.transform = `scaleX(${Math.max(0.08, result.score)})`;
      resultOverlay.classList.add('is-success');
      resultOverlay.classList.add('is-visible');
      resultOverlay.setAttribute('aria-hidden', 'false');
      window.requestAnimationFrame(() => resultContinueButton.focus());
    },
    hideSettlement: () => {
      stopResultTitleTyping();
      resultOverlay.classList.remove('is-visible', 'is-success');
      resultOverlay.setAttribute('aria-hidden', 'true');
    },
  };
}
