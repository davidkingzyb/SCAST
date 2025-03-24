# 🔱SCAST

**代码静态分析可视化工具**

2024/9/27 by DKZ

[English](./README.md)/中文

![](https://davidkingzyb.github.io/blogmd/blogImg/scastbanner.png)

[🔱SCAST](https://davidkingzyb.github.io/scast/SCAST.html) 可以将输入的代码转换为UML图和流程图，可用作整理流程架构，输出文档图表。

[📺视频](https://www.bilibili.com/video/BV1QK2QYXEPW)  
[📺教程](https://www.bilibili.com/video/BV1EZNBejEfR)  
[📺MCP](https://www.bilibili.com/video/BV1fkoyY3EB5/)  

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

![mcp](https://github.com/user-attachments/assets/f35cf086-0105-47ce-a3d2-6ec1e09748d7)

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
SCAST 是一个帮助用户分析总结代码并将可视化的工具.
只需要提供源代码所在的文件夹路径, SCAST 会对文件夹下的源代码做静态分析,生成 AST 树, 帮助用户理解代码结构,解释代码的功能. 
生成一系列的可视化图表, 如 UML 类图, AST tree 图 以及 Mermaid flowchart 图等.
最后返回一个keyword列表,包含所有类和方法名称和其功能解释,并附一个连接, 让用户在浏览器中查看图表详情.

##### scast_retriever
SCAST 是一个帮助用户分析总结代码并将可视化的工具.
需要提供源代码所在的文件夹路径, SCAST 会对文件夹下的源代码做静态分析,生成 AST 树, 帮助用户理解代码结构, 解释代码的功能. 
使用 SCAST 分析完代码目录之后, 可以通过提供关键字在 AST 树中进行检索,用 RAG 的方法更好的回答用户的提问.
这个关键字可以是类名,方法名,或者是字段名称. SCAST 会找到其定义处的源代码并返回. 

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
