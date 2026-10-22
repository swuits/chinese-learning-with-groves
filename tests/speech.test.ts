import { describe, expect, it } from "vitest";
import { pickChineseVoice, type VoiceLike } from "@/lib/speech";

const voice = (name: string, lang: string): VoiceLike => ({ name, lang });

describe("pickChineseVoice", () => {
  it("returns null when there is no Chinese voice", () => {
    expect(pickChineseVoice([voice("Alex", "en-US"), voice("Amelie", "fr-FR")])).toBeNull();
    expect(pickChineseVoice([])).toBeNull();
  });

  it("only ever picks a Chinese voice", () => {
    const picked = pickChineseVoice([voice("Samantha", "en-US"), voice("Tingting", "zh-CN")]);
    expect(picked?.name).toBe("Tingting");
  });

  it("prefers mainland Mandarin over Taiwan and Hong Kong voices", () => {
    const picked = pickChineseVoice([
      voice("Meijia", "zh-TW"),
      voice("Sinji", "zh-HK"),
      voice("Tingting", "zh-CN"),
    ]);
    expect(picked?.lang).toBe("zh-CN");
  });

  it("prefers natural-sounding neural voices", () => {
    const picked = pickChineseVoice([
      voice("Tingting", "zh-CN"),
      voice("Microsoft Xiaoxiao Online (Natural) - Chinese (Mainland)", "zh-CN"),
      voice("Eddy", "zh-CN"),
    ]);
    expect(picked?.name).toMatch(/Natural/);
  });

  it("accepts underscore and cmn language tags", () => {
    expect(pickChineseVoice([voice("A", "zh_CN")])?.name).toBe("A");
    expect(pickChineseVoice([voice("B", "cmn-Hans-CN")])?.name).toBe("B");
  });
});
