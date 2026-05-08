#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, ToolSchema, } from "@modelcontextprotocol/sdk/types.js";
import fs from "fs/promises";
import {existsSync} from 'fs'
import path from "path";
import os from 'os';
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import net from "net";
import {spawn,exec} from 'child_process'

// import work node and npm run dev but not work as mcp WHY?
var mcpdirpath=import.meta.url.replace('index.js','')
const _TreeSitter = (await import(mcpdirpath.replace("mcp/",'js/TreeSitter.js'))).default;
for(let language in _TreeSitter.LANGUAGE_WASM){
    _TreeSitter.LANGUAGE_WASM[language]=path.join(mcpdirpath.replace('file:///',''),_TreeSitter.LANGUAGE_WASM[language])
}

// Command line argument parsing
const args = process.argv.slice(2);
if (args.length === 0) {
    console.error("Usage: scast <allowed-directory> [additional-directories...]");
    process.exit(1);
}
// Normalize all paths consistently
function normalizePath(p) {
    return path.normalize(p);
}
function expandHome(filepath) {
    if (filepath.startsWith('~/') || filepath === '~') {
        return path.join(os.homedir(), filepath.slice(1));
    }
    return filepath;
}
// Store allowed directories in normalized form
const allowedDirectories = args.map(dir => normalizePath(path.resolve(expandHome(dir))));
// Validate that all directories exist and are accessible
await Promise.all(args.map(async (dir) => {
    try {
        const stats = await fs.stat(dir);
        if (!stats.isDirectory()) {
            console.error(`Error: ${dir} is not a directory`);
            process.exit(1);
        }
    }
    catch (error) {
        console.error(`Error accessing directory ${dir}:`, error);
        process.exit(1);
    }
}));
// Security utilities
async function validatePath(requestedPath) {
    const expandedPath = expandHome(requestedPath);
    const absolute = path.isAbsolute(expandedPath)
        ? path.resolve(expandedPath)
        : path.resolve(process.cwd(), expandedPath);
    const normalizedRequested = normalizePath(absolute);
    const isAllowed = allowedDirectories.some(dir => normalizedRequested.startsWith(dir));
    if (!isAllowed) {
        throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`);
    }
    try {
        const realPath = await fs.realpath(absolute);
        const normalizedReal = normalizePath(realPath);
        const isRealPathAllowed = allowedDirectories.some(dir => normalizedReal.startsWith(dir));
        if (!isRealPathAllowed) {
            throw new Error("Access denied - symlink target outside allowed directories");
        }
        return realPath;
    }
    catch (error) {
        const parentDir = path.dirname(absolute);
        try {
            const realParentPath = await fs.realpath(parentDir);
            const normalizedParent = normalizePath(realParentPath);
            const isParentAllowed = allowedDirectories.some(dir => normalizedParent.startsWith(dir));
            if (!isParentAllowed) {
                throw new Error("Access denied - parent directory outside allowed directories");
            }
            return absolute;
        }
        catch {
            throw new Error(`Parent directory does not exist: ${parentDir}`);
        }
    }
}

function checkPort(host, port) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        resolve(false);
        socket.destroy();
      });
  
      socket.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          resolve(true);
        } else {
          reject(err);
        }
        socket.destroy();
      });
    });
}

async function startServer(mcpdir,lastdir){
    const runserver=await checkPort('localhost',5305)
    if(runserver){
        if (process.platform === 'win32') {
            spawn('start',['/min','node',path.join(mcpdir,'server.js'),mcpdir.replace(/\\?\/?mcp/,'')],{detached:true,stdio: 'ignore',shell:true})
        } else{
            spawn('nohup',['node',path.join(mcpdir,'server.js'),mcpdir.replace('mcp',''),'&'],{detached:true,stdio: 'ignore',shell:true})
        }
    }
    var ourl=lastdir?`http://localhost:5305?file=/tmp/${lastdir}.json`:"http://localhost:5305"
    try{
        if (process.platform === 'win32') {
            exec('start '+ourl)
        }
    }catch(err){
    }   
    return ourl
}


async function scastAnalysis(dir){
    var files=[]
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for(let entry of entries){
        let t=String(path.extname(entry.name)).toLocaleLowerCase();
        if(!entry.isDirectory()&&_TreeSitter.LANGUAGE_WASM[t.slice(1)])files.push(entry.name);
    }
    var ast={}
    const results = await Promise.all(files.map(async (file) => {
        try {
            const content = await fs.readFile(path.join(dir,file), "utf-8");
            return {
                code:content.replace(/\r\n/g,'\n'),
                filetype:file.split('.')[1],
                filename:file.split('.')[0]
            };
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            return {msg:errorMessage};
        }
    }));
    for(let r of results){
        ast[r.filename+'.'+r.filetype]=r
    }
    const mcpdir=path.parse(process.argv[1]).dir
    const lastdir=path.parse(dir).name
    const dirjson=path.join(mcpdir.replace('mcp','tmp'),`${lastdir}.json`)
    if(!existsSync(mcpdir.replace('mcp','tmp')))fs.mkdir(mcpdir.replace('mcp','tmp'))
    if(existsSync(dirjson)){
        const oldast=JSON.parse(await fs.readFile(dirjson, 'utf8'));
        updateAst(ast,oldast)
    }

    //headless
    await doHeadless(ast)
    await fs.writeFile(dirjson, JSON.stringify(ast), 'utf8');
    // var ourl=await startServer(mcpdir)//dev   

    // wait browser autosave 
    // await fs.writeFile(dirjson, JSON.stringify(ast), 'utf8');
    // await new Promise(resolve => setTimeout(resolve, 2000))
    // ast=JSON.parse(await fs.readFile(dirjson,'utf-8'))

    var ourl=await startServer(mcpdir,lastdir) 

    var keyword=getKeyword(ast)
    var keywordstr=""
    for(let k in keyword){
        keywordstr+=`- ${k} (${keyword[k].type}) ${keyword[k].analysis||''} \n`
    }
    return `${keywordstr}
--------
open [${ourl}](${ourl}) in browser to preview the analysis results. Click on the bottom-right corner to further analyze using ollama AI if needed.`
}
// scastAnalysis('C:\\Users\\DKZ\\workspace\\SCAST\\test')//dev

async function doHeadless(ast){
    for(let file in ast){
        let c=ast[file].code
        let filetype=ast[file].filetype
        let filename=ast[file].filename
        if(!ast[file].body&&!ast[file].children){
            ast[file]=await _TreeSitter.getAst(c,filename,filetype);
            ast[file]['code']=c
            ast[file]['filetype']=filetype
            ast[file]['filename']=filename
        }
    }
}

function updateAst(ast,oldast){
    for(let file in ast){
        if(oldast[file]&&ast[file].code==oldast[file].code){
            ast[file]=oldast[file];
        }
    }
}

const KEYWORDTYPE={'ClassDefine':'🆑','InterfaceDefine':'🔌','MethodDefine':'Ⓜ️','FunctionDefine':'🟦','FunctionDeclaration':'🟦','ClassDeclaration':'🆑','Class':'🆑','Interface':'🔌','Method':'Ⓜ️','Function':'🟦'}
function getKeyword(ast){
    var keyword={}
    for(let file in ast){
        var lines=ast[file].code.split('\n')

        traverseScast(ast[file],(node)=>{
            if(KEYWORDTYPE[node.type]){
                var lastnode;
                traverseScast(node,(n)=>{
                    lastnode=n
                })
                keyword[node.value]={
                    type:node.type,
                    analysis:node._analysis,
                    file:file,
                    t:ast[file].filetype,
                    code:lines.slice(node.poi.line-1,lastnode.poi.line+1).join('\n')
                }
            }
        })
    }
    return keyword
}

function traverseScast(node,callback){
    var isreturn=callback(node)
    if(isreturn===true)return
    if(node.body&&node.body.length>0){
        for(let n of node.body){
            traverseScast(n,callback)
        }
    }else if(!node.body&&node.children&&node.children.length>0){//TreeSitter
        for(let n of node.children){
            traverseScast(n,callback)
        }
    }
}

async function scastRetriever(dir,keywords){
    const mcpdir=path.parse(process.argv[1]).dir
    const lastdir=path.parse(dir).name
    const dirjson=path.join(mcpdir.replace('mcp','tmp'),`${lastdir}.json`)
    if(!existsSync(dirjson))await scastAnalysis(dir);
    const ast=JSON.parse(await fs.readFile(dirjson,'utf8'))
    var keyword=getKeyword(ast)
    var result=''
    for(let k of keywords){
        if(keyword[k]){
            result+=`${k} ${keyword[k].analysis||''}
${'```'}${keyword[k].t}
${keyword[k].code}
${'```'}
--------
`
        }
    }
    return result
}

// Server setup
const server = new Server({
    name: "scast",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
});

const ScastAnalysisArgsSchema = z.object({
    dir: z.string(),
});
const ScastRetrieverArgsSchema = z.object({
    dir: z.string(),
    keywords: z.array(z.string()),
});
// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: "scast_anaylisis",
                description: `
SCAST is a tool designed to assist users in analyzing and summarizing code through visualization. 
By simply providing the folder path where the code is located, 
SCAST can perform static analysis on the code,  generating an AST tree to helping users understand the code structure and explain its functionality.
Generate various visual charts such as UML diagrams, AST tree diagrams and Mermaid flowcharts.
Finally return a keyword list containing all class and method names along with their functionality explanations, and include a link to allow users to view the chart details in their browser.
                `,
                inputSchema: zodToJsonSchema(ScastAnalysisArgsSchema),
            },
            {
                name:"scast_retriever",
                description:`
SCAST is a tool that helps users analyze and summarize code and provides visualizations.
You need to provide the file path of the source code folder. SCAST will perform static analysis on the source codes in the folder, generating an AST tree to help users understand the code structure and explain its functionality.
After analyzing the code directory with SCAST, you can use keywords in the AST tree for searching, better answering user questions using a RAG method.
This keyword can be a class name, method name, or field name. SCAST will find the source code at its definition and return it.
                `,
                inputSchema: zodToJsonSchema(ScastRetrieverArgsSchema),
            }
        
        ],
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
        const { name, arguments: args } = request.params;
        switch (name) {
            case "scast_anaylisis": {
                const parsed = ScastAnalysisArgsSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for scast_anaylisis: ${parsed.error}`);
                }
                const validPath = await validatePath(parsed.data.dir);
                var result=await scastAnalysis(validPath)
                return {
                    content: [{ type: "text", text: result }],
                };
            }
            case "scast_retriever": {
                const parsed = ScastRetrieverArgsSchema.safeParse(args);
                if (!parsed.success) {
                    throw new Error(`Invalid arguments for scast_anaylisis: ${parsed.error}`);
                }
                const validPath = await validatePath(parsed.data.dir);
                var result=await scastRetriever(validPath,parsed.data.keywords)
                return {
                    content: [{ type: "text", text: result }],
                };
            }
           
            default:
                throw new Error(`Unknown tool: ${name}`);
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
            content: [{ type: "text", text: `Error: ${errorMessage}` }],
            isError: true,
        };
    }
});
// Start server
async function runServer() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("SCAST MCP Server running on stdio");
    console.error("Allowed directories:", allowedDirectories);
}
runServer().catch((error) => {
    console.error("Fatal error running server:", error);
    process.exit(1);
});
