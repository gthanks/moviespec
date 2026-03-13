# MovieSpec 全流程文档体系设计

## 目标

将 `moviespec` 从“前期规范 + Prompt 编译工具”扩展为“规范驱动的视频生产文档系统”，覆盖：

```text
文本 / 需求
→ 视觉解译
→ 剧本
→ 镜头清单
→ 分镜
→ 风格系统
→ Prompt 系统
→ 一致性控制
→ 关键镜头测试
→ 关键帧制作
→ 视频生成
→ 声音设计
→ 剪辑
→ 调色
→ 交付归档
```

## 全局规则

- 所有规范文档默认使用中文撰写
- 所有模板 front matter 统一携带 `language: zh-CN`
- `config.yaml` 默认写入中文文档策略
- 英文只作为 Prompt 片段、平台参数或外部工具字段存在，不应替代正文说明

## 分层设计

### 1. 前期理解层

- `requirements`
  - 项目需求、目标、约束
- `visual_decode`
  - 将原文本、诗歌、故事或主题转译为视觉表达
- `script`
  - 制作级剧本，承接叙事结构、场次和情绪节奏

### 2. 世界与风格层

- `world_bible`
  - 世界观与规则
- `characters`
  - 角色、服装、关键标识、一致性信息
- `visual_style`
  - 抽象风格规则
- `look_book`
  - 参考影片、场景组、光线、色彩、质感
- `cinematography`
  - 景别、运镜、构图与剪辑偏好

### 3. 导演规划层

- `shot_list`
  - 导演级镜头蓝图，定义每镜意图和叙事功能
- `shot_template`
  - 标准分镜字段模板
- `storyboard`
  - 逐镜结构化数据

### 4. Prompt 与一致性层

- `prompt_bible`
  - Prompt 结构公式、词表与平台策略
- `prompt_guide`
  - Prompt 编写规范与约束
- `consistency_system`
  - 人物、服装、场景、色彩、Seed、Reference 的统一规则

### 5. 试产与生产层

- `hero_shot_pilot`
  - 关键镜头测试，验证风格是否成立
- `keyframe_sheet`
  - 关键帧制作执行单
- `video_generation_sheet`
  - 图生视频执行单

### 6. 后期与交付层

- `sound_design`
  - 环境音、配音、音乐、声画关系
- `edit_plan`
  - 节奏、排序、转场、版本迭代
- `grading_guide`
  - 调色目标、场景策略、一致性检查
- `delivery_manifest`
  - 成片交付、归档、版本映射

## 类型之间的关键依赖

```text
visual_decode → script → shot_list → keyframe_sheet → video_generation_sheet
visual_style → look_book → prompt_bible → consistency_system → hero_shot_pilot
script + shot_list → sound_design → edit_plan → grading_guide → delivery_manifest
```

## 目录建议

```text
specs/
  visual_decode/
  script/
  world_bible/
  characters/
  visual_style/
  look_book/
  cinematography/
  shot_list/
  shot_template/
  prompt_bible/
  prompt_guide/
  consistency_system/
  hero_shot_pilot/
  keyframe_sheet/
  video_generation_sheet/
  sound_design/
  edit_plan/
  grading_guide/
  delivery_manifest/
storyboard/
prompts/
output/
```

## 当前实现策略

第一阶段已经完成：

- 增补核心缺失类型到 `schema/moviespec.schema.yaml`
- 为所有新类型创建中文模板
- 将中文文档策略接入默认配置与 README

下一阶段建议：

- 给 `validate` 增加中文文档策略检查
- 给 `generate` 扩展关键帧 / 视频 / 后期 manifest
- 为 `examples/basic` 补充完整示例链路
