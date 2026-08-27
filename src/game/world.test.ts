import { describe, expect, it } from 'vitest';

import { WORLD_COPY, getCampaignPhase } from './world';

describe('Paiwawa campaign world', () => {
  it('connects the photo evidence to the WAWA PR OTA response', () => {
    expect(WORLD_COPY.introPremise).toContain('辱 WAWA');
    expect(WORLD_COPY.role).toBe('身份：民间舆情巡查员');
    expect(WORLD_COPY.evidenceFlow).toContain('拍照取证');
    expect(WORLD_COPY.evidenceFlow).toContain('WAWA 公关');
    expect(WORLD_COPY.evidenceFlow).toContain('路牌 OTA');
    expect(WORLD_COPY.introPremise).toBe(
      '境外势力在各地布置了一批「辱 WAWA」厕所路牌。你的任务是拍下箭头确实指向 WAWA 的错位构图，为清理行动留下证据。',
    );
    expect(WORLD_COPY.securityFailureReport).toBe('系统通报：抓获境外势力，251 号流程已启动。');
  });

  it('switches to the high-risk patrol phase for the final five levels', () => {
    expect(getCampaignPhase(1)).toBe('公开巡查 · 证据采集');
    expect(getCampaignPhase(5)).toBe('公开巡查 · 证据采集');
    expect(getCampaignPhase(6)).toBe('高风险巡查 · 避免身份误判');
    expect(getCampaignPhase(10)).toBe('高风险巡查 · 避免身份误判');
  });
});
