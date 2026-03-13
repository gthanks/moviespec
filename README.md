# MovieSpec

MovieSpec 是一套面向 AI 图片/视频生成的「规范先行」工作方式：先把世界观、角色、视觉风格、镜头语言与分镜结构写成可机读/可复用的规范文档，再从这些规范稳定编译出 Prompt 与参数，并将每次生成的输入与输出写入 manifest 以便复现与排查一致性漂移。

## 目录结构

- `bin/`：CLI 入口
- `schema/`：可机读 schema（类型、路径、依赖、编译规则）
- `templates/`：各类规范文档模板（Markdown + YAML front matter）

## 文档生成规则

- 所有规范文档默认使用中文撰写
- 模板 front matter 默认带 `language: zh-CN`
- `moviespec init` 生成的 `config.yaml` 默认写入中文文档策略

## 文档步骤编号规则

- `schema/moviespec.schema.yaml` 为每种文档类型定义统一的 `step`
- `schema/moviespec.schema.yaml` 的 `defaultPath` 默认采用编号目录：`specs/NN_<typeId>`（例如 `specs/01_visual_decode`）
- `moviespec new <type> <name>` 默认生成带步骤前缀的文件名，例如 `specs/01_visual_decode/01_poem_adaptation.md`
- 模板生成时会自动补充 `step` front matter，并在一级标题前附加步骤号
- 对于 `characters` 这类会被分镜引用的类型，校验逻辑会自动忽略文件名前缀，因此分镜中仍然写原始角色名即可，例如 `lixunhuan`

## 从旧目录结构迁移到编号目录

如果你的项目原本使用 `specs/<typeId>/`（例如 `specs/visual_style/`），在当前版本中建议迁移到 `specs/NN_<typeId>/`（例如 `specs/05_visual_style/`）。

最小迁移步骤：

1. 仅迁移目录（推荐先做这一步）

- 将 `specs/visual_decode` 重命名为 `specs/01_visual_decode`
- 将 `specs/script` 重命名为 `specs/02_script`
- 将 `specs/world_bible` 重命名为 `specs/03_world_bible`
- 将 `specs/characters` 重命名为 `specs/04_characters`
- 将 `specs/visual_style` 重命名为 `specs/05_visual_style`
- 将 `specs/look_book` 重命名为 `specs/06_look_book`
- 将 `specs/cinematography` 重命名为 `specs/07_cinematography`
- 将 `specs/shot_list` 重命名为 `specs/08_shot_list`
- 将 `specs/shot_template` 重命名为 `specs/09_shot_template`
- 将 `specs/prompt_bible` 重命名为 `specs/10_prompt_bible`
- 将 `specs/prompt_guide` 重命名为 `specs/11_prompt_guide`
- 将 `specs/consistency_system` 重命名为 `specs/12_consistency_system`
- 将 `specs/hero_shot_pilot` 重命名为 `specs/13_hero_shot_pilot`
- 将 `specs/keyframe_sheet` 重命名为 `specs/14_keyframe_sheet`
- 将 `specs/video_generation_sheet` 重命名为 `specs/15_video_generation_sheet`
- 将 `specs/sound_design` 重命名为 `specs/16_sound_design`
- 将 `specs/edit_plan` 重命名为 `specs/17_edit_plan`
- 将 `specs/grading_guide` 重命名为 `specs/18_grading_guide`
- 将 `specs/delivery_manifest` 重命名为 `specs/19_delivery_manifest`

2. （可选）迁移文件名

文件名是否带 `NN_` 前缀不会影响读取（工具会扫描目录下所有 `*.md/*.yaml/*.json`），但推荐让新生成文档保持统一：

- 之后使用 `moviespec new` 创建的新文档会自动生成 `NN_` 前缀文件名
- 旧文档如果想统一，只需重命名为 `NN_<name>.md` 即可

## 安装

如果你想在全局使用该命令，可以通过 NPM 安装：

```bash
npm install -g @gthanks/moviespec@latest
```

## 用户项目最小目录结构（与工具仓库分离）

MovieSpec 工具仓库是本目录（`moviespec/`）。用户实际制作项目建议使用独立工作目录（任意路径），并满足最小结构：

- `config.yaml`
- `specs/`
- `storyboard/`
- `prompts/`（由 `compile-prompts` 生成）
- `output/`（由 `generate` 生成）

你可以在用户项目目录下执行：

```bash
moviespec init
```

CLI 将按 `schema/moviespec.schema.yaml` 的默认路径读取与写入上述目录。

## 完整流程教程

- 详细教程：[`docs/text-to-video-workflow.md`](./docs/text-to-video-workflow.md)
- 最小示例：[`examples/basic/README.md`](./examples/basic/README.md)

## 核心规范文档类型

- `01 visual_decode`：视觉解译
- `02 script`：剧本
- `03 world_bible`：世界观
- `04 characters`：人物设定
- `05 visual_style`：视觉风格
- `06 look_book`：视觉风格圣经
- `07 cinematography`：镜头语言
- `08 shot_list`：镜头清单
- `09 shot_template`：分镜模板
- `10 prompt_bible`：Prompt 圣经
- `11 prompt_guide`：Prompt 规范
- `12 consistency_system`：视觉一致性系统
- `13 hero_shot_pilot`：关键镜头测试
- `14 keyframe_sheet`：关键帧制作单
- `15 video_generation_sheet`：视频生成单
- `16 sound_design`：声音设计
- `17 edit_plan`：剪辑计划
- `18 grading_guide`：调色指南
- `19 delivery_manifest`：交付清单

## 最小命令集（v1）

- `moviespec init`
- `moviespec list types`
- `moviespec list-aesthetics` (查看有哪些内置的经典电影美学)
- `moviespec apply <name>` (将内置美学套用到当前项目的视觉风格中，并按步骤号写入 `visual_style`)
- `moviespec new <type> <name>` (生成带步骤前缀的文档)
- `moviespec compile-prompts --shots <file>`
- `moviespec validate` / `moviespec check`
- `moviespec generate image --shot <id>`（stub）
- `moviespec generate sequence --shots <file>`（stub）

## 快速开始

```bash
moviespec init
moviespec list types
moviespec new visual_decode poem_adaptation
moviespec new script short_film
moviespec new characters lixunhuan
moviespec apply 胡金铨风
moviespec new look_book rain_noir
moviespec compile-prompts --shots storyboard/shots.yaml
moviespec validate --shots storyboard/shots.yaml
moviespec generate sequence --shots storyboard/shots.yaml
```

说明：当前 `compile-prompts` 在 v1 中仍以 `storyboard/shots.yaml` 为直接输入，以上规范文档已经可以帮助你按完整流程组织项目，并参与依赖指纹校验；后续版本可继续将更多规范文档内容编译进最终 Prompt。