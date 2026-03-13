# Example: basic

这个示例演示从“需求”到规范、再到编译 Prompt、最后生成 stub 输出与 manifest 的最小闭环。

同时，它也体现了 MovieSpec 的“步骤编号”规则：`moviespec new` 生成的规范文档会自动带步骤前缀文件名（例如 `03_wuxia.md`）。

## 步骤

1. 编辑规范文档（示例已内置全套 specs）

本示例目录已经提供了完整的 `specs/`（并且文件名已按步骤编号命名），你可以直接打开并编辑：

- `specs/01_visual_decode/01_poem_adaptation.md`
- `specs/02_script/02_short_film.md`
- `specs/08_shot_list/08_act1.md`
- `specs/10_prompt_bible/10_default.md`
- `specs/14_keyframe_sheet/14_act1.md`

2. 编译 prompts

```bash
moviespec compile-prompts --shots storyboard/shots.yaml
```

3. 预检

```bash
moviespec validate --shots storyboard/shots.yaml
```

4. 生成（stub）

```bash
moviespec generate sequence --shots storyboard/shots.yaml
```

## 可选：从零开始（在空目录运行）

如果你希望从零创建项目（避免示例目录中因文件已存在而报错），请在一个空目录执行：

```bash
moviespec init
moviespec new world_bible wuxia
moviespec new visual_style filmlook
moviespec new characters lixunhuan
moviespec list-aesthetics
moviespec apply 胡金铨风
moviespec compile-prompts --shots storyboard/shots.yaml
moviespec validate --shots storyboard/shots.yaml
moviespec generate sequence --shots storyboard/shots.yaml
```

## 完整流程教程

如果你希望按完整流程从“文本到视频”走一遍，请阅读：

- `../../docs/text-to-video-workflow.md`
