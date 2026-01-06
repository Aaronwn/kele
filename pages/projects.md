---
title: 项目 - Kele
display: ''
projects:
  我的项目:
    - name: '示例项目1'
      link: 'https://github.com/Aaronwn'
      descZh: '这是一个示例项目，请替换为你自己的项目'
      icon: 'i-carbon:code'
    - name: '示例项目2'
      link: 'https://github.com/Aaronwn'
      descZh: '项目描述...'
      icon: 'i-mdi:rocket-launch'
  # 你可以添加更多分类，如：
  # 开源工具:
  #   - name: '工具名称'
  #     link: 'https://github.com/...'
  #     descZh: '工具描述'
  #     icon: 'i-mdi:tools'
---
<ListProjects :projects="frontmatter.projects"></ListProjects>
