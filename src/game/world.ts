export const WORLD_COPY = {
  introStatus: 'WAWA 舆情巡查档案 · 10 个涉事点位',
  introPremise:
    '境外势力在各地布置了一批「辱 WAWA」厕所路牌。你的任务是拍下箭头确实指向 WAWA 的错位构图，为清理行动留下证据。',
  role: '身份：民间舆情巡查员',
  evidenceFlow: '找到机位 → 拍照取证 → 通知 WAWA 公关 → 路牌 OTA',
  witnessBonus: '路人“遥遥领先”入镜，可作为群众证言额外加分',
  loadingTitle: '正在接入 WAWA 舆情巡查系统',
  loadingBrief: '正在核验首处涉事点位，建立厕所路牌与 WAWA 的指向关系。',
  judgementSystem: 'WAWA 舆情取证系统',
  successTitle: '辱 WAWA 证据成立',
  failureTitle: '证据不足',
  securityLabel: '蓝帽保安警戒',
  securityHint: '镜头正对涉事路牌时，身份误判持续上升',
  securityFailureReport: '系统通报：抓获境外势力，251 号流程已启动。',
} as const;

export const getCampaignPhase = (levelNumber: number): string =>
  levelNumber <= 5 ? '公开巡查 · 证据采集' : '高风险巡查 · 避免身份误判';
