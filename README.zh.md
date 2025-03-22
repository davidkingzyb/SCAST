# 🔱SCAST

**代码静态分析可视化工具**

2024/9/27 by DKZ

[English](./README.md)/中文

![](https://davidkingzyb.github.io/blogmd/blogImg/scastbanner.png)

[🔱SCAST](https://davidkingzyb.github.io/scast/SCAST.html) 可以将输入的代码转换为UML图和流程图，可用作整理流程架构，输出文档图表。

[📽️视频](https://www.bilibili.com/video/BV1QK2QYXEPW)
[📽️教程](https://www.bilibili.com/video/BV1EZNBejEfR)

多种语言支持
- javascript (使用[acorn](https://github.com/acornjs/acorn))
- typescript (目前使用 [typescript](https://www.typescriptlang.org/) 之后可能迁移到 [estree](https://typescript-eslint.io/) 版本)
- csharp (定制的解析器，之后不再支持)
- python (定制解析器功能较全，之后可能迁移到 [filbert](https://github.com/differentmatt/filbert) 目前功能不全)

原理是将输入代码整理为AST树并对其进行静态分析，最后输出使用[Mermaid](https://github.com/mermaid-js/mermaid-live-editor) 和 [D3](https://github.com/d3/d3) 输出可视化图表.

可以使用在线版本 [online](https://davidkingzyb.github.io/scast/SCAST.html) 或者下载源码双击**SCAST.html**文件在浏览器中使用.  
对于开发者可使用 `npm run server` 将它部署在服务器中. 或者作为 **MCP** server 使用将它集成到你的 AI 客户端中.

![scast_uml](https://github.com/user-attachments/assets/0185738e-0815-4c92-8770-e9ff2b0da1d5)

## 更新

### MCP

1. `git clone https://github.com/davidkingzyb/SCAST.git` 下载源码.
2. `npm install`
3. 在你的客户端设置
```
{
  "mcpServers": {
    "scast":{
      "command":"node",
      "args":[
        "/YOUR_INSTALL_DIR/SCAST/mcp/index.js",
        "/YOUR_WORKSPACE/",
        "C:\\Users\\DKZ\\OTHER_ALLOWED_DIR\\",
      ]
    }
  }
}
```

#### 工具

##### scast_analysis:

SCAST is a tool designed to assist users in analyzing and summarizing code through visualization. 
By simply providing the folder path where the code is located, 
SCAST can perform static analysis on the code, helping users understand the code structure, explain its functionality.
generate various visual charts such as UML diagrams, AST tree diagrams and Mermaid flowcharts.

#### Ollama AI

请先安装[ollama](https://ollama.com/)
[ai.js](./js/ai.js)中查看更多详情

![ollama](https://github.com/user-attachments/assets/afe8f504-17f7-4897-9990-4baa4f66213d)

#### ESTree

兼容ESTree规范的AST paser

#### 力导引图

![FDP](https://github.com/user-attachments/assets/6a34b405-492e-4966-a075-fce60330bccf)

#### 其他 D3 图表

- Indented tree
- Tidy tree
- Cluster tree
- Tadial tidy tree
- Radial cluster tree
- Force directed tree
- Edge bundling

![scast_d3](https://github.com/user-attachments/assets/11c4e11f-05e6-48b0-a3ee-c1e5f6a0816d)
