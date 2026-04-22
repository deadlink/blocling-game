import type { Difficulty } from "../game/config";
import type { MatchState } from "../game/state/MatchState";

export class DomHud {
  private readonly left: HTMLElement;
  private readonly right: HTMLElement;

  constructor(left: HTMLElement, right: HTMLElement) {
    this.left = left;
    this.right = right;
  }

  update(
    matchState: MatchState,
    activeSignals: number,
    difficulty: Difficulty,
  ): void {
    this.left.innerHTML = [
      '<div class="hud-title">NET DEF</div>',
      '<div class="hud-block">',
      `<div class="hud-line">MODE ${difficulty.toUpperCase()}</div>`,
      `<div class="hud-line">LEVEL ${matchState.level}</div>`,
      `<div class="hud-line">ACTIVE ${activeSignals}</div>`,
      `<div class="hud-line">CAUGHT ${matchState.caught}</div>`,
      `<div class="hud-line">MISSED ${matchState.missed}</div>`,
      `<div class="hud-line">TRAFFIC ${matchState.total}</div>`,
      "</div>",
      '<div class="hud-block hud-rules">',
      '<div class="hud-line">VPN  +10</div>',
      '<div class="hud-line">YT   +/-2</div>',
      '<div class="hud-line">TG   +/-4</div>',
      '<div class="hud-line">X    +/-8</div>',
      '<div class="hud-line">PH   +/-15</div>',
      '<div class="hud-line">BLOCK: x5</div>',
      "</div>",
    ].join("");

    const progressPercent = Math.round(matchState.progressToNextLevel * 100);
    this.right.innerHTML = [
      '<div class="hud-title">SCORE</div>',
      `<div class="hud-score">${Math.floor(matchState.score)}</div>`,
      '<div class="hud-block">',
      `<div class="hud-line">NEXT ${matchState.nextLevelScore}</div>`,
      `<div class="hud-line">PROGRESS ${progressPercent}%</div>`,
      "</div>",
      '<div class="hud-progress-track">',
      `<div class="hud-progress-fill" style="width:${progressPercent}%"></div>`,
      "</div>",
    ].join("");
  }
}
