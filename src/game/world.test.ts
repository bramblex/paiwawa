import { describe, expect, it } from 'vitest';

import { WORLD_COPY, getCampaignPhase } from './world';

describe('Paiwawa campaign world', () => {
  it('connects the photo evidence to the WAWA PR OTA response', () => {
    expect(WORLD_COPY.introPremise).toContain('辱 WAWA');
    expect(WORLD_COPY.role).toBe('身份：民间舆情巡查员');
    expect(WORLD_COPY.evidenceFlow).toContain('拍照取证');
    expect(WORLD_COPY.evidenceFlow).toContain('WAWA 公关');
    expect(WORLD_COPY.evidenceFlow).toContain('路牌 OTA');
  });

  it('switches to the high-risk patrol phase for the final five levels', () => {
    expect(getCampaignPhase(1)).toBe('公开巡查 · 证据采集');
    expect(getCampaignPhase(5)).toBe('公开巡查 · 证据采集');
    expect(getCampaignPhase(6)).toBe('高风险巡查 · 避免身份误判');
    expect(getCampaignPhase(10)).toBe('高风险巡查 · 避免身份误判');
  });
});
