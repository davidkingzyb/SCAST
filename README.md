# 🔱SCAST

**Static Code Analysis and Visualization**

2024/9/27 by DKZ

![](https://davidkingzyb.github.io/blogmd/blogImg/scastbanner.png)

English/[中文](./README.zh.md)

[🔱SCAST](https://davidkingzyb.github.io/scast/SCAST.html) is a programmatic tool that converts code into UML diagrams and flowcharts.

[📽️watch video](https://youtu.be/KYbGcD38gqM)  
[📽️Tutorial](https://youtu.be/sYqRW7zem8s)  
[📽️MCP](https://youtu.be/ay4zFeYasPU)  

support plan
- javascript (use [acorn](https://github.com/acornjs/acorn))
- typescript (use [typescript](https://www.typescriptlang.org/) for now [estree](https://typescript-eslint.io/) later)
- csharp (use a custom parser no longer supported in future)
- python (ues a custom parser use [filbert](https://github.com/differentmatt/filbert) later)
- vue (later)

The underlying principle involves leveraging a parser to parse the code into an Abstract Syntax Tree (AST), followed by static analysis, and finally utilizing [Mermaid](https://github.com/mermaid-js/mermaid-live-editor) and [D3](https://github.com/d3/d3) for visualization.

You can try it [online](https://davidkingzyb.github.io/scast/SCAST.html) or just download this repo and open SCAST.html with browser.  
For Developers it can be deployed on servers using `npm run server`. Or use it as **MCP** server integrate it into your AI client.

![scast_uml](https://github.com/user-attachments/assets/0185738e-0815-4c92-8770-e9ff2b0da1d5)

## Update

### MCP

![mcp](https://github.com/user-attachments/assets/f35cf086-0105-47ce-a3d2-6ec1e09748d7)

1. `git clone https://github.com/davidkingzyb/SCAST.git` download the source code.
2. `npm install`
3. config at your client
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
#### Tools
##### scast_analysis:
SCAST is a tool designed to assist users in analyzing and summarizing code through visualization. 
By simply providing the folder path where the code is located, 
SCAST can perform static analysis on the code,  generating an AST tree to helping users understand the code structure and explain its functionality.
Generate various visual charts such as UML diagrams, AST tree diagrams and Mermaid flowcharts.
Finally return a keyword list containing all class and method names along with their functionality explanations, and include a link to allow users to view the chart details in their browser.

##### scast_retriever
SCAST is a tool that helps users analyze and summarize code and provides visualizations.
You need to provide the file path of the source code folder. SCAST will perform static analysis on the source codes in the folder, generating an AST tree to help users understand the code structure and explain its functionality.
After analyzing the code directory with SCAST, you can use keywords in the AST tree for searching, better answering user questions using a RAG method.
This keyword can be a class name, method name, or field name. SCAST will find the source code at its definition and return it.

#### Ollama AI

install [ollama](https://ollama.com/) first
see [ai.js](./js/ai.js) for more details

![ollama](https://github.com/user-attachments/assets/afe8f504-17f7-4897-9990-4baa4f66213d)

#### ESTree 

Compliant with ESTree specification AST parser

#### Force Directed Graph

![FDP](https://github.com/user-attachments/assets/6a34b405-492e-4966-a075-fce60330bccf)

#### More D3 Graph

- Indented tree
- Tidy tree
- Cluster tree
- Tadial tidy tree
- Radial cluster tree
- Force directed tree
- Edge bundling

![scast_d3](https://github.com/user-attachments/assets/11c4e11f-05e6-48b0-a3ee-c1e5f6a0816d)

