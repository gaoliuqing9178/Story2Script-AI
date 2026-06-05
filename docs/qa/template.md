# Evaluator QA Report Template

Feature ID:

Date:

Evaluator:

Tooling:

- Chrome DevTools MCP: yes / no
- Browser:
- Viewport:

## 复现步骤

1. 
2. 
3. 

## 截图或日志证据

- Screenshot:
- Trace:
- Server logs:
- Command output:

## 视觉检查

| 检查项 | 结果 | 说明 |
| --- | --- | --- |
| 页面非空白 | pass / fail | |
| 首屏关键内容可见 | pass / fail | |
| 无明显错位或遮挡 | pass / fail | |
| 无文字溢出或按钮截断 | pass / fail | |
| Loading / 错误态可辨认 | pass / fail | |

## 评分

| 维度 | 分数 | 说明 |
| --- | --- | --- |
| 用户路径完整度 | /5 | |
| 数据契约一致性 | /5 | |
| 错误与边界处理 | /5 | |
| UI 可用性 | /5 | |
| 可维护性 | /5 | |

## 是否放行

Decision: HOLD / PASS

只有 Chrome DevTools MCP 真实路径验证与截图视觉检查都通过时才写 PASS。

## 修复建议

- 
