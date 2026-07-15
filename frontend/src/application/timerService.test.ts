import { describe, expect, it } from 'vitest';
import { TimerService } from './timerService';
import { formatMMSS, remainingMs } from '@/lib/time';

/** Manually-advanced clock so timer behavior is exact and instant to test. */
function makeClock(startAt = 0) {
  let now = startAt;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('TimerService', () => {
  it('starts at zero and accumulates while running', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    expect(timer.status).toBe('idle');
    expect(timer.elapsedMs()).toBe(0);

    timer.start();
    expect(timer.status).toBe('running');
    clock.advance(1500);
    expect(timer.elapsedMs()).toBe(1500);
  });

  it('pause freezes elapsed time; resume continues from the paused value', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    timer.start();
    clock.advance(2000);
    timer.pause();
    expect(timer.status).toBe('paused');

    clock.advance(5000); // time passing while paused must not count
    expect(timer.elapsedMs()).toBe(2000);

    timer.resume();
    expect(timer.status).toBe('running');
    clock.advance(1000);
    expect(timer.elapsedMs()).toBe(3000);
  });

  it('reset returns to idle with zero elapsed', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    timer.start();
    clock.advance(4000);
    timer.reset();
    expect(timer.status).toBe('idle');
    expect(timer.elapsedMs()).toBe(0);
  });

  it('restarting an active timer starts again from zero', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    timer.start();
    clock.advance(9000);
    timer.start();
    expect(timer.elapsedMs()).toBe(0);
    clock.advance(500);
    expect(timer.elapsedMs()).toBe(500);
  });

  it('pause when not running and resume when already running are no-ops', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    timer.pause();
    expect(timer.status).toBe('idle');

    timer.start();
    clock.advance(100);
    timer.resume(); // already running
    clock.advance(100);
    expect(timer.elapsedMs()).toBe(200);
  });

  it('survives multiple pause/resume cycles with exact accounting', () => {
    const clock = makeClock(1_000_000);
    const timer = new TimerService(clock.now);
    timer.start();
    for (let i = 0; i < 5; i++) {
      clock.advance(300);
      timer.pause();
      clock.advance(10_000);
      timer.resume();
    }
    clock.advance(500);
    expect(timer.elapsedMs()).toBe(5 * 300 + 500);
  });
});

describe('formatMMSS', () => {
  it('formats as MM:SS with zero padding', () => {
    expect(formatMMSS(0)).toBe('00:00');
    expect(formatMMSS(999)).toBe('00:00');
    expect(formatMMSS(1000)).toBe('00:01');
    expect(formatMMSS(59_999)).toBe('00:59');
    expect(formatMMSS(60_000)).toBe('01:00');
    expect(formatMMSS(83_000)).toBe('01:23');
    expect(formatMMSS(600_000)).toBe('10:00');
    expect(formatMMSS(3_599_000)).toBe('59:59');
  });

  it('rolls past an hour without breaking the format', () => {
    expect(formatMMSS(3_600_000)).toBe('60:00');
  });

  it('clamps negative input to zero', () => {
    expect(formatMMSS(-5000)).toBe('00:00');
  });
});

describe('countdown (remainingMs over a running timer)', () => {
  it('counts down from the configured duration and clamps at zero', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    const durationMs = 120_000;

    timer.start();
    expect(remainingMs(durationMs, timer.elapsedMs())).toBe(120_000);
    clock.advance(45_000);
    expect(remainingMs(durationMs, timer.elapsedMs())).toBe(75_000);
    clock.advance(80_000); // past the end of the round
    expect(remainingMs(durationMs, timer.elapsedMs())).toBe(0);
  });

  it('holds the remaining time while paused', () => {
    const clock = makeClock();
    const timer = new TimerService(clock.now);
    timer.start();
    clock.advance(30_000);
    timer.pause();
    clock.advance(999_000);
    expect(remainingMs(60_000, timer.elapsedMs())).toBe(30_000);
    timer.resume();
    clock.advance(10_000);
    expect(remainingMs(60_000, timer.elapsedMs())).toBe(20_000);
  });

  it('formats remaining time as MM:SS', () => {
    expect(formatMMSS(remainingMs(180_000, 61_000))).toBe('01:59');
  });
});
