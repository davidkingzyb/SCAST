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

// import { minimatch } from 'minimatch';
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
    // Check if path is within allowed directories
    const isAllowed = allowedDirectories.some(dir => normalizedRequested.startsWith(dir));
    if (!isAllowed) {
        throw new Error(`Access denied - path outside allowed directories: ${absolute} not in ${allowedDirectories.join(', ')}`);
    }
    // Handle symlinks by checking their real path
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
        // For new files that don't exist yet, verify parent directory
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

const SUPPORT_TYPE=['.js','.py','.cs','.ts']

async function scastAnalysis(dir){
    var files=[]
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for(let entry of entries){
        let t=String(path.extname(entry.name)).toLocaleLowerCase();
        if(!entry.isDirectory()&&SUPPORT_TYPE.indexOf(t)>=0)files.push(entry.name);
    }
    var ast={}
    const results = await Promise.all(files.map(async (file) => {
        try {
            const content = await fs.readFile(path.join(dir,file), "utf-8");
            return {
                code:content,
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
    const datajson=path.join(mcpdir.replace('mcp','tmp'),`${lastdir}.json`)
    if(!existsSync(mcpdir.replace('mcp','tmp')))fs.mkdir(mcpdir.replace('mcp','tmp'))
    await fs.writeFile(datajson, JSON.stringify(ast), 'utf8');
    const runserver=await checkPort('localhost',5305)
    if(runserver){
        try{
            if (process.platform === 'win32') {
                spawn('start',['/min','node',path.join(mcpdir,'server.js'),mcpdir.replace('mcp','')],{detached:true,stdio: 'ignore',shell:true})
            } else{
                spawn('nohup',['node',path.join(mcpdir,'server.js'),mcpdir.replace('mcp',''),'&'],{detached:true,stdio: 'ignore',shell:true})
            }
        }catch(err){
            return "start scast server error"
        }
    }
    const ourl=`http://localhost:5305?file=/tmp/${lastdir}.json`
    try{
        exec(ourl)
    }catch(err){

    }   
    return `open [${ourl}](${ourl}) in browser to preview the analysis results. Click on the bottom-right corner to further analyze using ollama AI if needed.`

}

function checkPort(host, port) {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        // 端口正在使用中
        resolve(false);
        socket.destroy();
      });
  
      socket.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
          // 端口未被占用
          resolve(true);
        } else {
          reject(err);
        }
        socket.destroy();
      });
    });
}

const ScastAnalysisArgsSchema = z.object({
    dir: z.string(),
});

// Server setup
const server = new Server({
    name: "scast",
    version: "0.1.0",
}, {
    capabilities: {
        tools: {},
    },
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
SCAST can perform static analysis on the code, helping users understand the code structure, explain its functionality.
generate various visual charts such as UML diagrams, AST tree diagrams and Mermaid flowcharts.
                `,
                inputSchema: zodToJsonSchema(ScastAnalysisArgsSchema),
            },

        
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
