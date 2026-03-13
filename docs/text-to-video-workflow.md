# MovieSpec 文本到视频完整工作流

本文档提供一套可执行的 MovieSpec 使用路径，目标是帮助你从创意文本 / 需求出发，逐步沉淀规范文档、组织分镜与 Prompt，并完成关键帧、视频生成、声音、剪辑、调色与交付。

## 核心原则

- 规范先行：先写“可复用的规范文档”，再执行生成
- 步骤编号：每类文档都有统一的 `step`（见 `schema/moviespec.schema.yaml`）
- 自动编号：`moviespec new` 会写入编号目录与步骤前缀文件名（例如 `specs/01_visual_decode/01_poem_adaptation.md`），并写入 `step` front matter，同时在一级标题前加步骤号
- 兼容引用：对 `characters` 这类会被分镜引用的类型，校验逻辑会自动忽略文件名前缀，因此分镜中仍写原始角色名（例如 `lixunhuan`）即可

## 一次完整制作的步骤总览

- 01 `visual_decode`：视觉解译
- 02 `script`：剧本
- 03 `world_bible`：世界观
- 04 `characters`：人物设定
- 05 `visual_style`：视觉风格
- 06 `look_book`：视觉风格圣经
- 07 `cinematography`：镜头语言
- 08 `shot_list`：镜头清单
- 09 `shot_template`：分镜模板
- 10 `prompt_bible`：Prompt 圣经
- 11 `prompt_guide`：Prompt 规范
- 12 `consistency_system`：视觉一致性系统
- 13 `hero_shot_pilot`：关键镜头测试
- 14 `keyframe_sheet`：关键帧制作单
- 15 `video_generation_sheet`：视频生成单
- 16 `sound_design`：声音设计
- 17 `edit_plan`：剪辑计划
- 18 `grading_guide`：调色指南
- 19 `delivery_manifest`：交付清单

## 第 0 步：初始化项目

在你的实际制作目录中执行：

```bash
moviespec init
```

生成的最小结构：

- `config.yaml`
- `specs/`
- `storyboard/`
- `prompts/`
- `output/`

建议你先检查 `config.yaml`：

- `documents.language` 是否为 `zh-CN`
- `media` 是否符合你的成片规格
- `backend.id` 是否是你准备使用的后端（当前内置为 stub）

## 第 1 步：视觉解译（01 visual_decode）

目的：把原始文本拆解成画面母题、空间气质、意象结构和情绪节奏。

创建文档：

```bash
moviespec new visual_decode poem_adaptation
```

生成文件：

- `specs/01_visual_decode/01_poem_adaptation.md`

建议写法：

- 核心意象（反复出现的画面元素）
- 情绪曲线（从哪里开始、在哪里抬升、在哪里落下）
- 时间与天气（季节、昼夜、风雨雾雪）
- 禁止偏差（哪些风格方向会毁掉你的作品）

产出标准：

- 你能用视觉语言复述原文
- 你已经明确全片的总体氛围和母题

## 第 2 步：剧本（02 script）

目的：把视觉理解转换成可执行的叙事结构。

```bash
moviespec new script short_film
```

生成文件：

- `specs/02_script/02_short_film.md`

建议写法：

- 场次 / 段落划分
- 每场发生了什么
- 台词 / 旁白 / 字幕
- 转场与节奏

产出标准：

- 可以支撑后续“镜头拆分”
- 每一段落都有明确视觉目标

## 第 3 步：世界观（03 world_bible）

目的：固定影片世界的规则边界。

```bash
moviespec new world_bible wuxia_world
```

生成文件：

- `specs/03_world_bible/03_wuxia_world.md`

建议写法：

- 时空背景
- 核心设定
- 规则与禁忌
- 关键道具 / 势力 / 场所

## 第 4 步：角色设定（04 characters）

目的：把人物的一致性资产提前固定下来。

```bash
moviespec new characters lixunhuan
moviespec new characters heroine
```

生成文件：

- `specs/04_characters/04_lixunhuan.md`
- `specs/04_characters/04_heroine.md`

建议写法：

- 外观（脸型、发型、体态、年龄感）
- 服饰与配色（主色、材质、纹理、饰品）
- 性格与动机（会影响镜头表演的部分）
- 关键标识（必须稳定复现的点）
- LoRA（可选）或参考图

## 第 5 步：视觉风格（05 visual_style）

目的：确定影片的基础视觉方向。

你可以自行创建：

```bash
moviespec new visual_style filmlook
```

生成文件：

- `specs/05_visual_style/05_filmlook.md`

也可以套用内置美学：

```bash
moviespec list-aesthetics
moviespec apply 胡金铨风
```

生成文件：

- `specs/05_visual_style/05_胡金铨风.md`

## 第 6 步：视觉风格圣经（06 look_book）

目的：把视觉风格具体到场景、质感和参考画面层面。

```bash
moviespec new look_book rain_noir
```

生成文件：

- `specs/06_look_book/06_rain_noir.md`

建议写法：

- 参考影片与参考画面
- 分场景风格说明
- 光线逻辑
- 色彩与材质
- Prompt 风格锚点
- 禁用偏差

## 第 7 步：镜头语言（07 cinematography）

目的：规定全片摄影规则和镜头运动边界。

```bash
moviespec new cinematography default_camera_language
```

生成文件：

- `specs/07_cinematography/07_default_camera_language.md`

## 第 8 步：镜头清单（08 shot_list）

目的：把剧本拆成可以制作的镜头单元。

```bash
moviespec new shot_list act1
```

生成文件：

- `specs/08_shot_list/08_act1.md`

建议写法：

- 镜头编号
- 角色
- 场景
- 动作
- 构图
- 时长

## 第 9 步：分镜模板（09 shot_template）

目的：沉淀常用镜头模板供复用。

```bash
moviespec new shot_template dialogue_closeup
```

生成文件：

- `specs/09_shot_template/09_dialogue_closeup.md`

## 第 10 步：Prompt 圣经（10 prompt_bible）

目的：建立 Prompt 的统一结构和词表。

```bash
moviespec new prompt_bible default
```

生成文件：

- `specs/10_prompt_bible/10_default.md`

## 第 11 步：Prompt 规范（11 prompt_guide）

目的：定义项目的 Prompt 写作规则与兼容策略。

```bash
moviespec new prompt_guide default_rules
```

生成文件：

- `specs/11_prompt_guide/11_default_rules.md`

## 第 12 步：一致性系统（12 consistency_system）

目的：专门解决人物、服装、道具、色彩和场景的一致性漂移。

```bash
moviespec new consistency_system core_rules
```

生成文件：

- `specs/12_consistency_system/12_core_rules.md`

## 第 13 步：关键镜头测试（13 hero_shot_pilot）

目的：先测试最关键、最能代表成片气质、也最容易翻车的镜头。

```bash
moviespec new hero_shot_pilot act1_pilot
```

生成文件：

- `specs/13_hero_shot_pilot/13_act1_pilot.md`

## 第 14 步：关键帧制作单（14 keyframe_sheet）

目的：把关键帧生成任务标准化。

```bash
moviespec new keyframe_sheet act1
```

生成文件：

- `specs/14_keyframe_sheet/14_act1.md`

## 第 15 步：视频生成单（15 video_generation_sheet）

目的：把关键帧转成可执行的视频生成任务。

```bash
moviespec new video_generation_sheet act1_motion
```

生成文件：

- `specs/15_video_generation_sheet/15_act1_motion.md`

## 第 16 步：声音设计（16 sound_design）

```bash
moviespec new sound_design act1_audio
```

生成文件：

- `specs/16_sound_design/16_act1_audio.md`

## 第 17 步：剪辑计划（17 edit_plan）

```bash
moviespec new edit_plan act1_cut
```

生成文件：

- `specs/17_edit_plan/17_act1_cut.md`

## 第 18 步：调色指南（18 grading_guide）

```bash
moviespec new grading_guide final_grade
```

生成文件：

- `specs/18_grading_guide/18_final_grade.md`

## 第 19 步：交付清单（19 delivery_manifest）

```bash
moviespec new delivery_manifest final_delivery
```

生成文件：

- `specs/19_delivery_manifest/19_final_delivery.md`

## 分镜、Prompt 编译与 stub 生成

当前 v1 版本的 `compile-prompts` 以 `storyboard/shots.yaml` 为直接输入。

最小分镜示例：

```yaml
shots:
  - id: shot_001
    characters: [lixunhuan]
    scene: "雨夜小镇街口"
    action: "主角停步回望，雨水打湿衣袖"
    composition: "中景，轻微推近"
    duration_s: 4
    prompt:
      negative: "low quality, blurry"
```

执行：

```bash
moviespec compile-prompts --shots storyboard/shots.yaml
moviespec validate --shots storyboard/shots.yaml
moviespec generate sequence --shots storyboard/shots.yaml
```

## 推荐执行节奏

- 先完成 01 到 08，把故事与镜头拆清楚
- 再完成 10 到 15，把 Prompt、关键帧与视频执行规则固定下来
- 最后完成 16 到 19，把声音、剪辑、调色和交付整理完整
