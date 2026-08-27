import type { GyroAimState } from './game/gyro-aim';
import type { ScoredPhotoResult } from './game/photo-score';
import { SECURITY_ALERT_CRITICAL_RATIO } from './game/security-alert';

const successResultImageUrl = '/assets/results/public-toilet-sign-removed-success.png';
const securityFailureImageUrl = '/assets/results/security-251-failure.png';
const successResultTitle = '路牌已成功 OTA';
const securityFailureTitle = '喜提251';
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

const gyroIcon = `
  <svg viewBox="0 0 28 28" aria-hidden="true">
    <rect class="gyro-phone" x="9" y="5" width="10" height="18" rx="1.4" />
    <circle class="gyro-center" cx="14" cy="14" r="1.5" />
    <path class="gyro-orbit" d="M4.4 10.2A10.2 10.2 0 0 1 21 6.7M23.6 17.8A10.2 10.2 0 0 1 7 21.3" />
    <path class="gyro-arrow" d="m19.5 4.7 2 2.2-2.8.7M8.5 23.3l-2-2.2 2.8-.7" />
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
  loadingRetryButton: HTMLButtonElement;
  shutterButton: HTMLButtonElement;
  audioButton: HTMLButtonElement;
  gyroButton: HTMLButtonElement;
  judgementRetakeButton: HTMLButtonElement;
  judgementContinueButton: HTMLButtonElement;
  resultContinueButton: HTMLButtonElement;
  resetButton: HTMLButtonElement;
  judgementOverlay: HTMLElement;
  resultOverlay: HTMLElement;
  mobileMoveButtons: HTMLButtonElement[];
  setLoading: (ratio: number, label?: string) => void;
  setReady: () => void;
  showLevelLoading: (levelNumber: number, total: number, name: string) => void;
  setLevelLoadProgress: (ratio: number, label?: string) => void;
  hideLevelLoading: () => void;
  setError: (message: string) => void;
  enterGame: () => void;
  setPointerLocked: (locked: boolean) => void;
  setMuted: (muted: boolean) => void;
  setGyroState: (state: GyroAimState) => void;
  setSecurityAlert: (ratio: number, targeted: boolean, enabled: boolean) => void;
  showJudgement: (imageDataUrl: string, result: ScoredPhotoResult) => void;
  hideJudgement: () => void;
  showSettlement: (result: ScoredPhotoResult, meta: { levelNumber: number; total: number; name: string; isFinal: boolean }) => void;
  showSecurityFailure: (meta: { levelNumber: number; total: number; name: string }) => void;
  hideSettlement: () => void;
  setLevel: (levelNumber: number, total: number, name: string, clue: string) => void;
}

export function createGameUI(root: HTMLElement): GameUI {
  root.innerHTML = `
    <main class="game-shell">
      <section class="loading-screen" aria-live="polite" aria-hidden="false">
        <div class="loading-brand">
          <span class="loading-title">拍哇哇</span>
          <button class="loading-retry" type="button" hidden>重试载入</button>
        </div>
        <div class="loading-track" aria-hidden="true"><span class="loading-fill"></span></div>
        <p class="loading-label">正在搭建街景 · 0%</p>
      </section>

      <section class="intro" aria-labelledby="intro-title">
        <div class="intro-copy">
          <span class="intro-level">10 关透视解谜 · 找到每一关的拍摄角度</span>
          <h1 id="intro-title">拍哇哇</h1>
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
          <span class="objective-level">第 1 / 10 关 · 暮色直街</span>
          <span class="objective-text">让箭头指向 WAWA</span>
        </div>
        <div class="security-alert" role="meter" aria-label="保安警戒" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-hidden="true">
          <div class="security-alert-copy">
            <span>保安警戒</span>
            <strong>镜头正对公共厕所路牌时持续上升</strong>
          </div>
          <div class="security-alert-track" aria-hidden="true"><span></span></div>
        </div>
        <button class="audio-toggle" type="button" aria-label="关闭声音" aria-pressed="false">
          ${audioIcon}
          <span class="audio-toggle-label">声音</span>
        </button>
        <button class="gyro-toggle is-idle" type="button" aria-label="开启陀螺仪瞄准" aria-pressed="false">
          ${gyroIcon}
          <span class="gyro-toggle-label">陀螺仪</span>
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
            <div class="judgement-score-row" aria-label="照片得分 0 分">
              <span class="judgement-score"><strong>0</strong> 分</span>
              <span class="judgement-bonus" hidden></span>
            </div>
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
        <article class="settlement-stage">
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
  const loadingTitle = requiredElement<HTMLElement>(root, '.loading-title');
  const loadingRetryButton = requiredElement<HTMLButtonElement>(root, '.loading-retry');
  const loadingFill = requiredElement<HTMLElement>(root, '.loading-fill');
  const loadingLabel = requiredElement<HTMLElement>(root, '.loading-label');
  const intro = requiredElement<HTMLElement>(root, '.intro');
  const hud = requiredElement<HTMLElement>(root, '.hud');
  const startButton = requiredElement<HTMLButtonElement>(root, '.start-button');
  const shutterButton = requiredElement<HTMLButtonElement>(root, '.shutter');
  const audioButton = requiredElement<HTMLButtonElement>(root, '.audio-toggle');
  const gyroButton = requiredElement<HTMLButtonElement>(root, '.gyro-toggle');
  const judgementOverlay = requiredElement<HTMLElement>(root, '.judgement-overlay');
  const securityAlert = requiredElement<HTMLElement>(root, '.security-alert');
  const securityAlertFill = requiredElement<HTMLElement>(root, '.security-alert-track span');
  const judgementImage = requiredElement<HTMLImageElement>(root, '.judgement-image');
  const judgementTitle = requiredElement<HTMLElement>(root, '.judgement-title');
  const judgementScoreRow = requiredElement<HTMLElement>(root, '.judgement-score-row');
  const judgementScore = requiredElement<HTMLElement>(root, '.judgement-score strong');
  const judgementBonus = requiredElement<HTMLElement>(root, '.judgement-bonus');
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
  const touchLookLabel = requiredElement<HTMLElement>(root, '.touch-look-label');
  const flash = requiredElement<HTMLElement>(root, '.flash');
  const mobileMoveButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-move-x]'));
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let resultTitleTypingTimer: number | null = null;
  let loadingHideTimer: number | null = null;

  const cancelLoadingHide = (): void => {
    if (loadingHideTimer === null) return;
    window.clearTimeout(loadingHideTimer);
    loadingHideTimer = null;
  };

  const hideLoadingScreen = (delay = 180): void => {
    cancelLoadingHide();
    loadingHideTimer = window.setTimeout(() => {
      loading.classList.add('is-hidden');
      loading.setAttribute('aria-hidden', 'true');
      loadingHideTimer = null;
    }, reducedMotion.matches ? 0 : delay);
  };

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
    loadingRetryButton,
    shutterButton,
    audioButton,
    gyroButton,
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
      loadingRetryButton.hidden = true;
      hideLoadingScreen(320);
    },
    showLevelLoading: (levelNumber, total, name) => {
      cancelLoadingHide();
      loadingTitle.textContent = `第 ${levelNumber} / ${total} 关 · ${name}`;
      loadingFill.style.transform = 'scaleX(0)';
      loadingLabel.textContent = '正在搭建下一处街景 · 0%';
      loading.classList.remove('is-hidden', 'has-error');
      loading.classList.add('is-level-transition');
      loading.setAttribute('aria-hidden', 'false');
      loadingRetryButton.hidden = true;
    },
    setLevelLoadProgress: (ratio, label) => {
      const percent = Math.round(Math.max(0, Math.min(1, ratio)) * 100);
      loadingFill.style.transform = `scaleX(${percent / 100})`;
      loadingLabel.textContent = `${label ? `正在载入 ${label}` : '正在搭建下一处街景'} · ${percent}%`;
    },
    hideLevelLoading: () => {
      loadingFill.style.transform = 'scaleX(1)';
      loadingLabel.textContent = '街景就绪 · 100%';
      loading.classList.remove('is-level-transition');
      hideLoadingScreen();
    },
    setError: (message) => {
      cancelLoadingHide();
      loading.classList.remove('is-hidden');
      loading.classList.add('has-error');
      loading.setAttribute('aria-hidden', 'false');
      loadingLabel.textContent = message;
      loadingRetryButton.hidden = false;
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
    setGyroState: (state) => {
      const labels: Record<GyroAimState, { button: string; hint: string }> = {
        idle: { button: '开启陀螺仪瞄准', hint: '点右上开启陀螺仪' },
        requesting: { button: '正在请求陀螺仪权限', hint: '正在请求陀螺仪权限' },
        calibrating: { button: '正在校准陀螺仪', hint: '保持手机当前方向' },
        active: { button: '重新校准陀螺仪瞄准', hint: '陀螺仪瞄准 · 拖动微调' },
        denied: { button: '陀螺仪未授权，点击重试', hint: '未授权 · 拖动画面转向' },
        unavailable: { button: '此设备不支持陀螺仪瞄准', hint: '拖动画面转向' },
      };
      for (const gyroState of Object.keys(labels) as GyroAimState[]) {
        gyroButton.classList.toggle(`is-${gyroState}`, gyroState === state);
      }
      gyroButton.disabled = state === 'requesting' || state === 'calibrating' || state === 'unavailable';
      gyroButton.setAttribute('aria-pressed', String(state === 'active'));
      gyroButton.setAttribute('aria-label', labels[state].button);
      requiredElement<HTMLElement>(gyroButton, '.gyro-toggle-label').textContent = state === 'active' ? '校准' : '陀螺仪';
      touchLookLabel.textContent = labels[state].hint;
    },
    setSecurityAlert: (ratio, targeted, enabled) => {
      const normalized = Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));
      const percent = Math.round(normalized * 100);
      securityAlert.classList.toggle('is-visible', enabled);
      securityAlert.classList.toggle('is-targeted', enabled && targeted);
      securityAlert.classList.toggle('is-critical', enabled && normalized >= SECURITY_ALERT_CRITICAL_RATIO);
      securityAlert.setAttribute('aria-hidden', String(!enabled));
      securityAlert.setAttribute('aria-valuenow', String(percent));
      securityAlertFill.style.transform = `scaleX(${normalized})`;
    },
    showJudgement: (imageDataUrl, result) => {
      stopResultTitleTyping();
      resultOverlay.classList.remove('is-visible', 'is-success', 'is-security-failure');
      resultOverlay.setAttribute('aria-hidden', 'true');
      judgementImage.src = imageDataUrl;
      judgementTitle.textContent = result.success ? '拍照成功' : '拍照未成功';
      judgementScore.textContent = String(result.points);
      judgementBonus.hidden = result.bonusPoints === 0;
      judgementBonus.textContent = result.bonusPoints > 0
        ? `遥遥领先入镜 +${result.bonusPoints}`
        : '';
      judgementScoreRow.setAttribute(
        'aria-label',
        `照片得分 ${result.points} 分${result.bonusPoints > 0 ? `，遥遥领先入镜加 ${result.bonusPoints} 分` : ''}`,
      );
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
    showSettlement: (result, meta) => {
      judgementOverlay.classList.remove('is-visible', 'is-success');
      judgementOverlay.setAttribute('aria-hidden', 'true');
      resultImage.src = successResultImageUrl;
      resultImage.alt = '工作人员正在拆除公共厕所路牌';
      setResultTitle(successResultTitle, true);
      const bonusCopy = result.bonusPoints > 0 ? ` · 遥遥领先入镜 +${result.bonusPoints}` : '';
      resultHint.textContent = `第 ${meta.levelNumber} / ${meta.total} 关 · ${meta.name} 已完成　照片得分 ${result.points} 分${bonusCopy}　${result.hint}`;
      resultMeter.style.transform = `scaleX(${Math.max(0.08, result.score)})`;
      resultOverlay.classList.remove('is-security-failure');
      resultOverlay.classList.add('is-success');
      resultOverlay.classList.add('is-visible');
      resultOverlay.setAttribute('aria-hidden', 'false');
      resultContinueButton.textContent = meta.isFinal ? '再玩一遍' : '进入下一关';
      window.requestAnimationFrame(() => resultContinueButton.focus());
    },
    showSecurityFailure: (meta) => {
      judgementOverlay.classList.remove('is-visible', 'is-success');
      judgementOverlay.setAttribute('aria-hidden', 'true');
      resultImage.src = securityFailureImageUrl;
      resultImage.alt = '蓝色制服、戴帽子的保安正在给玩家戴上手铐';
      setResultTitle(securityFailureTitle, true);
      resultHint.textContent = `第 ${meta.levelNumber} / ${meta.total} 关 · ${meta.name}　抓获米猴／境外势力。`;
      resultMeter.style.transform = 'scaleX(1)';
      resultOverlay.classList.remove('is-success');
      resultOverlay.classList.add('is-security-failure', 'is-visible');
      resultOverlay.setAttribute('aria-hidden', 'false');
      resultContinueButton.textContent = '重试本关';
      window.requestAnimationFrame(() => resultContinueButton.focus());
    },
    hideSettlement: () => {
      stopResultTitleTyping();
      resultOverlay.classList.remove('is-visible', 'is-success', 'is-security-failure');
      resultOverlay.setAttribute('aria-hidden', 'true');
    },
    setLevel: (levelNumber, total, name, clue) => {
      const levelLabel = `第 ${levelNumber} / ${total} 关 · ${name}`;
      requiredElement<HTMLElement>(root, '.objective-level').textContent = levelLabel;
      requiredElement<HTMLElement>(root, '.objective-text').textContent = clue;
    },
  };
}
