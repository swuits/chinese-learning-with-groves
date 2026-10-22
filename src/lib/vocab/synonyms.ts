/**
 * Words whose English meanings overlap so much that a quiz must not offer both as options
 * (the learner could not tell which one we mean). A word may appear in more than one group.
 */
export const SYNONYM_GROUPS: readonly (readonly string[])[] = [
  ["根据", "按照"],
  ["大概", "大约"],
  ["不但", "不仅"],
  ["医生", "大夫"],
  ["帮助", "帮忙"],
  ["高兴", "快乐", "愉快"],
  ["懂", "了解", "明白", "理解"],
  ["认为", "觉得", "以为"],
  ["一直", "总是", "从来"],
  ["字典", "词典"],
  ["以后", "后来", "然后"],
  ["办法", "方法"],
  ["刚才", "刚刚"],
  ["突然", "忽然"],
  ["非常", "极其", "极", "十分", "特别", "尤其"],
  ["漂亮", "美丽"],
  ["粗心", "马虎"],
  ["可能", "也许"],
  ["所以", "因此"],
  ["用", "使用"],
  ["解释", "说明", "讲"],
  ["商量", "谈", "讨论"],
  ["讲", "谈", "说话"],
  ["还", "仍然"],
  ["向", "往"],
  ["对", "正确", "准确"],
  ["著名", "有名"],
  ["一定", "肯定"],
  ["到底", "究竟"],
  ["增加", "增长"],
  ["准时", "按时"],
  ["看法", "意见"],
  ["激动", "兴奋"],
  ["口", "嘴"],
  ["中文", "汉语"],
  ["举行", "举办"],
  ["使", "引起"],
  ["只好", "不得不"],
  ["打扫", "收拾", "整理"],
  ["虽然", "尽管"],
  ["马上", "就"],
  ["但是", "可是", "不过", "然而", "却"],
  ["难过", "伤心", "难受"],
  ["先", "首先"],
  ["简单", "容易"],
  ["一样", "相同"],
  ["困难", "难"],
  ["注意", "小心"],
  ["爱好", "兴趣"],
  ["成功", "完成"],
  ["结束", "完", "完成"],
  ["打算", "计划"],
  ["元", "块"],
  ["日", "号"],
  ["爸爸", "父亲"],
  ["妈妈", "母亲"],
  ["我们", "咱们"],
  ["谢谢", "感谢"],
  ["对不起", "抱歉"],
  ["读", "阅读"],
  ["得意", "骄傲"],
  ["经常", "往往"],
  ["终于", "最后"],
  ["不管", "无论"],
  ["而且", "并且"],
  ["因为", "由于"],
  ["和", "跟", "与"],
  ["真", "确实", "实在"],
  ["周围", "附近"],
  ["街道", "路"],
  ["拿", "取", "带"],
  ["小心", "仔细"],
];

const groupsByWord: ReadonlyMap<string, readonly number[]> = (() => {
  const map = new Map<string, number[]>();
  SYNONYM_GROUPS.forEach((group, index) => {
    for (const hanzi of group) map.set(hanzi, [...(map.get(hanzi) ?? []), index]);
  });
  return map;
})();

/** True when two different words sit in a shared synonym group. */
export const areConfusable = (a: string, b: string): boolean => {
  if (a === b) return false;
  const groupsOfA = groupsByWord.get(a);
  const groupsOfB = groupsByWord.get(b);
  return Boolean(groupsOfA && groupsOfB && groupsOfA.some((index) => groupsOfB.includes(index)));
};
